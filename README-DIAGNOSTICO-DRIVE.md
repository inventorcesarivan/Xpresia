# Xpresia — Diagnóstico de biblioteca Google Drive

## Problema actual
Si Xpresia muestra:
"Google Drive no respondió. Mostrando biblioteca local de prueba"
la página está funcionando, pero el endpoint de Google Apps Script no está entregando la respuesta JSONP a Xpresia.

## Revisar en Google Apps Script
1. Abrir el proyecto que contiene `karaoke-folder-apps-script.gs`.
2. Ejecutar manualmente `testFolderAccess()` una vez y autorizar los permisos de Drive.
3. Confirmar que el registro muestra la carpeta y vídeos encontrados.
4. Ir a **Implementar → Administrar implementaciones**.
5. Editar la implementación de tipo **Aplicación web**.
6. **Ejecutar como:** la cuenta propietaria del script.
7. **Quién tiene acceso:** cualquier usuario / cualquiera, según la opción que muestre Google.
8. Crear una nueva versión y volver a implementar.
9. Usar la URL `/exec` de esa implementación en `KARAOKE_API_URL` de `index.html`.

Importante: la carpeta y los vídeos deben ser accesibles por la cuenta que ejecuta el Apps Script. Que un archivo esté configurado como "cualquiera con el enlace" no sustituye los permisos de la cuenta que ejecuta `DriveApp`.

## Qué significa la canción de prueba
La canción que aparece después de pulsar Actualizar proviene exclusivamente de `karaoke-library.json`. No demuestra que Drive haya respondido.
