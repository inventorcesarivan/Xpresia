# Xpresia v12 — Puente de biblioteca Karaoke para móviles

La biblioteca de Google Drive ya fue verificada desde Apps Script. Esta versión añade un segundo método de comunicación: un iframe HTML de Apps Script que usa `google.script.run` y envía la biblioteca al Xpresia padre mediante `postMessage`. JSONP queda como respaldo.

## IMPORTANTE: actualizar Apps Script

Reemplaza el contenido del archivo del proyecto de Apps Script por `karaoke-folder-apps-script.gs` incluido aquí.

Luego:
1. Guarda el proyecto.
2. Ve a Implementar → Administrar implementaciones.
3. Edita la implementación web activa (no crear otra si no es necesario).
4. Selecciona una nueva versión y pulsa Implementar.
5. Mantén la misma URL `/exec` activa.
6. Comprueba que "Ejecutar como" sea el propietario y que el acceso permita a Xpresia abrir la aplicación web.

Después prueba primero la URL `/exec` directamente. No debería aparecer el error de `doGet`.

## Prueba en Xpresia

Canto → Karaoke → Actualizar.

En PC seguirá funcionando con el puente y, si éste no responde, JSONP. En móvil se intenta primero el puente, evitando depender de la ejecución de JSONP de Apps Script.
