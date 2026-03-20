"""
Módulo de Reportes – Genera PDFs para ventas, CRM y gastos.
"""
from __future__ import annotations

import io
from datetime import date, timedelta, datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_user, get_db, get_target_branch_id

# ─── ReportLab imports ───────────────────────────────────────────────────────
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

router = APIRouter()

# ─── Role helpers ─────────────────────────────────────────────────────────────

ROLES_CRM = {"Gerente", "Ventas", "Super Admin"}
ROLES_FINANCIAL_ADMIN = {"Gerente", "Coordinador", "Super Admin"}


def _role_name(user: models.User) -> str:
    if user.is_superuser:
        return "Super Admin"
    return (user.role.name if user.role else "")


def _require_role(user: models.User, allowed: set[str]) -> None:
    if not (_role_name(user) in allowed or user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a este reporte."
        )


# ─── PDF Helpers ──────────────────────────────────────────────────────────────

def _base_doc(title: str, subtitle: str) -> tuple[io.BytesIO, SimpleDocTemplate, list]:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    header_style = ParagraphStyle("Header", parent=styles["Title"], fontSize=16, textColor=colors.HexColor("#1E293B"), spaceAfter=4)
    sub_style = ParagraphStyle("Sub", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#64748B"), spaceAfter=12)

    story: list = [
        Paragraph("Munaysys – Nest Coworking", header_style),
        Paragraph(title, ParagraphStyle("T2", parent=styles["Heading2"], fontSize=13, textColor=colors.HexColor("#4F46E5"), spaceAfter=2)),
        Paragraph(subtitle, sub_style),
        HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=10),
    ]
    return buf, doc, story


def _table(data: list[list], col_widths: list[float] | None = None) -> Table:
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CBD5E1")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
    ]))
    return t


def _finalize(buf: io.BytesIO, doc: SimpleDocTemplate, story: list, filename: str) -> StreamingResponse:
    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def _currency(v: float) -> str:
    return f"${v:,.2f}"


# ─── REPORTE DIARIO ───────────────────────────────────────────────────────────

@router.get("/daily")
def daily_report(
    report_date: date = Query(default=None, description="Fecha del reporte (YYYY-MM-DD). Default: hoy."),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    """Reporte diario de ventas. Accesible por todos los roles."""
    if report_date is None:
        report_date = date.today()

    branch_id = target_branch_id
    # Date window (full day in UTC)
    day_start = datetime(report_date.year, report_date.month, report_date.day, 0, 0, 0, tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)

    # ── Órdenes del día ──
    q_orders = db.query(models.Orden).filter(
        models.Orden.date >= day_start,
        models.Orden.date < day_end,
    )
    if branch_id > 0:
        q_orders = q_orders.filter(models.Orden.branch_id == branch_id)
    orders = q_orders.all()

    # ── Recibos (pagos) del día ──
    receipt_ids = [r.id for o in orders for r in o.receipts]
    receipts = db.query(models.Receipt).filter(models.Receipt.id.in_(receipt_ids)).all() if receipt_ids else []

    # Agrupar por método de pago
    by_payment: dict[str, float] = {}
    for r in receipts:
        by_payment[r.payment_method] = by_payment.get(r.payment_method, 0.0) + r.amount

    # ── Ventas por tipo de ítem ──
    item_totals: dict[str, float] = {"product": 0.0, "room": 0.0, "office": 0.0, "amenity": 0.0, "service": 0.0, "package": 0.0}
    for o in orders:
        for d in o.details:
            key = d.item_type if d.item_type in item_totals else "service"
            item_totals[key] = item_totals.get(key, 0.0) + d.subtotal

    # ── Clientes con deuda ──
    # Órdenes pendientes/parciales con balance > 0
    q_debts = db.query(models.Orden).filter(
        models.Orden.status.in_(["pending", "partial"])
    )
    if branch_id > 0:
        q_debts = q_debts.filter(models.Orden.branch_id == branch_id)
    debt_orders = q_debts.all()

    clients_with_debt: dict[int, dict] = {}
    for o in debt_orders:
        paid = sum(r.amount for r in o.receipts if r.type == "income")
        balance = o.total - paid
        if balance > 0.01:
            cid = o.client_id
            if cid not in clients_with_debt:
                clients_with_debt[cid] = {"name": o.client.name if o.client else "N/A", "balance": 0.0}
            clients_with_debt[cid]["balance"] += balance

    # ── Build PDF ──
    total_day = sum(o.total for o in orders)
    buf, doc, story = _base_doc(
        f"Reporte Diario de Ventas",
        f"Fecha: {report_date.strftime('%d/%m/%Y')}  |  Total órdenes: {len(orders)}  |  Total: {_currency(total_day)}"
    )

    styles = getSampleStyleSheet()
    h3 = ParagraphStyle("h3", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#1E293B"), spaceBefore=12, spaceAfter=6)

    # 1. Ventas por método de pago
    story.append(Paragraph("1. Ingresos por Método de Pago", h3))
    if by_payment:
        pay_data = [["Método de Pago", "Monto"]]
        for m, v in sorted(by_payment.items()):
            pay_data.append([m, _currency(v)])
        pay_data.append(["TOTAL", _currency(sum(by_payment.values()))])
        t = _table(pay_data, [10 * cm, 5 * cm])
        t.setStyle(TableStyle([
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EEF2FF")),
        ]), overrideList=False)
        story.append(t)
    else:
        story.append(Paragraph("Sin pagos registrados para este día.", styles["Normal"]))

    story.append(Spacer(1, 0.3 * cm))

    # 2. Ventas por categoría de ítem
    story.append(Paragraph("2. Ventas por Categoría de Ítem", h3))
    labels = {"product": "Productos", "room": "Salas", "office": "Oficinas", "amenity": "Amenidades", "service": "Servicios", "package": "Paquetes"}
    cat_data = [["Categoría", "Monto"]]
    for k, label in labels.items():
        if item_totals.get(k, 0.0) > 0:
            cat_data.append([label, _currency(item_totals[k])])
    if len(cat_data) == 1:
        story.append(Paragraph("Sin ventas por categoría para este día.", styles["Normal"]))
    else:
        story.append(_table(cat_data, [10 * cm, 5 * cm]))

    story.append(Spacer(1, 0.3 * cm))

    # 3. Detalle de órdenes
    story.append(Paragraph("3. Detalle de Órdenes del Día", h3))
    if orders:
        ord_data = [["#", "Cliente", "Estado", "Total", "Pagado"]]
        for o in orders:
            paid = sum(r.amount for r in o.receipts if r.type == "income")
            ord_data.append([
                str(o.id),
                o.client.name if o.client else "N/A",
                o.status,
                _currency(o.total),
                _currency(paid),
            ])
        story.append(_table(ord_data, [1.5 * cm, 7 * cm, 2.5 * cm, 3 * cm, 3 * cm]))
    else:
        story.append(Paragraph("No hay órdenes para este día.", styles["Normal"]))

    story.append(Spacer(1, 0.3 * cm))

    # 4. Clientes con deuda
    story.append(Paragraph("4. Estado de Cuenta – Clientes con Saldo Pendiente", h3))
    if clients_with_debt:
        debt_data = [["Cliente", "Saldo Pendiente"]]
        for cid, info in sorted(clients_with_debt.items(), key=lambda x: -x[1]["balance"]):
            debt_data.append([info["name"], _currency(info["balance"])])
        debt_data.append(["TOTAL", _currency(sum(v["balance"] for v in clients_with_debt.values()))])
        story.append(_table(debt_data, [12 * cm, 5 * cm]))
    else:
        story.append(Paragraph("No hay clientes con saldo pendiente.", styles["Normal"]))

    return _finalize(buf, doc, story, f"reporte_diario_{report_date}.pdf")


# ─── REPORTE DE VENTAS (CRM) ─────────────────────────────────────────────────

@router.get("/sales")
def sales_report(
    start: date = Query(..., description="Fecha inicio (YYYY-MM-DD)"),
    end: date = Query(..., description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    """Reporte de ventas totales y por categoría. Roles: Ventas, Gerente, SuperAdmin."""
    _require_role(current_user, ROLES_CRM)

    branch_id = target_branch_id
    start_dt = datetime(start.year, start.month, start.day, 0, 0, 0, tzinfo=timezone.utc)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc)

    q = db.query(models.Orden).filter(
        models.Orden.date >= start_dt,
        models.Orden.date <= end_dt,
    )
    if branch_id > 0:
        q = q.filter(models.Orden.branch_id == branch_id)
    orders = q.all()

    total_bruto = sum(o.total for o in orders)
    total_pagado = sum(
        sum(r.amount for r in o.receipts if r.type == "income") for o in orders
    )

    # Ventas por categoría de ítem
    cat_totals: dict[str, float] = {}
    for o in orders:
        for d in o.details:
            cat_totals[d.item_type] = cat_totals.get(d.item_type, 0.0) + d.subtotal

    # Ventas por día
    daily_totals: dict[str, float] = {}
    for o in orders:
        day_key = o.date.strftime("%Y-%m-%d") if o.date else "?"
        daily_totals[day_key] = daily_totals.get(day_key, 0.0) + o.total

    buf, doc, story = _base_doc(
        "Reporte de Ventas",
        f"Período: {start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}  |  Órdenes: {len(orders)}  |  Total: {_currency(total_bruto)}"
    )
    styles = getSampleStyleSheet()
    h3 = ParagraphStyle("h3", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#1E293B"), spaceBefore=12, spaceAfter=6)

    # 1. Resumen general
    story.append(Paragraph("1. Resumen General", h3))
    summary_data = [
        ["Concepto", "Monto"],
        ["Total Ventas (bruto)", _currency(total_bruto)],
        ["Total Cobrado", _currency(total_pagado)],
        ["Saldo por Cobrar", _currency(total_bruto - total_pagado)],
        ["Cantidad de Órdenes", str(len(orders))],
    ]
    story.append(_table(summary_data, [10 * cm, 5 * cm]))
    story.append(Spacer(1, 0.3 * cm))

    # 2. Ventas por categoría
    story.append(Paragraph("2. Ventas por Categoría de Ítem", h3))
    labels = {"product": "Productos", "room": "Salas", "office": "Oficinas", "amenity": "Amenidades", "service": "Servicios", "package": "Paquetes"}
    cat_data = [["Categoría", "Monto"]]
    for k in ["product", "service", "room", "office", "amenity", "package"]:
        if cat_totals.get(k, 0.0) > 0:
            cat_data.append([labels.get(k, k), _currency(cat_totals[k])])
    if len(cat_data) == 1:
        story.append(Paragraph("Sin ventas por categoría en este período.", styles["Normal"]))
    else:
        story.append(_table(cat_data, [10 * cm, 5 * cm]))
    story.append(Spacer(1, 0.3 * cm))

    # 3. Ventas por día
    story.append(Paragraph("3. Ventas por Día", h3))
    if daily_totals:
        daily_data = [["Fecha", "Total"]]
        for day in sorted(daily_totals.keys()):
            daily_data.append([day, _currency(daily_totals[day])])
        story.append(_table(daily_data, [10 * cm, 5 * cm]))
    else:
        story.append(Paragraph("Sin datos para este período.", styles["Normal"]))

    story.append(Spacer(1, 0.3 * cm))

    # 4. Detalle de órdenes
    story.append(Paragraph("4. Detalle de Órdenes", h3))
    if orders:
        ord_data = [["#", "Fecha", "Cliente", "Estado", "Total"]]
        for o in orders:
            ord_data.append([
                str(o.id),
                o.date.strftime("%d/%m/%Y") if o.date else "",
                o.client.name if o.client else "N/A",
                o.status,
                _currency(o.total),
            ])
        story.append(_table(ord_data, [1.5 * cm, 3 * cm, 7 * cm, 2.5 * cm, 3 * cm]))
    else:
        story.append(Paragraph("No hay órdenes en este período.", styles["Normal"]))

    return _finalize(buf, doc, story, f"reporte_ventas_{start}_{end}.pdf")


# ─── REPORTE CRM (leads + oportunidades) ──────────────────────────────────────

@router.get("/crm")
def crm_report(
    start: date = Query(..., description="Fecha inicio (YYYY-MM-DD)"),
    end: date = Query(..., description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    """Reporte de CRM: leads y oportunidades. Roles: Ventas, Gerente, SuperAdmin."""
    _require_role(current_user, ROLES_CRM)

    branch_id = target_branch_id
    start_dt = datetime(start.year, start.month, start.day, 0, 0, 0, tzinfo=timezone.utc)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc)

    q_leads = db.query(models.Lead).filter(
        models.Lead.created_at >= start_dt,
        models.Lead.created_at <= end_dt,
    )
    if branch_id > 0:
        q_leads = q_leads.filter(models.Lead.branch_id == branch_id)
    leads = q_leads.all()

    lead_ids = [l.id for l in leads]
    opportunities = []
    if lead_ids:
        opportunities = db.query(models.Opportunity).filter(
            models.Opportunity.lead_id.in_(lead_ids)
        ).all()

    # Stats
    total_opp_value = sum(o.estimated_value or 0.0 for o in opportunities)
    won_opps = [o for o in opportunities if o.won_date]
    lost_opps = [o for o in opportunities if o.lost_reason]

    # Leads by source
    by_source: dict[str, int] = {}
    for l in leads:
        src = l.source or "Desconocido"
        by_source[src] = by_source.get(src, 0) + 1

    # Stages
    stages_map: dict[str, int] = {}
    for o in opportunities:
        sname = o.stage.name if o.stage else "Sin Etapa"
        stages_map[sname] = stages_map.get(sname, 0) + 1

    buf, doc, story = _base_doc(
        "Reporte CRM",
        f"Período: {start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}  |  Leads captados: {len(leads)}"
    )
    styles = getSampleStyleSheet()
    h3 = ParagraphStyle("h3", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#1E293B"), spaceBefore=12, spaceAfter=6)

    # 1. Resumen
    story.append(Paragraph("1. Resumen de CRM", h3))
    data = [
        ["Concepto", "Valor"],
        ["Total Leads", str(len(leads))],
        ["Total Oportunidades", str(len(opportunities))],
        ["Oportunidades Ganadas", str(len(won_opps))],
        ["Oportunidades Perdidas", str(len(lost_opps))],
        ["Valor Total Estimado", _currency(total_opp_value)],
    ]
    story.append(_table(data, [10 * cm, 5 * cm]))
    story.append(Spacer(1, 0.3 * cm))

    # 2. Leads por fuente
    story.append(Paragraph("2. Leads por Fuente", h3))
    src_data = [["Fuente", "Cantidad"]]
    for src, cnt in sorted(by_source.items()):
        src_data.append([src, str(cnt)])
    story.append(_table(src_data, [10 * cm, 5 * cm]))
    story.append(Spacer(1, 0.3 * cm))

    # 3. Oportunidades por etapa
    story.append(Paragraph("3. Oportunidades por Etapa", h3))
    stage_data = [["Etapa del Pipeline", "Cantidad"]]
    for st, cnt in sorted(stages_map.items()):
        stage_data.append([st, str(cnt)])
    if len(stage_data) == 1:
        story.append(Paragraph("Sin oportunidades para este período.", styles["Normal"]))
    else:
        story.append(_table(stage_data, [10 * cm, 5 * cm]))
    story.append(Spacer(1, 0.3 * cm))

    # 4. Detalle de leads
    story.append(Paragraph("4. Detalle de Leads", h3))
    if leads:
        lead_data = [["Nombre", "Email", "Fuente", "Estado", "Fecha"]]
        for l in leads:
            lead_data.append([
                l.name,
                l.email or "",
                l.source or "",
                l.status,
                l.created_at.strftime("%d/%m/%Y") if l.created_at else "",
            ])
        story.append(_table(lead_data, [5 * cm, 5 * cm, 3 * cm, 2.5 * cm, 3 * cm]))
    else:
        story.append(Paragraph("No hay leads en este período.", styles["Normal"]))

    return _finalize(buf, doc, story, f"reporte_crm_{start}_{end}.pdf")


# ─── REPORTE DE GASTOS / COMPRAS / CxP ───────────────────────────────────────

@router.get("/expenses")
def expenses_report(
    start: date = Query(..., description="Fecha inicio (YYYY-MM-DD)"),
    end: date = Query(..., description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    """Reporte de gastos, compras y cuentas por pagar. Roles: Coordinador, Gerente, SuperAdmin."""
    _require_role(current_user, ROLES_FINANCIAL_ADMIN)

    branch_id = target_branch_id
    start_dt = datetime(start.year, start.month, start.day, 0, 0, 0, tzinfo=timezone.utc)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc)

    # Gastos
    q_exp = db.query(models.Expense).filter(
        models.Expense.date >= start_dt,
        models.Expense.date <= end_dt,
    )
    if branch_id > 0:
        q_exp = q_exp.filter(models.Expense.branch_id == branch_id)
    expenses = q_exp.all()

    # Compras
    q_pur = db.query(models.Purchase).filter(
        models.Purchase.date >= start_dt,
        models.Purchase.date <= end_dt,
    )
    if branch_id > 0:
        q_pur = q_pur.filter(models.Purchase.branch_id == branch_id)
    purchases = q_pur.all()

    # Cuentas por pagar (pendientes o vencidas)
    q_pay = db.query(models.Payable).filter(
        models.Payable.status.in_(["pending"])
    )
    if branch_id > 0:
        q_pay = q_pay.filter(models.Payable.branch_id == branch_id)
    payables = q_pay.all()

    # Totales
    total_expenses = sum(e.amount for e in expenses)
    total_purchases = sum(p.total for p in purchases)
    total_payables = sum(p.amount for p in payables)

    # Gastos por categoría
    by_cat: dict[str, float] = {}
    for e in expenses:
        cat = e.category or "Sin Categoría"
        by_cat[cat] = by_cat.get(cat, 0.0) + e.amount

    buf, doc, story = _base_doc(
        "Reporte de Gastos, Compras y Cuentas por Pagar",
        f"Período: {start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}"
    )
    styles = getSampleStyleSheet()
    h3 = ParagraphStyle("h3", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#1E293B"), spaceBefore=12, spaceAfter=6)

    # 1. Resumen
    story.append(Paragraph("1. Resumen", h3))
    sum_data = [
        ["Concepto", "Monto"],
        ["Total Gastos", _currency(total_expenses)],
        ["Total Compras", _currency(total_purchases)],
        ["Total Cuentas por Pagar (pendiente)", _currency(total_payables)],
        ["TOTAL EGRESOS", _currency(total_expenses + total_purchases)],
    ]
    t = _table(sum_data, [10 * cm, 5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#FEF2F2")),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#991B1B")),
    ]), overrideList=False)
    story.append(t)
    story.append(Spacer(1, 0.3 * cm))

    # 2. Gastos por categoría
    story.append(Paragraph("2. Gastos por Categoría", h3))
    cat_data = [["Categoría", "Monto"]]
    for cat, amt in sorted(by_cat.items()):
        cat_data.append([cat, _currency(amt)])
    if len(cat_data) == 1:
        story.append(Paragraph("Sin gastos en este período.", styles["Normal"]))
    else:
        story.append(_table(cat_data, [10 * cm, 5 * cm]))
    story.append(Spacer(1, 0.3 * cm))

    # 3. Detalle de gastos
    story.append(Paragraph("3. Detalle de Gastos", h3))
    if expenses:
        exp_data = [["Fecha", "Categoría", "Descripción", "Monto"]]
        for e in expenses:
            exp_data.append([
                e.date.strftime("%d/%m/%Y") if e.date else "",
                e.category or "",
                (e.description or "")[:40],
                _currency(e.amount),
            ])
        story.append(_table(exp_data, [3 * cm, 3.5 * cm, 8 * cm, 3 * cm]))
    else:
        story.append(Paragraph("No hay gastos en este período.", styles["Normal"]))
    story.append(Spacer(1, 0.3 * cm))

    # 4. Detalle de compras
    story.append(Paragraph("4. Detalle de Compras", h3))
    if purchases:
        pur_data = [["#", "Fecha", "Proveedor", "Estado", "Total"]]
        for p in purchases:
            pur_data.append([
                str(p.id),
                p.date.strftime("%d/%m/%Y") if p.date else "",
                p.provider_name or "",
                p.status,
                _currency(p.total),
            ])
        story.append(_table(pur_data, [1.5 * cm, 3 * cm, 7 * cm, 2.5 * cm, 3 * cm]))
    else:
        story.append(Paragraph("No hay compras en este período.", styles["Normal"]))
    story.append(Spacer(1, 0.3 * cm))

    # 5. Cuentas por pagar (pendientes)
    story.append(Paragraph("5. Cuentas por Pagar Pendientes", h3))
    if payables:
        pay_data = [["Proveedor", "Referencia", "Vencimiento", "Monto"]]
        for p in payables:
            due_str = p.due_date.strftime("%d/%m/%Y") if p.due_date else ""
            pay_data.append([
                p.provider.name if p.provider else "N/A",
                p.reference or "",
                due_str,
                _currency(p.amount),
            ])
        story.append(_table(pay_data, [5 * cm, 4 * cm, 4 * cm, 4 * cm]))
    else:
        story.append(Paragraph("No hay cuentas por pagar pendientes.", styles["Normal"]))

    return _finalize(buf, doc, story, f"reporte_gastos_{start}_{end}.pdf")
