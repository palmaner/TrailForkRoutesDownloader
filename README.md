
# Trailforks GPX Exporter (Userscript + Simple UI)

Contenido del ZIP:
- index.html  -> Página simple para pegar una URL de Trailforks y abrirla con el parámetro `tf_gpx_auto=1`.
- tf-gpx-auto.user.js -> Userscript (Tampermonkey/Violentmonkey). Al detectar `?tf_gpx_auto=1` en la URL, extrae `encodedpath`, decodifica la polyline y descarga el GPX automáticamente.
- README.md -> Este archivo con instrucciones.

## Instalación rápida

1. Instala una extensión de userscripts en tu navegador:
   - Chrome/Edge: Tampermonkey (https://www.tampermonkey.net/)
   - Firefox: Violentmonkey o Tampermonkey
   - Android (navegadores compatibles): Tampermonkey en Kiwi Browser o Violentmonkey en Bromite (opcional)

2. Instala el userscript `tf-gpx-auto.user.js`:
   - Abre Tampermonkey -> Create a new script -> pega el contenido de `tf-gpx-auto.user.js` y guarda.
   - Asegúrate de que el script está activado y tiene permiso para `https://www.trailforks.com/*`.

3. Despliega `index.html` (por ejemplo en Vercel) o ábrelo localmente en tu navegador.
   - Pega la URL del trail (ej: https://www.trailforks.com/trails/mortal-kombat-540562/).
   - Pulsa **Descargar**. Se abrirá una pestaña al trail con `?tf_gpx_auto=1`. El userscript detectará el parámetro y, si puede extraer `encodedpath`, descargará el GPX automáticamente.

## Notas y solución de problemas
- Debes estar logueado en Trailforks si la ruta lo requiere.
- Si la página no incluye `encodedpath` en su HTML, el script propondrá ir a la versión `/map/` y reintentar.
- Si no funciona en un trail concreto, pega aquí la URL y lo reviso (puede que esa ruta tenga restricciones locales).
- El userscript no envía nada a servidores externos; todo se ejecuta localmente en tu navegador.
