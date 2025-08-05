import os
import re
from urllib.parse import urljoin
from flask import Flask, request, render_template, redirect, url_for, send_file, flash
import requests
from bs4 import BeautifulSoup
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()  # carga variables de .env

EMAIL = os.getenv("TRAILFORKS_EMAIL")
PASSWORD = os.getenv("TRAILFORKS_PASSWORD")
if not EMAIL or not PASSWORD:
    raise RuntimeError("Define TRAILFORKS_EMAIL y TRAILFORKS_PASSWORD en .env")

LOGIN_URL = "https://www.trailforks.com/login"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
}

app = Flask(__name__)
app.secret_key = os.urandom(24)


def tf_session():
    """Crea una sesión autenticada en Trailforks."""
    s = requests.Session()
    # 1) Obtener token CSRF
    r1 = s.get(LOGIN_URL, headers=HEADERS)
    soup = BeautifulSoup(r1.text, "html.parser")
    token_input = soup.find("input", {"name": "csrfmiddlewaretoken"})
    if not token_input:
        raise RuntimeError("No se pudo encontrar el token CSRF en la página de login. Trailforks pudo haber cambiado su web.")
    token = token_input["value"]

    # 2) Login
    payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "csrfmiddlewaretoken": token
    }
    # Incluimos la cookie del token en headers
    res = s.post(LOGIN_URL, data=payload, headers={**HEADERS, "Referer": LOGIN_URL})
    if res.url.endswith("/login/"):
        raise RuntimeError("Error de login: revisa tus credenciales.")
    return s


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        trail_url = request.form.get("trail_url", "").strip()
        if "trailforks.com/trails/" not in trail_url:
            flash("⚠️ URL no válida. Debe ser una ruta de trailforks.com", "error")
            return redirect(url_for("index"))

        try:
            session = tf_session()
            # 3) Obtener página de la ruta
            r2 = session.get(trail_url, headers=HEADERS)
            soup2 = BeautifulSoup(r2.text, "html.parser")
            # 4) Buscar enlace de GPX
            a = soup2.find("a", href=re.compile(r"\.gpx$"), text=re.compile(r"Download GPX", re.I))
            if not a:
                raise RuntimeError("No se encontró enlace GPX en la página.")
            gpx_url = urljoin(trail_url, a["href"])
            # 5) Descargar GPX y enviarlo
            g = session.get(gpx_url, headers=HEADERS)
            return send_file(
                BytesIO(g.content),
                as_attachment=True,
                download_name="trailforks_route.gpx",
                mimetype="application/gpx+xml"
            )
        except Exception as e:
            flash(f"❌ Ha ocurrido un error: {e}", "error")
            return redirect(url_for("index"))

    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)