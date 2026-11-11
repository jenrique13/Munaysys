from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import Dict, List, Any
from app import models
from app.uow.unit_of_work import UnitOfWork

class DashboardUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def get_kpis(self, branch_id: int) -> Dict[str, Any]:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)

        # 1. New Leads
        leads_q = self.uow.db.query(models.Lead).filter(models.Lead.created_at >= thirty_days_ago)
        if branch_id > 0:
            leads_q = leads_q.filter(models.Lead.branch_id == branch_id)
        new_leads = leads_q.count()

        # 2. Total Income (Group by currency)
        income_rows = self.uow.db.query(
            models.Receipt.exchange_currency,
            func.sum(models.Receipt.amount)
        ).filter(
            models.Receipt.type == "income",
            models.Receipt.date >= thirty_days_ago
        ).join(models.Orden, models.Receipt.orden_id == models.Orden.id)
        
        if branch_id > 0:
            income_rows = income_rows.filter(models.Orden.branch_id == branch_id)
            
        income_rows = income_rows.group_by(models.Receipt.exchange_currency).all()
        
        income_eur = 0.0
        income_usd = 0.0
        for curr, amount in income_rows:
            if (curr or "eur").lower() == "eur":
                income_eur += float(amount or 0.0)
            else:
                income_usd += float(amount or 0.0)

        # 3. Total Outflow (Expenses + Purchase Receipts)
        exp_rows = self.uow.db.query(
            models.Expense.exchange_currency,
            func.sum(models.Expense.amount)
        ).filter(models.Expense.date >= thirty_days_ago)
        
        if branch_id > 0:
            exp_rows = exp_rows.filter(models.Expense.branch_id == branch_id)
            
        exp_rows = exp_rows.group_by(models.Expense.exchange_currency).all()
        
        expenses_eur = 0.0
        expenses_usd = 0.0
        for curr, amount in exp_rows:
            if (curr or "eur").lower() == "eur":
                expenses_eur += float(amount or 0.0)
            else:
                expenses_usd += float(amount or 0.0)
        
        pur_rows = self.uow.db.query(
            models.Receipt.exchange_currency,
            func.sum(models.Receipt.amount)
        ).filter(
            models.Receipt.type == "expense",
            models.Receipt.date >= thirty_days_ago
        ).join(models.Purchase, models.Receipt.purchase_id == models.Purchase.id)
        
        if branch_id > 0:
            pur_rows = pur_rows.filter(models.Purchase.branch_id == branch_id)
            
        pur_rows = pur_rows.group_by(models.Receipt.exchange_currency).all()
        
        for curr, amount in pur_rows:
            if (curr or "eur").lower() == "eur":
                expenses_eur += float(amount or 0.0)
            else:
                expenses_usd += float(amount or 0.0)

        # 4. Currently Occupied Rooms
        currently_occupied = self.uow.db.query(models.Booking).filter(
            models.Booking.status == "confirmed",
            models.Booking.start_time <= now,
            models.Booking.end_time > now
        ).count()
        
        return {
            "newLeads": new_leads,
            "totalIncome": income_eur,
            "totalIncomeEur": income_eur,
            "totalIncomeUsd": income_usd,
            "totalExpenses": expenses_eur,
            "totalExpensesEur": expenses_eur,
            "totalExpensesUsd": expenses_usd,
            "currentlyOccupiedRooms": currently_occupied,
            "profit": income_eur - expenses_eur,
            "profitUsd": income_usd - expenses_usd
        }

    def get_revenue_trend(self, branch_id: int) -> List[Dict[str, Any]]:
        # Last 6 months trend
        now = datetime.utcnow()
        trend = []
        for i in range(5, -1, -1):
            month_date = now - timedelta(days=i*30)
            month_name = month_date.strftime("%b")
            start = month_date.replace(day=1, hour=0, minute=0, second=0)
            if month_date.month == 12:
                end = month_date.replace(year=month_date.year+1, month=1, day=1)
            else:
                end = month_date.replace(month=month_date.month+1, day=1)
            
            inc_q = self.uow.db.query(func.sum(models.Receipt.amount)).filter(
                models.Receipt.type == "income",
                models.Receipt.date >= start,
                models.Receipt.date < end
            ).join(models.Orden, models.Receipt.orden_id == models.Orden.id)
            if branch_id > 0: inc_q = inc_q.filter(models.Orden.branch_id == branch_id)
            
            exp_q = self.uow.db.query(func.sum(models.Expense.amount)).filter(
                models.Expense.date >= start,
                models.Expense.date < end
            )
            if branch_id > 0: exp_q = exp_q.filter(models.Expense.branch_id == branch_id)
            
            # Simple sum as base currency for trend
            trend.append({
                "name": month_name,
                "ingresos": float(inc_q.scalar() or 0.0),
                "gastos": float(exp_q.scalar() or 0.0)
            })
        return trend

    def get_revenue_by_category(self, branch_id: int) -> List[Dict[str, Any]]:
        # Simplified category breakdown
        data = [
            {"category": "Membresías", "amount": 1200.0},
            {"category": "Salas", "amount": 800.0},
            {"category": "Otros", "amount": 300.0}
        ]
        total = sum(d["amount"] for d in data)
        for d in data:
            d["percentage"] = (d["amount"] / total * 100) if total > 0 else 0
        return data

    def get_occupancy_stats(self, branch_id: int) -> List[Dict[str, Any]]:
        # Calculate real occupancy for the last 30 days
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        business_hours_per_day = 16.0
        total_capacity_hours = 30 * business_hours_per_day

        rooms_q = self.uow.db.query(models.Room)
        if branch_id > 0:
            rooms_q = rooms_q.filter(models.Room.branch_id == branch_id)
        rooms = rooms_q.all()
        room_ids = [r.id for r in rooms]

        if not room_ids:
            return [{"name": "Salas", "reservas": 0, "ocupacion": 0}]

        # Sum hours of confirmed bookings in the last 30 days
        bookings = self.uow.db.query(models.Booking).filter(
            models.Booking.room_id.in_(room_ids),
            models.Booking.status == "confirmed",
            models.Booking.start_time >= thirty_days_ago
        ).all()

        total_booked_hours = sum(b.total_hours for b in bookings)
        avg_occupancy = (total_booked_hours / (len(rooms) * total_capacity_hours)) * 100

        return [
            {"name": "Salas de Reuniones", "reservas": len(bookings), "ocupacion": round(min(100, avg_occupancy), 2)},
            {"name": "Oficinas Privadas", "reservas": 12, "ocupacion": 85}, # Placeholder for offices until we add usage logic
            {"name": "Escritorios Fijos", "reservas": 28, "ocupacion": 40}  # Placeholder
        ]

    def get_crm_funnel(self) -> List[Dict[str, Any]]:
        stages = self.uow.db.query(models.PipelineStage).order_by(models.PipelineStage.order_index).all()
        funnel = []
        for s in stages:
            count = self.uow.db.query(models.Opportunity).filter(models.Opportunity.stage_id == s.id).count()
            funnel.append({"stage": s.name, "count": count})
        return funnel

    def get_sede_performance(self) -> List[Dict[str, Any]]:
        branches = self.uow.db.query(models.Branch).filter(models.Branch.is_active == True).all()
        perf = []
        for b in branches:
            inc = self.uow.db.query(func.sum(models.Receipt.amount)).filter(
                models.Receipt.type == "income"
            ).join(models.Orden, models.Receipt.orden_id == models.Orden.id).filter(models.Orden.branch_id == b.id).scalar() or 0.0
            
            exp = self.uow.db.query(func.sum(models.Expense.amount)).filter(
                models.Expense.branch_id == b.id
            ).scalar() or 0.0
            
            perf.append({
                "sede": b.name,
                "ingresos": float(inc),
                "utilidad": float(inc) - float(exp),
                "ocupacion": 75, # Mock for now
                "color": b.color or "#6366f1"
            })
        return perf

    def get_dashboard_stats(self, branch_id: int) -> Dict[str, Any]:
        """Calculates comprehensive dashboard stats for the financial view."""
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # Total Sales (Group by currency)
        income_rows = self.uow.db.query(
            models.Receipt.exchange_currency,
            func.sum(models.Receipt.amount)
        ).filter(
            models.Receipt.type == "income",
            models.Receipt.date >= thirty_days_ago
        )
        if branch_id > 0:
            income_rows = income_rows.filter(models.Receipt.branch_id == branch_id)
        
        income_rows = income_rows.group_by(models.Receipt.exchange_currency).all()
        
        total_sales_eur = 0.0
        total_sales_usd = 0.0
        for curr, amount in income_rows:
            if (curr or "eur").lower() == "eur": total_sales_eur += float(amount or 0.0)
            else: total_sales_usd += float(amount or 0.0)

        # Total Expenses (Group by currency)
        # 1. From Expense model
        exp_rows = self.uow.db.query(
            models.Expense.exchange_currency,
            func.sum(models.Expense.amount)
        ).filter(models.Expense.date >= thirty_days_ago)
        if branch_id > 0:
            exp_rows = exp_rows.filter(models.Expense.branch_id == branch_id)
        
        exp_rows = exp_rows.group_by(models.Expense.exchange_currency).all()
        
        total_expenses_eur = 0.0
        total_expenses_usd = 0.0
        for curr, amount in exp_rows:
            if (curr or "eur").lower() == "eur": total_expenses_eur += float(amount or 0.0)
            else: total_expenses_usd += float(amount or 0.0)
            
        # 2. From Purchase Receipts
        pur_rows = self.uow.db.query(
            models.Receipt.exchange_currency,
            func.sum(models.Receipt.amount)
        ).filter(
            models.Receipt.type == "expense",
            models.Receipt.date >= thirty_days_ago
        )
        if branch_id > 0:
            pur_rows = pur_rows.filter(models.Receipt.branch_id == branch_id)
            
        pur_rows = pur_rows.group_by(models.Receipt.exchange_currency).all()
        for curr, amount in pur_rows:
            if (curr or "eur").lower() == "eur": total_expenses_eur += float(amount or 0.0)
            else: total_expenses_usd += float(amount or 0.0)
        
        # Net Profit (Calculated in EUR as primary, but showing both)
        # Note: True net profit requires conversion, but for now we show them separate as requested
        
        # Trends (simplified to last 7 days for now)
        sales_trend = []
        expenses_trend = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_str = day.strftime("%Y-%m-%d")
            
            # Day Sales (In EUR for trend line)
            ds_q = self.uow.db.query(func.sum(models.Receipt.amount)).filter(
                models.Receipt.type == "income",
                func.date(models.Receipt.date) == day.date()
            )
            if branch_id > 0: ds_q = ds_q.filter(models.Receipt.branch_id == branch_id)
            sales_trend.append({"date": day_str, "amount": float(ds_q.scalar() or 0.0)})
            
            # Day Expenses (In EUR for trend line)
            de_q = self.uow.db.query(func.sum(models.Expense.amount)).filter(func.date(models.Expense.date) == day.date())
            if branch_id > 0: de_q = de_q.filter(models.Expense.branch_id == branch_id)
            
            pe_q = self.uow.db.query(func.sum(models.Receipt.amount)).filter(
                models.Receipt.type == "expense",
                func.date(models.Receipt.date) == day.date()
            )
            if branch_id > 0: pe_q = pe_q.filter(models.Receipt.branch_id == branch_id)
            
            total_day_exp = float(de_q.scalar() or 0.0) + float(pe_q.scalar() or 0.0)
            expenses_trend.append({"date": day_str, "amount": total_day_exp})
            
        return {
            "total_sales_eur": total_sales_eur,
            "total_sales_usd": total_sales_usd,
            "total_expenses_eur": total_expenses_eur,
            "total_expenses_usd": total_expenses_usd,
            "sales_trend": sales_trend,
            "expenses_trend": expenses_trend,
            "category_distribution": self.get_revenue_by_category(branch_id),
            "branch_id": branch_id
        }

    def get_sales_crm_dashboard(self, branch_id: int, period: str) -> Dict[str, Any]:
        """Calculates specific metrics for the Ventas & CRM dashboard with temporal filtering."""
        now = datetime.utcnow()
        if period == 'daily':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'weekly':
            start_date = now - timedelta(days=7)
        else:  # monthly
            start_date = now - timedelta(days=30)

        # 1. Leads
        leads_q = self.uow.db.query(models.Lead).filter(models.Lead.created_at >= start_date)
        if branch_id > 0:
            leads_q = leads_q.filter(models.Lead.branch_id == branch_id)
            
        total_leads = leads_q.count()
        leads_by_status_raw = self.uow.db.query(models.Lead.status, func.count(models.Lead.id)).filter(
            models.Lead.created_at >= start_date
        )
        if branch_id > 0:
            leads_by_status_raw = leads_by_status_raw.filter(models.Lead.branch_id == branch_id)
        leads_by_status = [{"status": row[0] or "Nuevo", "count": row[1]} for row in leads_by_status_raw.group_by(models.Lead.status).all()]

        # 2. Quotes
        quotes_q = self.uow.db.query(models.Quote).filter(models.Quote.created_at >= start_date)
        if branch_id > 0:
            quotes_q = quotes_q.filter(models.Quote.branch_id == branch_id)
            
        total_quotes = quotes_q.count()
        quotes_by_status_raw = self.uow.db.query(models.Quote.status, func.count(models.Quote.id)).filter(
            models.Quote.created_at >= start_date
        )
        if branch_id > 0:
            quotes_by_status_raw = quotes_by_status_raw.filter(models.Quote.branch_id == branch_id)
        
        # Calculate localized total quote amounts correctly per status if we want value
        # But we were just asked for quotes by status counts.
        quotes_by_status = [{"status": row[0], "count": row[1]} for row in quotes_by_status_raw.group_by(models.Quote.status).all()]

        # 3. Operations & Revenue
        orders_q = self.uow.db.query(models.Orden.id).filter(
            models.Orden.date >= start_date,
            models.Orden.status != 'cancelled'
        )
        if branch_id > 0:
            orders_q = orders_q.filter(models.Orden.branch_id == branch_id)
            
        order_ids = [o_id for (o_id,) in orders_q.all()]
        
        revenue_by_category = []
        room_hours = []
        
        if order_ids:
            # Map items to normalized categories
            pedidos = self.uow.db.query(models.Pedido.item_type, func.sum(models.Pedido.subtotal)).filter(
                models.Pedido.orden_id.in_(order_ids)
            ).group_by(models.Pedido.item_type).all()
            
            cat_map = {
                "Oficinas y Espacios": 0.0,
                "Salas": 0.0,
                "Productos": 0.0,
                "Servicios": 0.0,
                "Otros": 0.0
            }
            
            for item_type, val in pedidos:
                itype = (item_type or "").lower()
                amount = float(val)
                if "office" in itype or "coworking" in itype:
                    cat_map["Oficinas y Espacios"] += amount
                elif "room" in itype:
                    cat_map["Salas"] += amount
                elif "product" in itype:
                    cat_map["Productos"] += amount
                elif "service" in itype:
                    cat_map["Servicios"] += amount
                else:
                    cat_map["Otros"] += amount
                    
            revenue_by_category = [{"category": k, "amount": v} for k, v in cat_map.items() if v > 0]
            
            # Room Hours
            hours_q = self.uow.db.query(models.Pedido.item_name, func.sum(models.Pedido.quantity)).filter(
                models.Pedido.orden_id.in_(order_ids),
                models.Pedido.item_type == 'room'
            ).group_by(models.Pedido.item_name).all()
            
            room_hours = [{"room": row[0], "hours": float(row[1])} for row in hours_q if row[0]]
            # Sort by hours descending
            room_hours = sorted(room_hours, key=lambda x: x["hours"], reverse=True)

        # 4. Revenue By Branch
        branches_q = self.uow.db.query(models.Branch.name, func.sum(models.Orden.total)).join(
            models.Orden, models.Orden.branch_id == models.Branch.id
        ).filter(
            models.Orden.date >= start_date,
            models.Orden.status != 'cancelled'
        ).group_by(models.Branch.name).all()
        
        revenue_by_branch = [{"branch": row[0], "amount": float(row[1])} for row in branches_q if row[0]]

        return {
            "period": period,
            "leads": {
                "total": total_leads,
                "by_status": leads_by_status
            },
            "quotes": {
                "total": total_quotes,
                "by_status": quotes_by_status
            },
            "revenue_by_category": revenue_by_category,
            "room_hours": room_hours,
            "revenue_by_branch": revenue_by_branch
        }

    def get_financial_summary(self, branch_id: int, month: int = None, year: int = None) -> Dict[str, Any]:
        """Calculates absolute financial summary: Receivables, Payables, and Cash on hand."""
        # 1. Total Receivables (Unpaid Orders)
        rec_q = self.uow.db.query(func.sum(models.Orden.total - func.coalesce(
            self.uow.db.query(func.sum(models.Receipt.amount)).filter(
                models.Receipt.orden_id == models.Orden.id,
                models.Receipt.type == "income"
            ).correlate(models.Orden).as_scalar(), 0.0
        ))).filter(models.Orden.status != "paid")
        
        if branch_id > 0:
            rec_q = rec_q.filter(models.Orden.branch_id == branch_id)
        
        total_receivables = float(rec_q.scalar() or 0.0)
        
        # 2. Total Payables (Simplified for now)
        pay_q = self.uow.db.query(func.sum(models.Payable.amount)).filter(models.Payable.status == "pending")
        if branch_id > 0:
            pay_q = pay_q.filter(models.Payable.branch_id == branch_id)
        total_payables = float(pay_q.scalar() or 0.0)
        
        # 3. Current Cash (Total Income - Total Outflow)
        inc_q = self.uow.db.query(func.sum(models.Receipt.amount)).filter(models.Receipt.type == "income")
        out_q = self.uow.db.query(func.sum(models.Receipt.amount)).filter(models.Receipt.type == "expense")
        exp_q = self.uow.db.query(func.sum(models.Expense.amount))
        
        if branch_id > 0:
            # We would need to join with Orders/Purchases to check branch_id of Receipts
            inc_q = inc_q.join(models.Orden, models.Receipt.orden_id == models.Orden.id).filter(models.Orden.branch_id == branch_id)
            out_q = out_q.join(models.Purchase, models.Receipt.purchase_id == models.Purchase.id).filter(models.Purchase.branch_id == branch_id)
            exp_q = exp_q.filter(models.Expense.branch_id == branch_id)
            
        if year:
            inc_q = inc_q.filter(extract('year', models.Receipt.date) == year)
            out_q = out_q.filter(extract('year', models.Receipt.date) == year)
            exp_q = exp_q.filter(extract('year', models.Expense.date) == year)
        
        if month and month > 0:
            inc_q = inc_q.filter(extract('month', models.Receipt.date) == month)
            out_q = out_q.filter(extract('month', models.Receipt.date) == month)
            exp_q = exp_q.filter(extract('month', models.Expense.date) == month)

        current_cash = float(inc_q.scalar() or 0.0) - float(out_q.scalar() or 0.0) - float(exp_q.scalar() or 0.0)
        
        return {
            "total_receivables": total_receivables,
            "total_payables": total_payables,
            "current_cash": current_cash,
            "branch_id": branch_id
        }
    def get_operator_dashboard(self, branch_id: int) -> Dict[str, Any]:
        """Calculates all necessary data for the Operator dashboard: Daily Sales, Orders by Category, Today's Orders, Debts, and Today's Reservations."""
        from sqlalchemy import and_, or_
        from sqlalchemy.orm import joinedload
        
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # 1. Total Daily Sales (Sum of income receipts today)
        daily_sales_q = self.uow.db.query(func.sum(models.Receipt.amount)).filter(
            models.Receipt.type == "income",
            models.Receipt.date >= today_start,
            models.Receipt.date < today_end
        )
        if branch_id > 0:
            daily_sales_q = daily_sales_q.filter(models.Receipt.branch_id == branch_id)
        daily_sales = float(daily_sales_q.scalar() or 0.0)
        
        # 2. Orders by Category (Today)
        # Fetch all today's orders first
        orders_today_q = self.uow.db.query(models.Orden.id).filter(
            models.Orden.date >= today_start,
            models.Orden.date < today_end,
            models.Orden.status != "cancelled"
        )
        if branch_id > 0:
            orders_today_q = orders_today_q.filter(models.Orden.branch_id == branch_id)
        
        order_ids = [o_id for (o_id,) in orders_today_q.all()]
        
        orders_by_category = []
        if order_ids:
            pedidos_grouped = self.uow.db.query(models.Pedido.item_type, func.sum(models.Pedido.subtotal)).filter(
                models.Pedido.orden_id.in_(order_ids)
            ).group_by(models.Pedido.item_type).all()
            
            cat_map = {
                "Oficinas y Espacios": 0.0,
                "Salas": 0.0,
                "Productos": 0.0,
                "Servicios": 0.0,
                "Otros": 0.0
            }
            
            for item_type, val in pedidos_grouped:
                itype = (item_type or "").lower()
                amount = float(val)
                if "office" in itype or "coworking" in itype: cat_map["Oficinas y Espacios"] += amount
                elif "room" in itype: cat_map["Salas"] += amount
                elif "product" in itype: cat_map["Productos"] += amount
                elif "service" in itype: cat_map["Servicios"] += amount
                else: cat_map["Otros"] += amount
            
            orders_by_category = [{"category": k, "amount": v} for k, v in cat_map.items() if v > 0]

        # 3. Today's Orders Table
        recent_orders_q = self.uow.db.query(models.Orden).options(joinedload(models.Orden.client)).filter(
            models.Orden.date >= today_start,
            models.Orden.date < today_end
        )
        if branch_id > 0:
            recent_orders_q = recent_orders_q.filter(models.Orden.branch_id == branch_id)
        
        recent_orders = []
        for o in recent_orders_q.order_by(models.Orden.date.desc()).all():
            recent_orders.append({
                "id": o.id,
                "client_name": o.client.name if o.client else "N/A",
                "total": o.total,
                "status": o.status,
                "date": o.date.isoformat()
            })

        # 4. Debts Table (Clients with outstanding balances in this branch)
        from app.use_cases.financial.get_financial_data import GetFinancialDataUseCase
        fin_data_uc = GetFinancialDataUseCase(self.uow)
        debts_raw = fin_data_uc.get_receivables(branch_id)
        # Limit to top 10 for dashboard
        debts = debts_raw[:10]

        # 5. Today's Reservations Table
        bookings_q = self.uow.db.query(models.Booking).options(
            joinedload(models.Booking.room),
            joinedload(models.Booking.client)
        ).filter(
            models.Booking.start_time >= today_start,
            models.Booking.start_time < today_end,
            models.Booking.status == "confirmed"
        )
        if branch_id > 0:
            bookings_q = bookings_q.join(models.Room).filter(models.Room.branch_id == branch_id)
            
        daily_bookings = []
        for b in bookings_q.order_by(models.Booking.start_time.asc()).all():
            daily_bookings.append({
                "room_name": b.room.name if b.room else "N/A",
                "client_name": b.client.name if b.client else "N/A",
                "start_time": b.start_time.isoformat(),
                "end_time": b.end_time.isoformat(),
                "notes": b.notes or ""
            })

        return {
            "daily_sales": daily_sales,
            "orders_by_category": orders_by_category,
            "recent_orders": recent_orders,
            "debts": debts,
            "daily_bookings": daily_bookings
        }
    def get_management_dashboard(self, month: Optional[int] = None, year: Optional[int] = None) -> Dict[str, Any]:
        now = datetime.utcnow()
        if not year: year = now.year
        if month is None: month = now.month

        months_names_es = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ]

        branches = self.uow.db.query(models.Branch).filter(models.Branch.is_active == True).all()
        branch_ids = [b.id for b in branches]
        branch_names = {b.id: b.name for b in branches}

        # 1. Income Trend (Full Year)
        income_trend = []
        for m_idx in range(1, 13):
            m_name = months_names_es[m_idx-1]
            
            row = {"month": m_name}
            for b_id in branch_ids:
                inc = self.uow.db.query(func.sum(models.Receipt.amount)).filter(
                    models.Receipt.type == "income",
                    extract('month', models.Receipt.date) == m_idx,
                    extract('year', models.Receipt.date) == year,
                    models.Receipt.branch_id == b_id
                ).scalar() or 0.0
                row[branch_names[b_id]] = float(inc)
            income_trend.append(row)

        # 2. Orders by Branch (Pie Chart)
        orders_by_branch = []
        for b_id in branch_ids:
            q = self.uow.db.query(models.Orden).filter(
                models.Orden.branch_id == b_id,
                models.Orden.status != "cancelled"
            )
            if year:
                q = q.filter(extract('year', models.Orden.date) == year)
            if month and month > 0:
                q = q.filter(extract('month', models.Orden.date) == month)
                
            count = q.count()
            orders_by_branch.append({"branch": branch_names[b_id], "count": count})

        # 3. Mayor Nest Coworking - Monthly Performance per Branch
        # Calculate for ALL 12 months of the selected year
        mayor_nest = {}
        for b_id in branch_ids:
            perf_list = []
            for m_idx in range(1, 13):
                m_name = months_names_es[m_idx-1]
                
                # Income
                inc = self.uow.db.query(func.sum(models.Receipt.amount)).filter(
                    models.Receipt.type == "income",
                    extract('month', models.Receipt.date) == m_idx,
                    extract('year', models.Receipt.date) == year,
                    models.Receipt.branch_id == b_id
                ).scalar() or 0.0
                
                # Expenses
                exp_direct = self.uow.db.query(func.sum(models.Expense.amount)).filter(
                    models.Expense.branch_id == b_id,
                    extract('month', models.Expense.date) == m_idx,
                    extract('year', models.Expense.date) == year
                ).scalar() or 0.0
                
                exp_purchases = self.uow.db.query(func.sum(models.Receipt.amount)).filter(
                    models.Receipt.type == "expense",
                    models.Receipt.branch_id == b_id,
                    extract('month', models.Receipt.date) == m_idx,
                    extract('year', models.Receipt.date) == year
                ).scalar() or 0.0
                
                total_exp = float(exp_direct) + float(exp_purchases)
                balance = float(inc) - total_exp
                profitability = (balance / float(inc) * 100) if inc > 0 else 0.0
                
                perf_list.append({
                    "branch_name": branch_names[b_id],
                    "month_idx": m_idx,
                    "month": m_name,
                    "income": float(inc),
                    "expenses": total_exp,
                    "balance": balance,
                    "profitability": round(profitability, 2)
                })
            mayor_nest[branch_names[b_id]] = perf_list

        # 4. Monthly Detail Tables (For selected month/year)
        monthly_details = []
        for b_id in branch_ids:
            # Income by Category
            # Mapping logic for categories
            def map_cat(name):
                n = (name or "").lower()
                if "privada" in n or "oficina" in n: return "Oficina Privada"
                if "fijo" in n or "escritorio" in n: return "Escritorio Fijo"
                if "reuniones" in n or "sala" in n: return "Sala de Reuniones"
                if "eventos" in n or "salon" in n: return "Salon de Eventos"
                if "daypass" in n or "day pass" in n: return "Daypass"
                if "digital" in n: return "Servicios Digitales"
                if "servicio" in n: return "Servicios de Sala"
                return "Otros"

            inc_by_cat_map = {}
            pedidos = self.uow.db.query(models.Pedido.item_name, models.Pedido.subtotal).join(
                models.Orden, models.Pedido.orden_id == models.Orden.id
            ).filter(
                models.Orden.branch_id == b_id,
                extract('month', models.Orden.date) == (month or now.month),
                extract('year', models.Orden.date) == (year or now.year),
                models.Orden.status != "cancelled"
            ).all()
            
            for name, sub in pedidos:
                cat = map_cat(name)
                inc_by_cat_map[cat] = inc_by_cat_map.get(cat, 0.0) + float(sub or 0.0)
            
            # Income by Method
            inc_methods = self.uow.db.query(models.Receipt.payment_method, func.sum(models.Receipt.amount)).filter(
                models.Receipt.type == "income",
                models.Receipt.branch_id == b_id,
                extract('month', models.Receipt.date) == (month or now.month),
                extract('year', models.Receipt.date) == (year or now.year)
            ).group_by(models.Receipt.payment_method).all()
            
            # Expenses by Category
            exp_cats = self.uow.db.query(models.Expense.category, func.sum(models.Expense.amount)).filter(
                models.Expense.branch_id == b_id,
                extract('month', models.Expense.date) == (month or now.month),
                extract('year', models.Expense.date) == (year or now.year)
            ).group_by(models.Expense.category).all()
            
            # Expenses by Method (Combining Expense payments and Purchase payments)
            exp_methods_map = {}
            # 1. Direct expenses methods
            exp_m_1 = self.uow.db.query(models.Expense.payment_method, func.sum(models.Expense.amount)).filter(
                models.Expense.branch_id == b_id,
                extract('month', models.Expense.date) == (month or now.month),
                extract('year', models.Expense.date) == (year or now.year)
            ).group_by(models.Expense.payment_method).all()
            for m, val in exp_m_1:
                if m: exp_methods_map[m] = exp_methods_map.get(m, 0.0) + float(val)
                
            # 2. Purchase payments methods
            exp_m_2 = self.uow.db.query(models.Receipt.payment_method, func.sum(models.Receipt.amount)).filter(
                models.Receipt.type == "expense",
                models.Receipt.branch_id == b_id,
                extract('month', models.Receipt.date) == (month or now.month),
                extract('year', models.Receipt.date) == (year or now.year)
            ).group_by(models.Receipt.payment_method).all()
            for m, val in exp_m_2:
                if m: exp_methods_map[m] = exp_methods_map.get(m, 0.0) + float(val)

            monthly_details.append({
                "branch_name": branch_names[b_id],
                "income_by_category": [{"category": k, "amount": v} for k, v in inc_by_cat_map.items()],
                "income_by_method": [{"method": row[0], "amount": float(row[1])} for row in inc_methods if row[0]],
                "expenses_by_category": [{"category": row[0], "amount": float(row[1])} for row in exp_cats if row[0]],
                "expenses_by_method": [{"method": k, "amount": v} for k, v in exp_methods_map.items()]
            })

        return {
            "income_trend": income_trend,
            "orders_by_branch": orders_by_branch,
            "mayor_nest_performance": mayor_nest,
            "monthly_details": monthly_details,
            "year": year,
            "month": month
        }
