# Xpresia v58 — duración automática en Canto/Karaoke

- Se elimina el paso de selección manual de duración en Canto/Karaoke.
- Al seleccionar un karaoke, Xpresia usa primero una duración preanalizada si la biblioteca la proporciona.
- Si no existe, intenta leer la duración desde el archivo mediante el elemento de video oculto usado para análisis, sin cambiar el reproductor visible de Google Drive.
- La duración detectada se asigna automáticamente al temporizador.
- Si no se puede determinar la duración, no se completa el paso de selección del karaoke para evitar una evaluación con tiempo incorrecto.
