# Xpresia — Karaoke v13: puente Netlify para móviles

Esta versión cambia la prioridad de carga de la biblioteca:

1. `/.netlify/functions/karaoke` — llamada same-origin desde Xpresia hacia una función de Netlify. La función consulta el Apps Script y devuelve JSON. Esta es la vía principal y evita CORS/JSONP en Android.
2. Puente HTML de Apps Script — respaldo.
3. JSONP directo a Apps Script — último respaldo.
4. `karaoke-library.json` — solo respaldo local de prueba.

## Importante
La vía principal requiere que Xpresia esté publicada en Netlify. Si se abre `index.html` directamente como archivo local, la función `/.netlify/functions/karaoke` no existe y Xpresia seguirá intentando los métodos secundarios.

No es necesario cambiar el código de Apps Script para esta versión: utiliza la implementación `/exec` que ya comprobamos que devuelve `ok:true` y las canciones reales.

## Netlify
El archivo `netlify/functions/karaoke.js` queda incluido en el proyecto. Netlify detecta automáticamente las funciones dentro de esa carpeta.
