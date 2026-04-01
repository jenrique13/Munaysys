import io
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from fastapi import HTTPException, status
import os

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "reports")

def render_html_to_pdf(template_name: str, context: dict) -> io.BytesIO:
    """
    Renders a Jinja2 template to PDF using xhtml2pdf.
    """
    try:
        env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
        template = env.get_template(template_name)
        html_content = template.render(context)
        
        result = io.BytesIO()
        pisa_status = pisa.CreatePDF(html_content, dest=result)
        
        if pisa_status.err:
            raise Exception("Error rendering PDF with pisa")
            
        result.seek(0)
        return result
    except Exception as e:
        import logging
        logging.getLogger("uvicorn").error(f"Error generating PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar el PDF: {str(e)}"
        )
