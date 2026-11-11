"""
Módulo de Reportes – Genera PDFs para ventas, CRM y gastos.
Refactorizado para usar Unit of Work y Arquitectura Limpia.
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
from app.api.deps import get_current_user, get_uow, get_target_branch_id
from app.uow.unit_of_work import UnitOfWork

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

# Helper to fetch exchange rates via UoW
async def _get_rates_for_date(uow: UnitOfWork, target_date: date):
    # 1. Intento exacto para la fecha
    rate_entry = uow.exchange_rates.db.query(models.ExchangeRate).filter(models.ExchangeRate.date == target_date).first()
    if rate_entry:
        return float(rate_entry.usd_rate), float(rate_entry.eur_rate)

    # 2. Si es hoy y no está, intentamos forzar actualización (backup del cron)
    if target_date == date.today():
        try:
            from app.tasks.exchange_rates import update_exchange_rates
            await update_exchange_rates()
            # Re-consultar
            rate_entry = uow.exchange_rates.db.query(models.ExchangeRate).filter(models.ExchangeRate.date == target_date).first()
            if rate_entry:
                return float(rate_entry.usd_rate), float(rate_entry.eur_rate)
        except Exception:
            pass
            
    # 3. Fallback histórico: buscar la tasa más reciente anterior a la fecha solicitada
    prev_rate = uow.exchange_rates.db.query(models.ExchangeRate).filter(
        models.ExchangeRate.date <= target_date
    ).order_by(models.ExchangeRate.date.desc()).first()
    
    if prev_rate:
        return float(prev_rate.usd_rate), float(prev_rate.eur_rate)
        
    # 4. Fallback final: cualquier tasa que tengamos (la más reciente de todas)
    latest = uow.exchange_rates.get_latest()
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para acceder a este reporte.")

# ─── PDF Helpers ──────────────────────────────────────────────────────────────
def _base_doc(title: str, subtitle: str, rates: tuple[float, float] = (0.0, 0.0)) -> tuple[io.BytesIO, SimpleDocTemplate, list]:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = getSampleStyleSheet()
    header_style = ParagraphStyle("Header", parent=styles["Title"], fontSize=16, textColor=colors.HexColor("#1E293B"), spaceAfter=4)
    sub_style = ParagraphStyle("Sub", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#64748B"), spaceAfter=6)
    rate_style = ParagraphStyle("Rates", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#475569"), alignment=TA_RIGHT)

    usd, eur = rates
    rate_text = f"Tasa BCV: USD {usd:,.2f} | EUR {eur:,.2f}" if usd > 0 else "Tasa BCV: No disponible"
    
    story = [
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
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CBD5E1")),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
    ]))
    return t

def _finalize(buf: io.BytesIO, doc: SimpleDocTemplate, story: list, filename: str) -> StreamingResponse:
    doc.build(story)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})

def _currency(v: float, rate: float = 0.0, curr: str = "eur") -> str:
    if v is None: v = 0.0
    symbol = "$" if curr.lower() == "usd" else "€"
    val_str = f"{symbol}{v:,.2f}"
    if rate > 0:
        return f"{val_str} (Bs {v * rate:,.2f})"
    return val_str

# ─── DATA FETCHERS ────────────────────────────────────────────────────────────

async def _get_daily_report_data(uow: UnitOfWork, report_date: date, target_branch_id: int):
    day_start = datetime(report_date.year, report_date.month, report_date.day)
    day_end = day_start + timedelta(days=1)

    branch = uow.branches.get(target_branch_id) if target_branch_id > 0 else None
    branch_name = branch.name if branch else "Todas las Sedes"

    orders_q = uow.db.query(models.Orden).filter(models.Orden.date >= day_start, models.Orden.date < day_end)
    if target_branch_id > 0: orders_q = orders_q.filter(models.Orden.branch_id == target_branch_id)
    orders = orders_q.all()

    receipts_q = uow.db.query(models.Receipt).filter(
        models.Receipt.date >= day_start,
        models.Receipt.date < day_end,
        models.Receipt.type == "income"
    )
    if target_branch_id > 0: receipts_q = receipts_q.filter(models.Receipt.branch_id == target_branch_id)
    receipts = receipts_q.all()

    rates = await _get_rates_for_date(uow, report_date)
    usd_rate = rates[0] or 1.0
    eur_rate = rates[1] or 1.0

    total_sales = sum(o.total or 0.0 for o in orders)
    total_tax = sum(o.tax or 0.0 for o in orders)
    total_discount = sum(o.discount or 0.0 for o in orders)
    
    # Granular categories
    espacios_breakdown = {}
    salas_breakdown = {}
    cat_totals = {"offices": 0.0, "rooms": 0.0, "products": 0.0, "services": 0.0}
    
    # Pre-fetch office and room mappings for efficiency
    offices_map = {o.id: o.category for o in uow.db.query(models.Office.id, models.Office.category).filter(models.Office.branch_id == target_branch_id).all()}
    rooms_map = {r.id: r.type for r in uow.db.query(models.Room.id, models.Room.type).filter(models.Room.branch_id == target_branch_id).all()}

    pending_debt_today = 0.0
    
    room_rate_services = set(
        id for id, in uow.db.query(models.Service.id)
        .filter(models.Service.is_room_rate == True, models.Service.branch_id == target_branch_id).all()
    )
    
    sales_by_client = {}
    items_detail_list = []
    
    for o in orders:
        c_name = o.client.name if o.client else "N/A"
        sales_by_client[c_name] = sales_by_client.get(c_name, 0.0) + (o.total or 0.0)
        
        paid_for_order = sum(r.amount for r in o.receipts if r.type == "income")
        if o.status != "cancelled":
            pending_debt_today += ((o.total or 0.0) - paid_for_order)

        for d in o.details:
            amount = (d.subtotal or 0.0)
            category = "services"
            
            if d.item_type == "product":
                category = "products"
            elif d.item_type == "office" or d.item_type == "amenity":
                category = "offices"
                o_cat = offices_map.get(d.item_id, "Otros")
                # Normalize names for display
                display_cat = "Oficinas Privadas" if "privada" in o_cat.lower() else o_cat.capitalize()
                if "suite" in o_cat.lower(): display_cat = "Suites Ejecutivas"
                if "escritorio" in o_cat.lower() or "fijo" in o_cat.lower(): display_cat = "Escritorios Fijos"
                if "compartido" in o_cat.lower() or "cowork" in o_cat.lower(): display_cat = "Espacios Compartidos"
                
                espacios_breakdown[display_cat] = espacios_breakdown.get(display_cat, 0.0) + amount
            elif d.item_type == "room":
                category = "rooms"
                r_type = rooms_map.get(d.item_id, "Sala de Reuniones")
                display_type = "Sala de Reuniones" if "reuniones" in r_type.lower() else r_type.capitalize()
                if "evento" in r_type.lower(): display_type = "Sala de Eventos"
                
                salas_breakdown[display_type] = salas_breakdown.get(display_type, 0.0) + amount
            elif d.item_type == "service" and d.item_id in room_rate_services:
                category = "rooms"
                # If it's a room service but we don't know which room, put it in generic Sala de Reuniones or just Salas
                display_type = "Servicios de Sala"
                salas_breakdown[display_type] = salas_breakdown.get(display_type, 0.0) + amount
            
            cat_totals[category] += amount
            desc = d.item_name or f"{d.item_type.capitalize()} #{d.item_id}"
            
            # Calculate per-item tax if order has tax applied
            item_tax = (amount * 0.16) if o.apply_tax else 0.0
            item_total_with_tax = amount + item_tax
            
            items_detail_list.append({
                "order_id": o.id,
                "client_name": c_name,
                "description": desc,
                "quantity": d.quantity,
                "unit_price": d.unit_price or 0.0,
                "discount": d.discount or 0.0,
                "subtotal": amount, # This is (qty * price) - disc
                "tax": item_tax,
                "total": item_total_with_tax,
                "time": o.date.strftime("%H:%M - %d/%m/%Y")
            })

    # Consumables usage
    consumables_usage = []
    usage_rows = uow.db.query(models.ConsumableUsage).filter(
        func.date(models.ConsumableUsage.created_at) == report_date,
        models.ConsumableUsage.branch_id == target_branch_id
    ).all()
    
    for u in usage_rows:
        consumables_usage.append({
            "name": u.consumable.name if u.consumable else "Desconocido",
            "quantity": u.quantity,
            "unit": u.consumable.unit if u.consumable else "unid",
            "reason": u.reason,
            "user": u.user_email
        })

    # Order Audit Logs (Modifications and Deletions)
    audit_logs_rows = uow.db.query(models.OrderAuditLog).filter(
        func.date(models.OrderAuditLog.created_at) == report_date,
        models.OrderAuditLog.action.in_(["UPDATE", "DELETED"])
    ).all()
    
    audit_logs = []
    for log in audit_logs_rows:
        # Try to infer branch if possible, otherwise include them globally for the day
        changes = log.changes_json or {}
        order_info = f"Orden #{log.orden_id}" if log.orden_id else f"Orden #{changes.get('order_id', 'N/A')}"
        client_name = changes.get("client_name", "Desconocido")
        
        # Combine reason and message for clarity
        base_msg = changes.get("message", "Modificación manual")
        if log.reason and log.reason not in base_msg:
            message = f"{base_msg} - {log.reason}"
        else:
            message = base_msg
        
        audit_logs.append({
            "time": log.created_at.strftime("%H:%M"),
            "action": log.action,
            "user": log.user.email if log.user else "Sistema",
            "order_info": order_info,
            "client_name": client_name,
            "message": message
        })

    income_details = []
    income_by_method = {}
    total_income_usd = 0.0
    total_income_eur = 0.0
    for r in receipts:
        curr = (r.exchange_currency or "usd").lower()
        amount = r.amount
        rate = r.exchange_rate or (eur_rate if curr == "eur" else usd_rate)
        bs_amount = amount * rate
        method = r.payment_method or "Otro"

        if curr == "eur": total_income_eur += amount
        else: total_income_usd += amount
        
        income_details.append({
            "client_name": r.client.name if r.client else (r.orden.client.name if r.orden and r.orden.client else "N/A"),
            "amount": amount,
            "currency": curr.upper(),
            "rate": rate,
            "bs_amount": bs_amount,
            "method": method,
            "reference": r.reference or "N/A",
            "description": f"Pago Orden #{r.orden_id}" if r.orden_id else "Ingreso Manual"
        })

        if method not in income_by_method:
            income_by_method[method] = {"usd": 0.0, "eur": 0.0, "bs": 0.0}
        
        if curr == "eur":
            income_by_method[method]["eur"] += amount
        else:
            income_by_method[method]["usd"] += amount
        income_by_method[method]["bs"] += bs_amount

    orders_list = []
    for o in orders:
        paid_amount = sum(r.amount for r in o.receipts if r.type == "income")
        orders_list.append({
            "id": o.id,
            "client_name": o.client.name if o.client else "N/A",
            "status": o.status,
            "subtotal": o.subtotal or 0.0,
            "tax": o.tax or 0.0,
            "discount": o.discount or 0.0,
            "total": o.total or 0.0,
            "paid": paid_amount
        })

    from app.use_cases.financial import GetFinancialDataUseCase
    fin_use_case = GetFinancialDataUseCase(uow)
    receivables = fin_use_case.get_receivables(target_branch_id)
    global_debts = [d for d in receivables if d["balance"] > 0.01]

    total_sales_by_client = sum(sales_by_client.values())
    total_income_bs = sum(r["bs_amount"] for r in income_details)
    total_orders_facturado = sum(o["total"] for o in orders_list)
    total_orders_abonado = sum(o["paid"] for o in orders_list)
    total_items_subtotal = sum(item["total"] for item in items_detail_list)
    total_debt_usd = sum(d["balance"] for d in global_debts)
    total_debt_bs = total_debt_usd * usd_rate

    return {
        "date": report_date.strftime("%d/%m/%Y"),
        "branch_name": branch_name,
        "usd_rate": usd_rate,
        "eur_rate": eur_rate,
        "totals": {
            "sales": total_sales,
            "income_usd": total_income_usd,
            "income_eur": total_income_eur,
            "income_bs": total_income_bs,
            "pending_today": pending_debt_today,
            "sales_by_client": total_sales_by_client,
            "orders_facturado": total_orders_facturado,
            "orders_abonado": total_orders_abonado,
            "items_subtotal": total_items_subtotal,
            "total_tax": total_tax,
            "total_discount": total_discount,
            "debt_usd": total_debt_usd,
            "debt_bs": total_debt_bs,
            **cat_totals
        },
        "espacios_breakdown": espacios_breakdown,
        "salas_breakdown": salas_breakdown,
        "consumables_usage": consumables_usage,
        "sales_by_client": sales_by_client,
        "income_details": income_details,
        "income_by_method": income_by_method,
        "orders_list": orders_list,
        "items_detail_list": items_detail_list,
        "global_debts": global_debts,
        "audit_logs": audit_logs,
        "now": datetime.now().strftime("%d/%m/%Y %H:%M")
    }

async def _get_sales_report_data(uow: UnitOfWork, start: date, end: date, target_branch_id: int):
    start_dt = datetime(start.year, start.month, start.day, tzinfo=timezone.utc)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc)
    q = uow.db.query(models.Orden).filter(models.Orden.date >= start_dt, models.Orden.date <= end_dt)
    if target_branch_id > 0: q = q.filter(models.Orden.branch_id == target_branch_id)
    orders = q.all()
    rates = await _get_rates_for_date(uow, date.today())
    
    formatted_orders = []
    for o in orders:
        formatted_orders.append({
            "id": o.id,
            "date": o.date.strftime("%d/%m/%Y"),
            "client_name": o.client.name if o.client else "N/A",
            "status": o.status,
            "total": o.total
        })
        
    return {
        "title": "Reporte de Ventas",
        "date_range": f"{start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}",
        "rates": rates,
        "total_bruto": sum(o.total for o in orders),
        "orders": formatted_orders
    }

async def _get_advanced_sales_report_data(uow: UnitOfWork, start: date, end: date, target_branch_id: int):
    start_dt = datetime(start.year, start.month, start.day, tzinfo=timezone.utc)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc)
    
    q = uow.db.query(models.Orden).filter(
        models.Orden.date >= start_dt, 
        models.Orden.date <= end_dt,
        models.Orden.status.in_(["paid", "partial", "pending"])
    )
    if target_branch_id > 0:
        q = q.filter(models.Orden.branch_id == target_branch_id)
        
    orders = q.all()
    
    offices_map = {o.id: o.category.lower() if o.category else "" for o in uow.db.query(models.Office.id, models.Office.category).all()}
    rooms_map = {r.id: r.type.lower() if r.type else "" for r in uow.db.query(models.Room.id, models.Room.type).all()}
    services_map = {s.id: ((s.name or "") + " " + (s.description or "")).lower() for s in uow.db.query(models.Service.id, models.Service.name, models.Service.description).all()}
    
    branches = uow.db.query(models.Branch).filter(models.Branch.is_active == True).all()
    
    rates = await _get_rates_for_date(uow, date.today())
    
    report_data = {}
    
    for b in branches:
        if target_branch_id > 0 and b.id != target_branch_id:
            continue
        report_data[b.id] = {
            "name": b.name,
            "paid_categories": {
                "Oficina Privada": 0.0,
                "Escritorios Fijos": 0.0,
                "Espacios Compartidos": 0.0,
                "Salas": 0.0,
                "Servicios": 0.0,
                "Otros": 0.0
            },
            "pending_categories": {
                "Oficina Privada": 0.0,
                "Escritorios Fijos": 0.0,
                "Espacios Compartidos": 0.0,
                "Salas": 0.0,
                "Servicios": 0.0,
                "Otros": 0.0
            },
            "total_paid": 0.0,
            "total_pending": 0.0
        }
        
    global_total_paid = 0.0
    global_total_pending = 0.0
    
    orders_detail_list = []
    orders_by_payment_method = {}
        
    for o in orders:
        b_id = o.branch_id
        if b_id not in report_data:
            continue
            
        is_pending = o.status == "pending"
        o_subtotal = sum((d.subtotal or 0.0) for d in o.details)
        o_discount = o.discount or 0.0
        
        order_desc_items = [d.item_name for d in o.details if d.item_name]
        order_desc = ", ".join(order_desc_items)
        if not order_desc: order_desc = "Varios"
        
        orders_detail_list.append({
            "id": o.id,
            "date": o.date.strftime("%d/%m/%Y"),
            "client_name": o.client.name if o.client else "N/A",
            "description": order_desc,
            "total": o.total or 0.0,
            "status": o.status
        })
        
        for r in o.receipts:
            if r.type == "income":
                pm = r.payment_method or "Otros"
                if pm not in orders_by_payment_method:
                    orders_by_payment_method[pm] = {
                        "payments": [],
                        "totals": {}
                    }
                
                curr = (r.exchange_currency or "USD").upper()
                amount_bs = r.amount * (r.exchange_rate or rates[0] or 1.0) if curr.lower() != "bs" else r.amount
                
                orders_by_payment_method[pm]["payments"].append({
                    "order_id": o.id,
                    "date": r.date.strftime("%d/%m/%Y"),
                    "client_name": o.client.name if o.client else "N/A",
                    "description": order_desc,
                    "amount": r.amount,
                    "currency": curr,
                    "amount_bs": amount_bs,
                    "rate": r.exchange_rate or rates[0] or 1.0
                })
                
                orders_by_payment_method[pm]["totals"][curr] = orders_by_payment_method[pm]["totals"].get(curr, 0.0) + r.amount

        
        for d in o.details:
            d_sub = d.subtotal or 0.0
            item_fraction = (d_sub / o_subtotal) if o_subtotal > 0 else 0.0
            
            if o.discount_type == "percentage":
                item_discount = d_sub * (o_discount / 100.0)
            else:
                item_discount = o_discount * item_fraction
                
            taxable_base = d_sub - item_discount
            item_tax = taxable_base * 0.16 if o.apply_tax else 0.0
            item_total = taxable_base + item_tax
            
            category = "Otros"
            t = (d.item_type or "").lower()
            item_name = (d.item_name or "").lower()
            
            if t in ["office", "offices", "amenity", "membership"]:
                cat_str = offices_map.get(d.item_id, "").lower()
                combined_text = f"{cat_str} {item_name}"
                if "escritorio" in combined_text or "fijo" in combined_text or "semi_privada" in combined_text or "semi privada" in combined_text:
                    category = "Escritorios Fijos"
                elif "compartido" in combined_text or "cowork" in combined_text or "locker" in combined_text or "coffee" in combined_text:
                    category = "Espacios Compartidos"
                elif "oficina" in combined_text or "consultorio" in combined_text or "suite" in combined_text or "privada" in combined_text or "local" in combined_text:
                    category = "Oficina Privada"
                else:
                    category = "Oficina Privada" # fallback for offices
            elif t in ["room", "rooms"]:
                category = "Salas"
            elif t in ["service", "services", "product"]:
                srv_str = services_map.get(d.service_id, "") if d.service_id else ""
                if not srv_str:
                    srv_str = services_map.get(d.item_id, "")
                
                combined_text = f"{srv_str} {item_name}".lower()
                
                if "sala" in combined_text or "tarifa plana" in combined_text or "reunion" in combined_text or "reunión" in combined_text or "salon" in combined_text or "salón" in combined_text:
                    category = "Salas"
                elif "daypass" in combined_text or "day_pass" in combined_text or "servicios digitales" in combined_text or "servicios adicionales" in combined_text or "copias" in combined_text or "impresion" in combined_text or "visitas" in combined_text:
                    category = "Servicios"
                elif "espacio" in combined_text and "compartido" in combined_text:
                    category = "Espacios Compartidos"
                else:
                    category = "Servicios" # fallback for services and products
            else:
                # Catch all if type is missing or unknown
                combined_text = item_name.lower()
                if "sala" in combined_text or "reunion" in combined_text or "salon" in combined_text:
                    category = "Salas"
                elif "daypass" in combined_text or "day_pass" in combined_text:
                    category = "Servicios"
                elif "escritorio" in combined_text:
                    category = "Escritorios Fijos"
                elif "oficina" in combined_text or "consultorio" in combined_text:
                    category = "Oficina Privada"
                        
            if is_pending:
                report_data[b_id]["pending_categories"][category] += item_total
                report_data[b_id]["total_pending"] += item_total
                global_total_pending += item_total
            else:
                report_data[b_id]["paid_categories"][category] += item_total
                report_data[b_id]["total_paid"] += item_total
                global_total_paid += item_total
                
    filtered_report_data = {k: v for k, v in report_data.items() if v["total_paid"] > 0 or v["total_pending"] > 0}
                
    return {
        "title": "Reporte Avanzado de Ventas",
        "date_range": f"{start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}",
        "rates": rates,
        "branches": list(filtered_report_data.values()),
        "global_total_paid": global_total_paid,
        "global_total_pending": global_total_pending,
        "orders_detail_list": orders_detail_list,
        "orders_by_payment_method": orders_by_payment_method,
        "now": datetime.now().strftime("%d/%m/%Y %H:%M")
    }


async def _get_crm_report_data(uow: UnitOfWork, start: date, end: date, target_branch_id: int):
    start_dt = datetime(start.year, start.month, start.day, tzinfo=timezone.utc)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc)
    leads = uow.db.query(models.Lead).filter(models.Lead.created_at >= start_dt, models.Lead.created_at <= end_dt)
    if target_branch_id > 0: leads = leads.filter(models.Lead.branch_id == target_branch_id)
    leads = leads.all()
    rates = await _get_rates_for_date(uow, date.today())
    
    formatted_leads = []
    for l in leads:
        formatted_leads.append({
            "name": l.name,
            "email": l.email,
            "source": l.source,
            "status": l.status,
            "date": l.created_at.strftime("%d/%m/%Y")
        })

    return {
        "title": "Reporte CRM",
        "date_range": f"{start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}",
        "rates": rates,
        "leads_count": len(leads),
        "leads": formatted_leads
    }

async def _get_expenses_report_data(uow: UnitOfWork, start: date, end: date, target_branch_id: int):
    start_dt = datetime(start.year, start.month, start.day, tzinfo=timezone.utc)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc)
    expenses = uow.db.query(models.Expense).filter(models.Expense.date >= start_dt, models.Expense.date <= end_dt)
    if target_branch_id > 0: expenses = expenses.filter(models.Expense.branch_id == target_branch_id)
    expenses = expenses.all()
    rates = await _get_rates_for_date(uow, date.today())
    
    formatted_expenses = []
    for e in expenses:
        formatted_expenses.append({
            "date": e.date.strftime("%d/%m/%Y"),
            "category": e.category or "",
            "description": e.description or "",
            "amount": e.amount,
            "currency": e.exchange_currency or "usd",
            "rate": e.exchange_rate or 0.0
        })

    return {
        "title": "Reporte de Gastos",
        "date_range": f"{start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}",
        "rates": rates,
        "expenses": formatted_expenses
    }

async def _get_cashflow_report_data(uow: UnitOfWork, start: date, end: date, type: str, target_branch_id: int):
    start_dt = datetime(start.year, start.month, start.day)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59)
    q = uow.db.query(models.CashMovement).filter(models.CashMovement.type == type, models.CashMovement.date >= start_dt, models.CashMovement.date <= end_dt)
    if target_branch_id > 0: q = q.filter(models.CashMovement.branch_id == target_branch_id)
    movements = q.all()

    branch = uow.branches.get(target_branch_id) if target_branch_id > 0 else None
    branch_name = branch.name if branch else "Todas las Sedes"

    formatted_movements = []
    for m in movements:
        formatted_movements.append({
            "date": m.date.strftime("%d/%m/%Y %H:%M"),
            "category": m.category,
            "description": m.description or "-",
            "entity_name": m.client_name or m.provider_name or "N/A",
            "payment_method": m.payment_method or "-",
            "amount": m.amount
        })

    rates = await _get_rates_for_date(uow, date.today())
    return {
        "report_type": "Ingresos" if type == "income" else "Egresos",
        "date_range": f"{start.strftime('%d/%m/%Y')} al {end.strftime('%d/%m/%Y')}",
        "branch_name": branch_name,
        "movements": formatted_movements,
        "usd_rate": rates[0],
        "eur_rate": rates[1],
        "total_amount": sum(m.amount for m in movements),
        "now": datetime.now().strftime("%d/%m/%Y %H:%M")
    }

# ─── REPORTE DIARIO ───────────────────────────────────────────────────────────
@router.get("/daily")
async def daily_report(
    report_date: date = Query(default=None),
    preview: bool = Query(False),
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    if report_date is None: report_date = date.today()
    context = await _get_daily_report_data(uow, report_date, target_branch_id)
    
    if preview:
        return context

    pdf_buf = render_html_to_pdf("daily_report.html", context)
    return StreamingResponse(
        pdf_buf, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=reporte_diario_{report_date}.pdf"}
    )

# ─── SALES REPORT ────────────────────────────────────────────────────────────
@router.get("/sales")
async def sales_report(
    start: date = Query(...), end: date = Query(...),
    preview: bool = Query(False),
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    _require_role(current_user, ROLES_CRM)
    data = await _get_sales_report_data(uow, start, end, target_branch_id)
    
    if preview:
        return data

    rates = data["rates"]
    buf, doc, story = _base_doc("Reporte de Ventas", f"Período: {data['date_range']}", rates=rates)
    story.append(Paragraph(f"Total Ventas: {_currency(data['total_bruto'], rates[0])}", getSampleStyleSheet()["Heading3"]))
    
    table_data = [["#", "Fecha", "Cliente", "Estado", "Total"]]
    for o in data["orders"]:
        table_data.append([str(o["id"]), o["date"], o["client_name"], o["status"], _currency(o["total"], rates[0])])
    
    story.append(_table(table_data, [1.5*cm, 3*cm, 7*cm, 2.5*cm, 3*cm]))
    return _finalize(buf, doc, story, f"reporte_ventas_{start}_{end}.pdf")

@router.get("/sales-advanced")
async def sales_advanced_report(
    start: date = Query(...), end: date = Query(...),
    preview: bool = Query(False),
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    _require_role(current_user, {"Ventas", "Coordinador", "Gerente", "Super Admin"})
    data = await _get_advanced_sales_report_data(uow, start, end, target_branch_id)
    
    if preview:
        return data

    pdf_buf = render_html_to_pdf("advanced_sales_report.html", data)
    return StreamingResponse(
        pdf_buf, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=reporte_ventas_avanzado_{start}_{end}.pdf"}
    )

# ─── CRM REPORT ──────────────────────────────────────────────────────────────
@router.get("/crm")
async def crm_report(
    start: date = Query(...), end: date = Query(...),
    preview: bool = Query(False),
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    _require_role(current_user, ROLES_CRM)
    data = await _get_crm_report_data(uow, start, end, target_branch_id)
    
    if preview:
        return data

    rates = data["rates"]
    buf, doc, story = _base_doc("Reporte CRM", f"Período: {data['date_range']}", rates=rates)
    story.append(Paragraph(f"Leads captados: {data['leads_count']}", getSampleStyleSheet()["Normal"]))
    
    table_data = [["Nombre", "Email", "Fuente", "Estado", "Fecha"]]
    for l in data["leads"]:
        table_data.append([str(l["name"]), str(l["email"]), str(l["source"]), str(l["status"]), l["date"]])
    
    story.append(_table(table_data, [5*cm, 5*cm, 3*cm, 2.5*cm, 3*cm]))
    return _finalize(buf, doc, story, f"reporte_crm_{start}_{end}.pdf")

# ─── EXPENSES REPORT ──────────────────────────────────────────────────────────
@router.get("/expenses")
async def expenses_report(
    start: date = Query(...), end: date = Query(...),
    preview: bool = Query(False),
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    _require_role(current_user, ROLES_FINANCIAL_ADMIN)
    data = await _get_expenses_report_data(uow, start, end, target_branch_id)
    
    if preview:
        return data

    rates = data["rates"]
    buf, doc, story = _base_doc("Reporte de Gastos", f"Período: {data['date_range']}", rates=rates)
    
    table_data = [["Fecha", "Categoría", "Descripción", "Monto"]]
    for e in data["expenses"]:
        table_data.append([e["date"], e["category"], (e["description"])[:40], _currency(e["amount"], e["rate"], e["currency"])])
    
    story.append(_table(table_data, [3*cm, 4*cm, 7*cm, 3*cm]))
    return _finalize(buf, doc, story, f"reporte_gastos_{start}_{end}.pdf")

# ─── CASHFLOW REPORTS ─────────────────────────────────────────────────────────

@router.get("/cashflow/income")
async def cashflow_income_report(
    start: date = Query(...), end: date = Query(...),
    preview: bool = Query(False),
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    _require_role(current_user, ROLES_FINANCIAL_ADMIN)
    context = await _get_cashflow_report_data(uow, start, end, "income", target_branch_id)
    
    if preview:
        return context

    pdf_buf = render_html_to_pdf("cashflow_report.html", context)
    return StreamingResponse(
        pdf_buf, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=reporte_ingresos_caja_{start}_{end}.pdf"}
    )

@router.get("/cashflow/expense")
async def cashflow_expense_report(
    start: date = Query(...), end: date = Query(...),
    preview: bool = Query(False),
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
):
    _require_role(current_user, ROLES_FINANCIAL_ADMIN)
    context = await _get_cashflow_report_data(uow, start, end, "expense", target_branch_id)
    
    if preview:
        return context

    pdf_buf = render_html_to_pdf("cashflow_report.html", context)
    return StreamingResponse(
        pdf_buf, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=reporte_egresos_caja_{start}_{end}.pdf"}
    )


# ─── EXECUTIVE SUMMARY (Gerente / Super Admin only) ──────────────────────────

@router.get("/executive-summary")
def executive_summary(
    start: date = Query(default=None),
    end: date = Query(default=None),
    current_user: models.User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    """
    Returns a comprehensive executive summary per branch.
    Restricted to Gerente and Super Admin.
    """
    _require_role(current_user, {"Gerente", "Super Admin"})

    db = uow.db

    # Default: current month
    today = date.today()
    if not start:
        start = today.replace(day=1)
    if not end:
        end = today

    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end, datetime.max.time())

    # ── 1. Branches ────────────────────────────────────────────────────────────
    branches = db.query(models.Branch).filter(models.Branch.is_active == True).all()
    branch_ids = [b.id for b in branches]

    result = []

    for branch in branches:
        bid = branch.id

        # ── 2. Total Ventas por sede (Órdenes pagadas) ──────────────────────
        total_sales = db.query(func.coalesce(func.sum(models.Orden.total), 0)).filter(
            models.Orden.branch_id == bid,
            models.Orden.status.in_(["paid", "partial"]),
            models.Orden.date >= start_dt,
            models.Orden.date <= end_dt,
        ).scalar() or 0.0

        total_orders = db.query(func.count(models.Orden.id)).filter(
            models.Orden.branch_id == bid,
            models.Orden.status.in_(["paid", "partial"]),
            models.Orden.date >= start_dt,
            models.Orden.date <= end_dt,
        ).scalar() or 0

        # ── 3. Ventas por categoría (item_type en order_details) ────────────
        category_rows = db.query(
            models.Pedido.item_type,
            func.coalesce(func.sum(models.Pedido.subtotal), 0).label("total")
        ).join(
            models.Orden, models.Pedido.orden_id == models.Orden.id
        ).filter(
            models.Orden.branch_id == bid,
            models.Orden.status.in_(["paid", "partial"]),
            models.Orden.date >= start_dt,
            models.Orden.date <= end_dt,
        ).group_by(models.Pedido.item_type).all()

        sales_by_category = [
            {"category": row.item_type or "otros", "total": float(row.total)}
            for row in category_rows
        ]

        # ── 4. Flujo de Caja por sede (Receipts income vs expense) ─────────
        income_q = db.query(func.coalesce(func.sum(models.Receipt.amount), 0)).filter(
            models.Receipt.branch_id == bid,
            models.Receipt.type == "income",
            models.Receipt.date >= start_dt,
            models.Receipt.date <= end_dt,
        ).scalar() or 0.0

        expenses_q = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
            models.Expense.branch_id == bid,
            models.Expense.date >= start_dt,
            models.Expense.date <= end_dt,
        ).scalar() or 0.0

        net_flow = income_q - expenses_q

        # ── 5. Cobros por método de pago ────────────────────────────────────
        payment_rows = db.query(
            models.Receipt.payment_method,
            func.coalesce(func.sum(models.Receipt.amount), 0).label("total"),
            func.count(models.Receipt.id).label("count")
        ).filter(
            models.Receipt.branch_id == bid,
            models.Receipt.type == "income",
            models.Receipt.date >= start_dt,
            models.Receipt.date <= end_dt,
        ).group_by(models.Receipt.payment_method).all()

        income_by_payment = [
            {
                "method": row.payment_method or "Otro",
                "total": float(row.total),
                "count": int(row.count)
            }
            for row in payment_rows
        ]

        # ── 6. Ventas por Tipo de Espacio (Oficina -> category) ─────────────
        # PostgreSQL requires the actual column in GROUP BY when using coalesce in SELECT.
        # We select Office.category and Client.branch_id directly, filter in Python for branch.
        space_rows = db.query(
            models.Office.category,
            func.coalesce(func.sum(models.Membership.price), 0).label("total"),
            func.count(models.Membership.id).label("count")
        ).outerjoin(
            models.Office, models.Membership.office_id == models.Office.id
        ).outerjoin(
            models.Client, models.Membership.client_id == models.Client.id
        ).filter(
            func.coalesce(models.Office.branch_id, models.Client.branch_id) == bid,
            models.Membership.status != "cancelled",
            models.Membership.start_date >= start_dt,
            models.Membership.start_date <= end_dt,
        ).group_by(models.Office.category).all()

        sales_by_space = [
            {
                "space_type": row.category or "sin_espacio",
                "total": float(row.total),
                "count": int(row.count),
            }
            for row in space_rows
        ]

        # ── 7. Ventas por Salas (order_details where item_type='room') ───────
        room_rows = db.query(
            models.Pedido.item_name,
            func.coalesce(func.sum(models.Pedido.subtotal), 0).label("total"),
            func.count(models.Pedido.id).label("count")
        ).join(
            models.Orden, models.Pedido.orden_id == models.Orden.id
        ).filter(
            models.Orden.branch_id == bid,
            models.Pedido.item_type == "room",
            models.Orden.status.in_(["paid", "partial"]),
            models.Orden.date >= start_dt,
            models.Orden.date <= end_dt,
        ).group_by(models.Pedido.item_name).all()

        sales_by_room = [
            {
                "room_name": row.item_name or "Sala",
                "total": float(row.total),
                "count": int(row.count),
            }
            for row in room_rows
        ]

        # ── 8. Ventas por Servicios (order_details where item_type='service') ─
        service_rows = db.query(
            models.Pedido.item_name,
            func.coalesce(func.sum(models.Pedido.subtotal), 0).label("total"),
            func.count(models.Pedido.id).label("count")
        ).join(
            models.Orden, models.Pedido.orden_id == models.Orden.id
        ).filter(
            models.Orden.branch_id == bid,
            models.Pedido.item_type == "service",
            models.Orden.status.in_(["paid", "partial"]),
            models.Orden.date >= start_dt,
            models.Orden.date <= end_dt,
        ).group_by(models.Pedido.item_name).all()

        sales_by_service = [
            {
                "service_name": row.item_name or "Servicio",
                "total": float(row.total),
                "count": int(row.count),
            }
            for row in service_rows
        ]

        result.append({
            "branch_id": bid,
            "branch_name": branch.name,
            "branch_color": branch.color or "#4F46E5",
            "total_sales_eur": round(total_sales, 2),
            "total_orders": total_orders,
            "sales_by_category": sales_by_category,
            "cash_flow": {
                "income": round(income_q, 2),
                "expenses": round(expenses_q, 2),
                "net": round(net_flow, 2),
            },
            "income_by_payment_method": income_by_payment,
            "sales_by_space": sales_by_space,
            "sales_by_room": sales_by_room,
            "sales_by_service": sales_by_service,
        })

    return {
        "period": {"start": str(start), "end": str(end)},
        "branches": result,
        "totals": {
            "total_sales": round(sum(b["total_sales_eur"] for b in result), 2),
            "total_income": round(sum(b["cash_flow"]["income"] for b in result), 2),
            "total_expenses": round(sum(b["cash_flow"]["expenses"] for b in result), 2),
            "net_flow": round(sum(b["cash_flow"]["net"] for b in result), 2),
        }
    }
