from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable, ListItem
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def generate_pdf(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor("#4F46E5"),
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=15,
        spaceAfter=10,
        borderLeftColor=colors.HexColor("#4F46E5"),
        borderLeftWidth=5,
        leftIndent=10
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    normal_style.leading = 14
    
    story = []
    
    # Title
    story.append(Paragraph("Munaysys 2.0", title_style))
    story.append(Paragraph("Sistema Integral de Gestión para Espacios de Coworking", ParagraphStyle('Sub', parent=styles['Normal'], alignment=TA_CENTER, fontSize=12, textColor=colors.gray)))
    story.append(Spacer(1, 20))
    
    # Introduction
    story.append(Paragraph("<b>Munaysys</b> es una plataforma enterprise diseñada específicamente para optimizar la operación, administración y comercialización de centros de coworking y oficinas flexibles. Su arquitectura modular permite un control total desde la captación del cliente hasta la gestión financiera avanzada.", normal_style))
    story.append(Spacer(1, 15))
    
    # --- MODULES ---
    
    # CRM & Ventas
    story.append(Paragraph("1. Módulo CRM y Comercial", header_style))
    features_crm = [
        "<b>Gestión de Leads:</b> Captura y seguimiento de clientes potenciales desde múltiples fuentes.",
        "<b>Embudo de Ventas (Pipeline):</b> Visualización de oportunidades por etapas personalizables.",
        "<b>Presupuestos (Quotes):</b> Creación de cotizaciones profesionales con validez temporal.",
        "<b>Conversión Automática:</b> Transformación de presupuestos aprobados en órdenes de venta y creación de clientes con un solo clic."
    ]
    for f in features_crm:
        story.append(Paragraph(f"• {f}", normal_style))
    story.append(Spacer(1, 10))
    
    # Gestión Financiera
    story.append(Paragraph("2. Administración Financiera", header_style))
    features_fin = [
        "<b>Facturación y Órdenes:</b> Control de ventas de productos, servicios, amenidades y membresías.",
        "<b>Flujo de Caja (Cash Flow):</b> Registro detallado de ingresos y egresos vinculados a cuentas de caja real.",
        "<b>Tesorería Multi-Moneda:</b> Gestión de transacciones en USD y Bs. con integración de tasas BCV automáticas.",
        "<b>Cuentas por Cobrar/Pagar:</b> Seguimiento de deudas de clientes y compromisos con proveedores.",
        "<b>Métodos de Pago:</b> Soporte para múltiples formas de pago y conciliación."
    ]
    for f in features_fin:
        story.append(Paragraph(f"• {f}", normal_style))
    story.append(Spacer(1, 10))
    
    # Operaciones y Espacios
    story.append(Paragraph("3. Gestión Operativa", header_style))
    features_op = [
        "<b>Inventario de Espacios:</b> Control de oficinas privadas, escritorios fijos y áreas comunes.",
        "<b>Reservas de Salas:</b> Sistema de agendamiento para salas de reuniones por bloques de tiempo.",
        "<b>Control de Consumibles:</b> Gestión de stock y uso de suministros (cafetería, papelería, etc.).",
        "<b>Membresías y Paquetes:</b> Configuración de planes recurrentes y beneficios corporativos."
    ]
    for f in features_op:
        story.append(Paragraph(f"• {f}", normal_style))
    story.append(Spacer(1, 10))
    
    # Inteligencia de Negocio
    story.append(Paragraph("4. Reportes e Inteligencia", header_style))
    features_rep = [
        "<b>Dashboard Ejecutivo:</b> Indicadores clave (KPIs), tendencias de ingresos y niveles de ocupación.",
        "<b>Reportes Diarios:</b> Generación automática de cierres de caja y actividad diaria en PDF.",
        "<b>Análisis CRM:</b> Métricas de conversión y eficiencia del equipo de ventas.",
        "<b>Reportes de Gastos:</b> Análisis detallado de egresos por categoría para control presupuestario."
    ]
    for f in features_rep:
        story.append(Paragraph(f"• {f}", normal_style))
    story.append(Spacer(1, 10))
    
    # Configuración y Sedes
    story.append(Paragraph("5. Arquitectura Global (Multi-Sede)", header_style))
    features_sys = [
        "<b>Sistema Multi-Sede:</b> Capacidad de gestionar múltiples locales desde una sola base de datos, con segmentación total de inventarios y finanzas.",
        "<b>Roles y Permisos:</b> Control de acceso granular para Super Admins, Gerentes, Coordinadores y Vendedores.",
        "<b>Seguridad:</b> Autenticación robusta y trazabilidad de acciones críticas (Logs)."
    ]
    for f in features_sys:
        story.append(Paragraph(f"• {f}", normal_style))
    
    story.append(Spacer(1, 30))
    story.append(Paragraph("<i>Documento generado automáticamente por el sistema Munaysys – 2026.</i>", styles['Italic']))
    
    doc.build(story)

if __name__ == "__main__":
    import os
    output = "Alcance_Sistema_Munaysys.pdf"
    generate_pdf(output)
    print(f"PDF generado exitosamente en: {os.path.abspath(output)}")
