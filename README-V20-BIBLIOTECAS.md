# Xpresia v20 — Bibliotecas de Google Drive

## Flujo
Xpresia -> Netlify -> Apps Script -> carpeta Drive solicitada.

## Apps Script
1. Reemplaza el código por `karaoke-folder-apps-script.gs`.
2. Implementa como aplicación web.
3. Ejecutar como: Yo.
4. Quién tiene acceso: Cualquiera.
5. Crea una nueva versión y vuelve a implementar.

## Para una carpeta de otra cuenta
La carpeta externa debe estar compartida con la **misma cuenta que figura como propietaria/ejecutora del Apps Script**.

Para diagnosticar: pega el ID de la carpeta externa en `TEST_FOLDER_ID` y ejecuta `testSpecificFolder()`.
- Si encuentra los vídeos: Apps Script tiene acceso y Xpresia podrá leer la carpeta.
- Si da un error de permisos: hay que compartir la carpeta con la cuenta ejecutora del Apps Script.

La v20 no sustituye una carpeta externa por la biblioteca principal cuando falla.
