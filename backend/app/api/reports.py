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

from app.utils.reports_helper import render_html_to_pdf

# NEW: BCV Rate helper with DB persistence
async def _get_rates_for_date(db: Session, target_date: date):
    # Try to find in DB
    rate_entry = db.query(models.ExchangeRate).filter(models.ExchangeRate.date == target_date).first()
    if rate_entry:
        return float(rate_entry.usd_rate), float(rate_entry.eur_rate)

    # If not found and it's today, try to fetch from BCV
    if target_date == date.today():
        try:
            from currency_rate_bcv import Currency
            currency = Currency()
            usd_val = await currency.getDollar
            eur_val = await currency.getEuro
            usd = float(usd_val or 0.0)
            eur = float(eur_val or 0.0)
            
            if usd > 0:
                # Save to DB for future use
                new_rate = models.ExchangeRate(date=target_date, usd_rate=usd, eur_rate=eur)
                db.add(new_rate)
                try:
                    db.commit()
                except Exception:
                    db.rollback()
            return usd, eur
        except Exception:
            pass
            
    # Fallback to the latest available rate
    latest = db.query(models.ExchangeRate).order_by(models.ExchangeRate.date.desc()).first()
    if latest:
        return float(latest.usd_rate), float(latest.eur_rate)
        
    return 0.0, 0.0

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

def _base_doc(title: str, subtitle: str, rates: tuple[float, float] = (0.0, 0.0)) -> tuple[io.BytesIO, SimpleDocTemplate, list]:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )
    styles = getSampleStyleSheet()
    header_style = ParagraphStyle("Header", parent=styles["Title"], fontSize=16, textColor=colors.HexColor("#1E293B"), spaceAfter=4)
    sub_style = ParagraphStyle("Sub", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#64748B"), spaceAfter=6)
    rate_style = ParagraphStyle("Rates", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#475569"), alignment=TA_RIGHT)

    usd, eur = rates
    rate_text = f"Tasa BCV: USD {usd:,.2f} | EUR {eur:,.2f}" if usd > 0 else "Tasa BCV: No disponible"
    
    story: list = [
        Paragraph(rate_text, rate_style),
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
    try:
        doc.build(story)
    except Exception as e:
        import logging, sys, traceback
        logging.getLogger("uvicorn").error(f"Error building PDF {filename}: {str(e)}")
        print(f"CRITICAL ERROR BUILDING PDF {filename}: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar el PDF: {str(e)}"
        )
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def _currency(v: float, rate: float = 0.0) -> str:
    if v is None:
        v = 0.0
    usd_str = f"${v:,.2f}"
    if rate > 0:
        bs_val = v * rate
        return f"{usd_str} (Bs {bs_val:,.2f})"
    return usd_str


# ─── REPORTE DIARIO ───────────────────────────────────────────────────────────

@router.get("/daily")
async def daily_report(
    report_date: date = Query(default=None, description="Fecha del reporte (YYYY-MM-DD). Default: hoy."),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    """Reporte diario de ventas. Accesible por todos los roles."""
    if report_date is None:
        report_date = date.today()

    branch_id = target_branch_id
    # Date window (full day in local/server time for queries)
    day_start = datetime(report_date.year, report_date.month, report_date.day, 0, 0, 0)
    day_end = day_start + timedelta(days=1)

    # Branch Name
    branch_name = "Todas las Sedes"
    if branch_id > 0:
        branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
        branch_name = branch.name if branch else "Desconocida"

    # ── Órdenes del día ──
    q_orders = db.query(models.Orden).filter(
        models.Orden.date >= day_start,
        models.Orden.date < day_end,
    )
    if branch_id > 0:
        q_orders = q_orders.filter(models.Orden.branch_id == branch_id)
    orders = q_orders.all()

    # ── Recibos (pagos) del día ──
    # Note:Receipt has its own date, we should probably use receipts created on that day too
    q_receipts = db.query(models.Receipt).filter(
        models.Receipt.date >= day_start,
        models.Receipt.date < day_end,
    )
    if branch_id > 0:
        q_receipts = q_receipts.filter(models.Receipt.branch_id == branch_id)
    receipts = q_receipts.all()

    rates = await _get_rates_for_date(db, report_date)
    usd_rate, eur_rate = rates

    # Agrupar por método de pago
    by_payment: dict[str, float] = {}
    total_income = 0.0
    for r in receipts:
        if r.type == "income":
            method = str(r.payment_method) if r.payment_method else "Desconocido"
            amount = float(r.amount or 0.0)
            by_payment[method] = by_payment.get(method, 0.0) + amount
            total_income += amount

    # ── Ventas por tipo de ítem ──
    item_totals: dict[str, float] = {"product": 0.0, "room": 0.0, "office": 0.0, "amenity": 0.0, "service": 0.0, "package": 0.0}
    total_sales = 0.0
    for o in orders:
        total_sales += float(o.total or 0.0)
        for d in o.details:
            key = d.item_type if d.item_type in item_totals else "service"
            item_totals[key] = item_totals.get(key, 0.0) + float(d.subtotal or 0.0)

    # ── Clientes con deuda ──
    q_debts = db.query(models.Orden).filter(
        models.Orden.status.in_(["pending", "partial"])
    )
    if branch_id > 0:
        q_debts = q_debts.filter(models.Orden.branch_id == branch_id)
    debt_orders = q_debts.all()

    clients_with_debt: dict[int, dict] = {}
    total_debt = 0.0
    for o in debt_orders:
        paid = sum(float(r.amount or 0.0) for r in o.receipts if r.type == "income")
        balance = float(o.total or 0.0) - paid
        if balance > 0.01:
            cid = o.client_id
            if cid not in clients_with_debt:
                clients_with_debt[cid] = {"name": str(o.client.name) if o.client and o.client.name else "N/A", "balance": 0.0}
            clients_with_debt[cid]["balance"] += balance
            total_debt += balance

    # Prepare context for template
    context = {
        "date": report_date.strftime("%d/%m/%Y"),
        "branch_name": branch_name,
        "usd_rate": usd_rate,
        "eur_rate": eur_rate,
        "totals": {
            "total": total_sales,
            "office": item_totals["office"],
            "room": item_totals["room"],
            "product": item_totals["product"],
            "service": item_totals["service"],
            "package": item_totals["package"],
            "income": total_income,
            "total_debt": total_debt
        },
        "by_payment": by_payment,
        "orders": [
            {
                "id": o.id,
                "client_name": o.client.name if o.client else "N/A",
                "status": o.status,
                "total": float(o.total or 0.0),
                "paid": sum(float(r.amount or 0.0) for r in o.receipts if r.type == "income")
            } for o in orders
        ],
        "debts": sorted(clients_with_debt.values(), key=lambda x: -x["balance"]),
        "now": datetime.now().strftime("%d/%m/%Y %H:%M")
    }

    pdf_buf = render_html_to_pdf("daily_report.html", context)
    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reporte_diario_{report_date}.pdf"}
    )


@router.get("/cashflow/income")
async def cashflow_income_report(
    start: date = Query(..., description="Fecha inicio (YYYY-MM-DD)"),
    end: date = Query(..., description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    """Reporte de ingresos de flujo de caja."""
    _require_role(current_user, ROLES_FINANCIAL_ADMIN)
    
    branch_id = target_branch_id
    start_dt = datetime(start.year, start.month, start.day, 0, 0, 0)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59)

    q = db.query(models.CashMovement).filter(
        models.CashMovement.type == "income",
        models.CashMovement.date >= start_dt,
        models.CashMovement.date <= end_dt
    )
    if branch_id > 0:
        q = q.filter(models.CashMovement.branch_id == branch_id)
    
    movements = q.order_by(models.CashMovement.date.asc()).all()
    
    # Branch Name
    branch_name = "Todas las Sedes"
    if branch_id > 0:
        branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
        branch_name = branch.name if branch else "Desconocida"

    rates = await _get_rates_for_date(db, date.today()) # Use current rate for conversion display
    usd_rate, eur_rate = rates

    total_amount = sum(m.amount for m in movements)
    
    context = {
        "report_type": "Ingresos",
        "date_range": f"{start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}",
        "branch_name": branch_name,
        "usd_rate": usd_rate,
        "eur_rate": eur_rate,
        "total_amount": total_amount,
        "movements": [
            {
                "date": m.date.strftime("%d/%m/%Y"),
                "category": m.category,
                "description": m.description,
                "entity_name": m.client_name or "-",
                "payment_method": m.payment_method or "-",
                "amount": m.amount
            } for m in movements
        ],
        "now": datetime.now().strftime("%d/%m/%Y %H:%M")
    }

    pdf_buf = render_html_to_pdf("cashflow_report.html", context)
    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reporte_ingresos_{start}_{end}.pdf"}
    )


@router.get("/cashflow/expense")
async def cashflow_expense_report(
    start: date = Query(..., description="Fecha inicio (YYYY-MM-DD)"),
    end: date = Query(..., description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    """Reporte de egresos de flujo de caja."""
    _require_role(current_user, ROLES_FINANCIAL_ADMIN)
    
    branch_id = target_branch_id
    start_dt = datetime(start.year, start.month, start.day, 0, 0, 0)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59)

    q = db.query(models.CashMovement).filter(
        models.CashMovement.type == "expense",
        models.CashMovement.date >= start_dt,
        models.CashMovement.date <= end_dt
    )
    if branch_id > 0:
        q = q.filter(models.CashMovement.branch_id == branch_id)
    
    movements = q.order_by(models.CashMovement.date.asc()).all()
    
    # Branch Name
    branch_name = "Todas las Sedes"
    if branch_id > 0:
        branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
        branch_name = branch.name if branch else "Desconocida"

    rates = await _get_rates_for_date(db, date.today())
    usd_rate, eur_rate = rates

    total_amount = sum(m.amount for m in movements)
    
    context = {
        "report_type": "Egresos",
        "date_range": f"{start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}",
        "branch_name": branch_name,
        "usd_rate": usd_rate,
        "eur_rate": eur_rate,
        "total_amount": total_amount,
        "movements": [
            {
                "date": m.date.strftime("%d/%m/%Y"),
                "category": m.category,
                "description": m.description,
                "entity_name": m.provider_name or "-",
                "payment_method": m.payment_method or "-",
                "amount": m.amount
            } for m in movements
        ],
        "now": datetime.now().strftime("%d/%m/%Y %H:%M")
    }

    pdf_buf = render_html_to_pdf("cashflow_report.html", context)
    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reporte_egresos_{start}_{end}.pdf"}
    )
@router.get("/sales")
async def sales_report(
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

    rates = await _get_rates()
    usd_rate = rates[0]

    buf, doc, story = _base_doc(
        "Reporte de Ventas",
        f"Período: {start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}  |  Órdenes: {len(orders)}  |  Total: {_currency(total_bruto, usd_rate)}",
        rates=rates
    )
    styles = getSampleStyleSheet()
    h3 = ParagraphStyle("h3", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#1E293B"), spaceBefore=12, spaceAfter=6)

    # 1. Resumen general
    story.append(Paragraph("1. Resumen General", h3))
    summary_data = [
        ["Concepto", "Monto"],
        ["Total Ventas (bruto)", _currency(total_bruto, usd_rate)],
        ["Total Cobrado", _currency(total_pagado, usd_rate)],
        ["Saldo por Cobrar", _currency(total_bruto - total_pagado, usd_rate)],
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
            cat_data.append([labels.get(k, k), _currency(cat_totals[k], usd_rate)])
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
            daily_data.append([day, _currency(daily_totals[day], usd_rate)])
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
                _currency(o.total, usd_rate),
            ])
        story.append(_table(ord_data, [1.5 * cm, 3 * cm, 7 * cm, 2.5 * cm, 3 * cm]))
    else:
        story.append(Paragraph("No hay órdenes en este período.", styles["Normal"]))

    return _finalize(buf, doc, story, f"reporte_ventas_{start}_{end}.pdf")


# ─── REPORTE CRM (leads + oportunidades) ──────────────────────────────────────

@router.get("/crm")
async def crm_report(
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

    rates = await _get_rates()
    usd_rate = rates[0]

    buf, doc, story = _base_doc(
        "Reporte CRM",
        f"Período: {start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}  |  Leads captados: {len(leads)}",
        rates=rates
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
        ["Valor Total Estimado", _currency(total_opp_value, usd_rate)],
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
                str(l.name or "N/A"),
                str(l.email or ""),
                str(l.source or ""),
                str(l.status or ""),
                l.created_at.strftime("%d/%m/%Y") if l.created_at else "",
            ])
        story.append(_table(lead_data, [5 * cm, 5 * cm, 3 * cm, 2.5 * cm, 3 * cm]))
    else:
        story.append(Paragraph("No hay leads en este período.", styles["Normal"]))

    return _finalize(buf, doc, story, f"reporte_crm_{start}_{end}.pdf")


# ─── REPORTE DE GASTOS / COMPRAS / CxP ───────────────────────────────────────

@router.get("/expenses")
async def expenses_report(
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

    rates = await _get_rates()
    usd_rate = rates[0]

    buf, doc, story = _base_doc(
        "Reporte de Gastos, Compras y Cuentas por Pagar",
        f"Período: {start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}",
        rates=rates
    )
    styles = getSampleStyleSheet()
    h3 = ParagraphStyle("h3", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#1E293B"), spaceBefore=12, spaceAfter=6)

    # 1. Resumen
    story.append(Paragraph("1. Resumen", h3))
    sum_data = [
        ["Concepto", "Monto"],
        ["Total Gastos", _currency(total_expenses, usd_rate)],
        ["Total Compras", _currency(total_purchases, usd_rate)],
        ["Total Cuentas por Pagar (pendiente)", _currency(total_payables, usd_rate)],
        ["TOTAL EGRESOS", _currency(total_expenses + total_purchases, usd_rate)],
    ]
    t = _table(sum_data, [10 * cm, 5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#FEF2F2")),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#991B1B")),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3 * cm))

    # 2. Gastos por categoría
    story.append(Paragraph("2. Gastos por Categoría", h3))
    cat_data = [["Categoría", "Monto"]]
    for cat, amt in sorted(by_cat.items()):
        cat_data.append([cat, _currency(amt, usd_rate)])
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
                _currency(e.amount, usd_rate),
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
                _currency(p.total, usd_rate),
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
                str(p.provider.name) if p.provider and p.provider.name else "N/A",
                str(p.reference or ""),
                due_str,
                _currency(p.amount, usd_rate),
            ])
        story.append(_table(pay_data, [5 * cm, 4 * cm, 4 * cm, 4 * cm]))
    else:
        story.append(Paragraph("No hay cuentas por pagar pendientes.", styles["Normal"]))

    return _finalize(buf, doc, story, f"reporte_gastos_{start}_{end}.pdf")
