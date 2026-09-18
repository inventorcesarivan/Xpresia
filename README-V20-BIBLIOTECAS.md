# Xpresia v20 — Biblioteca de Karaoke

## Funcionamiento

Xpresia inicia automáticamente con una biblioteca propia de Google Drive. La carpeta predeterminada está configurada internamente y **no se muestra al usuario**.

La carpeta predeterminada actual es:

`https://drive.google.com/drive/folders/1bCMFbQS5FFu9Ot65MCbNDgmY2z27WpUm`

El usuario conserva una única opción visible:

**➕ Cargar otro karaoke mediante enlace**

Ese campo acepta:
- un enlace de YouTube para cargar un karaoke individual;
- un enlace a un archivo de Google Drive compartido como lector para cargar un karaoke individual;
- un enlace a una carpeta de Google Drive para reemplazar temporalmente la biblioteca mostrada por otra biblioteca.

La biblioteca predeterminada se carga mediante:

`Xpresia -> Netlify Function -> Apps Script -> carpeta de Google Drive`

## Importante

Para que la biblioteca predeterminada funcione, la cuenta que ejecuta Apps Script debe tener acceso a la carpeta indicada.

No se utiliza `localStorage` para cambiar la biblioteca predeterminada. El enlace de la biblioteca propia queda fijo dentro de Xpresia y Netlify.

## Prueba

1. Publicar la carpeta completa en Netlify.
2. Abrir Xpresia.
3. Entrar en Canto -> Karaoke.
4. La biblioteca debería cargarse automáticamente.
5. Para probar otra carpeta, pegar su enlace en **Cargar otro karaoke mediante enlace**.
