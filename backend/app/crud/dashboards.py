from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app import models
import logging

logger = logging.getLogger(__name__)

def get_kpis(db: Session, branch_id: int):
    try:
        # Generar un rango para los últimos 30 días
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)

        # 1. New Leads
        leads_q = db.query(models.Lead).filter(models.Lead.created_at >= thirty_days_ago)
        if branch_id > 0:
            leads_q = leads_q.filter(models.Lead.branch_id == branch_id)
        new_leads = leads_q.count()

        # 2. Total Ingresos
        income_q = db.query(func.sum(models.Receipt.amount)).filter(
            models.Receipt.type == "income",
            models.Receipt.date >= thirty_days_ago
        ).join(models.Orden, models.Receipt.orden_id == models.Orden.id)
        
        if branch_id > 0:
            income_q = income_q.filter(models.Orden.branch_id == branch_id)
            
        total_income_tuple = income_q.first()
        total_income = total_income_tuple[0] if total_income_tuple and total_income_tuple[0] else 0.0

        # 3. Total Gastos (Expenses y Purchase Receipts)
        exp_q = db.query(func.sum(models.Expense.amount)).filter(models.Expense.date >= thirty_days_ago)
        if branch_id > 0:
            exp_q = exp_q.filter(models.Expense.branch_id == branch_id)
        expenses_amount = exp_q.scalar() or 0.0
        
        pur_q = db.query(func.sum(models.Receipt.amount)).filter(
            models.Receipt.type == "expense",
            models.Receipt.date >= thirty_days_ago
        ).join(models.Purchase, models.Receipt.purchase_id == models.Purchase.id)
        
        if branch_id > 0:
            pur_q = pur_q.filter(models.Purchase.branch_id == branch_id)
            
        purchases_amount = pur_q.scalar() or 0.0
        total_outflow = expenses_amount + purchases_amount

        # 4. Reservas Activas (Hoy)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        bookings_q = db.query(models.Booking).join(models.Room).filter(
            models.Booking.start_time >= today_start,
            models.Booking.start_time < today_end,
            models.Booking.status != "cancelled"
        )
        if branch_id > 0:
            bookings_q = bookings_q.filter(models.Room.branch_id == branch_id)
            
        active_bookings = bookings_q.count()

        return {
            "newLeads": new_leads,
            "totalIncome": total_income,
            "totalExpenses": total_outflow,
            "activeBookingsToday": active_bookings,
            "profit": total_income - total_outflow
        }
    except Exception as e:
        logger.error(f"Error in get_kpis: {e}")
        return {"newLeads": 0, "totalIncome": 0, "totalExpenses": 0, "activeBookingsToday": 0, "profit": 0}

def get_revenue_trend(db: Session, branch_id: int):
    try:
        months = []
        now = datetime.now()
        
        for i in range(5, -1, -1):
            month_start = (now.replace(day=1) - timedelta(days=28 * i)).replace(day=1)
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year + 1, month=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1)
            
            # Ingresos
            income_q = db.query(func.sum(models.Receipt.amount)).filter(
                models.Receipt.type == "income",
                models.Receipt.date >= month_start,
                models.Receipt.date < month_end
            ).join(models.Orden)
            if branch_id > 0:
                income_q = income_q.filter(models.Orden.branch_id == branch_id)
            month_income = income_q.scalar() or 0.0

            # Gastos
            exp_q = db.query(func.sum(models.Expense.amount)).filter(
                models.Expense.date >= month_start,
                models.Expense.date < month_end
            )
            if branch_id > 0:
                exp_q = exp_q.filter(models.Expense.branch_id == branch_id)
            exp_amount = exp_q.scalar() or 0.0
            
            pur_q = db.query(func.sum(models.Receipt.amount)).filter(
                models.Receipt.type == "expense",
                models.Receipt.date >= month_start,
                models.Receipt.date < month_end
            ).join(models.Purchase)
            if branch_id > 0:
                pur_q = pur_q.filter(models.Purchase.branch_id == branch_id)
            pur_amount = pur_q.scalar() or 0.0

            months.append({
                "name": month_start.strftime("%b %Y"),
                "ingresos": month_income,
                "gastos": exp_amount + pur_amount
            })

        return months
    except Exception as e:
        logger.error(f"Error in get_revenue_trend: {e}")
        return []

def get_occupancy_stats(db: Session, branch_id: int):
    try:
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        query = db.query(models.Room.name, func.count(models.Booking.id)).outerjoin(
            models.Booking, (models.Room.id == models.Booking.room_id) & (models.Booking.start_time >= thirty_days_ago)
        )
        if branch_id > 0:
            query = query.filter(models.Room.branch_id == branch_id)
            
        rooms = query.group_by(models.Room.name).all()

        return [{"name": r[0], "reservas": r[1]} for r in rooms]
    except Exception as e:
        logger.error(f"Error in get_occupancy_stats: {e}")
        return []

def get_revenue_by_category(db: Session, branch_id: int):
    try:
        # Distribución de ingresos por tipo de ítem en los últimos 30 días
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        query = db.query(models.Pedido.item_type, func.sum(models.Pedido.subtotal)).join(models.Orden).filter(
            models.Orden.date >= thirty_days_ago,
            models.Orden.status != 'cancelled'
        )
        if branch_id > 0:
            query = query.filter(models.Orden.branch_id == branch_id)
            
        results = query.group_by(models.Pedido.item_type).all()
        
        map_names = {
            'product': 'Productos',
            'service': 'Servicios',
            'office': 'Oficinas',
            'room': 'Salas'
        }
        
        return [
            {"category": map_names.get(r[0], r[0].capitalize()), "amount": r[1]} 
            for r in results
        ]
    except Exception as e:
        logger.error(f"Error in get_revenue_by_category: {e}")
        return []

def get_crm_funnel(db: Session):
    try:
        # El funnel es global por naturaleza según requerimientos previos
        # Verificamos si los modelos existen, si no, devolvemos 0
        total_leads = db.query(models.Lead).count() if hasattr(models, 'Lead') else 0
        total_opps = db.query(models.Opportunity).count() if hasattr(models, 'Opportunity') else 0
        total_quotes = db.query(models.Quote).count() if hasattr(models, 'Quote') else 0
        total_orders = db.query(models.Orden).filter(models.Orden.status != 'cancelled').count() if hasattr(models, 'Orden') else 0
        
        return [
            {"stage": "Prospectos", "count": total_leads},
            {"stage": "Oportunidades", "count": total_opps},
            {"stage": "Presupuestos", "count": total_quotes},
            {"stage": "Ventas", "count": total_orders}
        ]
    except Exception as e:
        logger.error(f"Error in get_crm_funnel: {e}")
        return []

def get_sede_performance(db: Session):
    try:
        # Comparativa de rendimiento entre sedes
        branches = db.query(models.Branch).all()
        performance = []
        
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        for b in branches:
            # Ingresos
            income = db.query(func.sum(models.Receipt.amount)).join(models.Orden).filter(
                models.Orden.branch_id == b.id,
                models.Receipt.type == "income",
                models.Receipt.date >= thirty_days_ago
            ).scalar() or 0.0
            
            # Gastos (Gastos directos + Compras)
            expenses_direct = db.query(func.sum(models.Expense.amount)).filter(
                models.Expense.branch_id == b.id,
                models.Expense.date >= thirty_days_ago
            ).scalar() or 0.0
            
            purchase_expenses = db.query(func.sum(models.Receipt.amount)).join(models.Purchase).filter(
                models.Purchase.branch_id == b.id,
                models.Receipt.type == "expense",
                models.Receipt.date >= thirty_days_ago
            ).scalar() or 0.0
            
            total_expenses = expenses_direct + purchase_expenses
            
            # Ocupación (Salas)
            total_rooms = db.query(models.Room).filter(models.Room.branch_id == b.id).count()
            occupied_rooms = db.query(models.Room).filter(
                models.Room.branch_id == b.id,
                models.Room.status == 'ocupado'
            ).count()
            
            occupancy = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
            
            performance.append({
                "sede": b.name,
                "ingresos": income,
                "gastos": total_expenses,
                "utilidad": income - total_expenses,
                "ocupacion": occupancy,
                "color": b.color or "#6366f1"
            })
            
        return performance
    except Exception as e:
        logger.error(f"Error in get_sede_performance: {e}")
        return []
