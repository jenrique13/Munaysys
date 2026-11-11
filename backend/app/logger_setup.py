import os
import logging
from logging.handlers import TimedRotatingFileHandler

def setup_logging():
    # Asegurar que el directorio Logs existe
    log_dir = os.path.join(os.getcwd(), "Logs")
    os.makedirs(log_dir, exist_ok=True)
    
    # Configurar el formato: Nivel - FechaHora - [Modulo:Metodo/Funcion] -> Mensaje
    log_format = logging.Formatter(
        "%(asctime)s - %(levelname)s - [%(name)s.%(module)s.%(funcName)s] - %(message)s"
    )
    
    # Handler para rotación de archivos (Rotación diaria medianoche, manteniendo 30 días)
    file_handler = TimedRotatingFileHandler(
        os.path.join(log_dir, "munaysys.log"),
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8"
    )
    file_handler.setFormatter(log_format)
    file_handler.setLevel(logging.INFO)
    
    # Opcional: Handler para la consola para ver los logs en terminal mientras se desarrolla
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_format)
    console_handler.setLevel(logging.INFO)
    
    # Configurar el root logger del sistema
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Evitar duplicar handlers si la función se llama múltiples veces
    if not root_logger.handlers:
        root_logger.addHandler(file_handler)
        root_logger.addHandler(console_handler)
        
    logging.info("Sistema de Logging Inicializado Profesionalmente.")
