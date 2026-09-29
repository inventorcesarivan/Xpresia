# Xpresia — grabación audiovisual V61

- La grabación de evaluaciones con cámara ahora mezcla en una sola pista de audio el micrófono y, cuando existe, la música de fondo.
- En Karaoke se intenta incorporar el audio técnico del video cuando la fuente permite acceso directo (por ejemplo, archivos de Google Drive reproducibles como HTML5).
- En Karaoke con cámara, la grabación compone el video de fondo accesible y la cámara del usuario en una sola imagen grabada.
- Las fuentes embebidas de YouTube/Google Drive `/preview` permanecen sujetas a las restricciones de seguridad del navegador: su contenido no puede ser leído píxel por píxel ni su audio capturado directamente desde un iframe de otro origen.
- La grabación sigue siendo WebM/MP4 según el soporte de `MediaRecorder` del navegador.
