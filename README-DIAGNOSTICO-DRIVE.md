# Diagnóstico Xpresia Karaoke v13

Apps Script ya fue comprobado: la implementación activa devuelve `ok:true` y una lista real de vídeos de la carpeta de Drive.

La v13 agrega una función Netlify server-side (`netlify/functions/karaoke.js`) para que PC y móvil consulten la biblioteca mediante una petición same-origin. Así el navegador móvil no depende de JSONP, CORS ni de iframes de Apps Script.

### Prueba recomendada
1. Publicar/desplegar la carpeta completa en Netlify.
2. Abrir la URL HTTPS de Netlify.
3. Entrar en Canto → Karaoke.
4. Pulsar `↻ Actualizar`.
5. Deben aparecer las canciones reales de Drive.

No es necesario modificar ni volver a publicar Apps Script para esta v13.
