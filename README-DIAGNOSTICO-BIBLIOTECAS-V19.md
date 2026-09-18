# Xpresia v19 — Bibliotecas de Google Drive

Esta versión corrige dos problemas de la v18:

- El puente móvil de Apps Script ahora devuelve explícitamente `folderId` y `folderName` junto con las canciones.
- Si se conecta una carpeta personalizada y esa carpeta no puede ser leída, Xpresia **no** muestra la biblioteca local de prueba de la carpeta principal.
- Netlify sigue enviando `folderId` al Apps Script y verifica que la respuesta corresponda a esa misma carpeta.

## Apps Script

Copiar `karaoke-folder-apps-script.gs` al proyecto existente y volver a implementar como aplicación web.
No es necesario crear otro proyecto.

Para una carpeta de otra cuenta, la cuenta que aparece como propietaria/ejecutora del Web App debe tener acceso a la carpeta compartida. Si no lo tiene, Xpresia mostrará el error de acceso en lugar de sustituir la biblioteca.

## Prueba concreta

Se agregó `testSpecificFolder()`. Pega el ID de la carpeta secundaria en esa función y ejecútala desde el editor de Apps Script. El registro mostrará el nombre de la carpeta y los vídeos encontrados.
