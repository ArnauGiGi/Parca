import sys
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

def main():
    try:
        # Cargar variables de entorno
        load_dotenv()
        
        # Obtener argumentos
        if len(sys.argv) != 3:
            print("Error: Se requieren dos argumentos (email y datos del juego)")
            sys.exit(1)
            
        recipient_email = sys.argv[1]
        game_data = json.loads(sys.argv[2])
        
        # Configuración del servidor SMTP
        smtp_server = "smtp.gmail.com"
        port = 587
        sender_email = os.getenv("EMAIL_USER")
        password = os.getenv("EMAIL_PASSWORD")

        if not sender_email or not password:
            print("Error: Credenciales de email no encontradas en .env")
            sys.exit(1)

        # Crear mensaje
        message = MIMEMultipart("alternative")
        message["Subject"] = "Resumen de tu partida en Parca"
        message["From"] = sender_email
        message["To"] = recipient_email

        # HTML del email
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a1b1e; color: white; padding: 20px; border-radius: 10px;">
              <h1 style="color: {'#4ade80' if game_data['didIWin'] else '#f87171'}; text-align: center;">
                {'¡Victoria!' if game_data['didIWin'] else '¡Derrota!'}
              </h1>
              
              <div style="background-color: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h2 style="color: #60a5fa; margin-bottom: 10px;">Tu Partida</h2>
                <p style="color: white; font-size: 18px;">{game_data['username']}</p>
                <p style="color: #9ca3af;">Respuestas correctas: {game_data['correctAnswers']}</p>
              </div>

              <div style="background-color: rgba(34,197,94,0.2); padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h2 style="color: #4ade80; margin-bottom: 10px;">Ganador</h2>
                <p style="color: white; font-size: 24px; font-weight: bold;">{game_data['winner']}</p>
              </div>

              <div style="background-color: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h2 style="color: #60a5fa; margin-bottom: 10px;">Duración de la Partida</h2>
                <p style="color: white; font-size: 20px;">{game_data['duration']}</p>
              </div>
            </div>
          </body>
        </html>
        """

        part = MIMEText(html, "html")
        message.attach(part)

        # Enviar email
        with smtplib.SMTP(smtp_server, port) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, recipient_email, message.as_string())
            print("Email enviado correctamente")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()