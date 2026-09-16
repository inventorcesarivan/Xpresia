# Xpresia – correcciones de biblioteca Karaoke en móvil

Esta versión parte de la versión de Xpresia confirmada funcionando con la carpeta de Google Drive y mantiene la URL de Apps Script configurada.

## Cambios
- La biblioteca propia de Xpresia vuelve a ser la biblioteca inicial al abrir la aplicación. Una carpeta externa solo se activa al pulsar **Conectar**.
- Si Apps Script tarda o falla temporalmente en un móvil, Xpresia intenta mostrar `karaoke-library.json` como respaldo en lugar de dejar la biblioteca vacía.
- Se amplió el tiempo de espera de la consulta a Apps Script a 20 segundos.
- Al reanudar Xpresia desde memoria/bfcache en móviles, se fuerza el **menú principal** en lugar de restaurar la pantalla de configuración que había quedado abierta.
- Al volver a hacer visible la aplicación, si la biblioteca quedó vacía, se realiza un nuevo intento de carga.

## Nota
La biblioteca externa sigue funcionando mediante el enlace de carpeta y el Apps Script. El botón **↩ Usar biblioteca de Xpresia** devuelve la carpeta oficial.
