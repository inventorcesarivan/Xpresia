# Xpresia — Biblioteca Karaoke desde carpeta de Google Drive

## Carpeta configurada

ID:
`1aU7Zsf3p0VFGoFr2tM09h_ZShni9IkL2`

En esta versión Xpresia deja de depender de `karaoke-library.json` para la biblioteca principal. La aplicación web de Google Apps Script lee directamente los vídeos de esa carpeta y devuelve sus datos a Xpresia.

## 1. Crear el puente de Google Apps Script

1. Abre Google Apps Script: https://script.google.com/
2. Crea un proyecto nuevo.
3. Copia todo el contenido de `karaoke-folder-apps-script.gs` y pégalo en `Code.gs`.
4. Guarda el proyecto.
5. Ejecuta una vez `testFolderAccess` desde el editor.
6. Google solicitará autorización para acceder a Google Drive. Acepta con la cuenta que tiene acceso a la carpeta.
7. Ve a **Implementar → Nueva implementación**.
8. Tipo: **Aplicación web**.
9. Ejecutar como: **Yo** (tu cuenta).
10. Quién tiene acceso: selecciona la opción que permita acceso a cualquiera con el enlace, si aparece en tu cuenta.
11. Pulsa **Implementar**.
12. Copia la URL de la aplicación web, que termina normalmente en `/exec`.

## 2. Conectar Xpresia

Abre `index.html` y busca:

`const KARAOKE_API_URL = '';`

Pega entre las comillas la URL `/exec` de Apps Script.

Ejemplo:

`const KARAOKE_API_URL = 'https://script.google.com/macros/s/TU_ID/exec';`

No coloques la URL de la carpeta en ese campo. La carpeta ya está configurada en el Apps Script.

## 3. Cómo funcionará

- Xpresia consulta la biblioteca al abrir la aplicación.
- El Apps Script lista los vídeos existentes en la carpeta.
- La búsqueda de Xpresia funciona sobre esa lista.
- Al seleccionar una canción, se utiliza el reproductor oficial de vista previa de Google Drive.
- Para agregar una canción nueva solo hay que colocar otro vídeo dentro de la carpeta.
- El botón **↻ Actualizar** vuelve a consultar la carpeta.

## Importante sobre los nombres

Si un archivo se llama:

`Despacito - Luis Fonsi.mp4`

Xpresia mostrará:
- Título: Despacito
- Artista: Luis Fonsi

Si no utilizas ` - `, se mostrará todo el nombre como título.

## Permisos de los vídeos

Los usuarios que utilicen Xpresia deben poder abrir los vídeos de Drive. Por eso cada vídeo utilizado como karaoke debe estar compartido de forma que el reproductor pueda abrirlo para el usuario final.

## Fallback

El HTML conserva `karaoke-library.json` como respaldo. Si no se configura todavía `KARAOKE_API_URL`, Xpresia intenta utilizar ese archivo local para que la versión siga siendo probables mientras se configura Apps Script.
