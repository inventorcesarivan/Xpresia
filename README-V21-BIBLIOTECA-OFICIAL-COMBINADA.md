# Xpresia v21 — Biblioteca oficial combinada

## Arquitectura
- La biblioteca oficial se carga automáticamente al entrar en Karaoke.
- Los IDs de las carpetas oficiales están únicamente en `karaoke-folder-apps-script.gs`.
- Xpresia/Netlify no expone los IDs de las bibliotecas oficiales.
- Se pueden combinar varias carpetas oficiales de distintas cuentas siempre que la cuenta que ejecuta Apps Script tenga acceso a ellas.
- El usuario puede conectar una sola biblioteca personal mediante el enlace de una carpeta de Google Drive.
- El usuario puede volver a la biblioteca oficial con `↺ Biblioteca oficial`.

## Agregar bibliotecas oficiales
En `karaoke-folder-apps-script.gs`, dentro de `OFFICIAL_FOLDER_IDS`, agrega los IDs reales:

```js
const OFFICIAL_FOLDER_IDS = [
  'ID_CARPETA_PRINCIPAL',
  'ID_SEGUNDA_CARPETA_OFICIAL',
  'ID_TERCERA_CARPETA_OFICIAL'
];
```

No pongas enlaces completos: solo el ID de cada carpeta.

Después de modificar Apps Script: **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**.

La URL del Web App debe seguir siendo la misma.

## Importante
Las carpetas oficiales pueden pertenecer a cuentas diferentes, pero deben estar compartidas con la cuenta que figura en Apps Script como **Ejecutar como: Yo**.

Las carpetas oficiales se combinan en una única lista y se eliminan duplicados por ID de archivo.
