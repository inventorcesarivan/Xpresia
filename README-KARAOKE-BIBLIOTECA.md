# Biblioteca de Karaoke Xpresia

Esta versión agrega un buscador que carga `karaoke-library.json`. Para pruebas, el archivo contiene el karaoke de Drive proporcionado por el usuario.

## Agregar canciones

Editar `karaoke-library.json` y añadir objetos con `title`, `artist`, `genre` y `url` (enlace compartido de Google Drive o YouTube). Al publicar la carpeta en Netlify, el botón **↻ Actualizar** vuelve a leer la biblioteca.

## Próximo paso

Para que la biblioteca se sincronice automáticamente con una carpeta de Google Drive, habrá que conectar una API/intermediario (por ejemplo Google Apps Script/Drive API) que genere la lista de archivos. Esta prueba mantiene la reproducción que ya funciona y solo automatiza la selección mediante un catálogo JSON.
