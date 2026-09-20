# Xpresia v56 — Controles del reproductor Karaoke

- Se mantiene el reproductor funcional de Google Drive de v55.
- Se añaden `controls=0` y `toolbar=0` a la URL de vista previa; si Drive los respeta, reduce/oculta la interfaz del reproductor.
- Como respaldo visual, el iframe se extiende por debajo del contenedor y se recorta con `overflow:hidden`, intentando dejar los controles inferiores fuera de la zona visible sin sustituir el video.
- El iframe continúa sin interacción directa (`pointer-events:none`), por lo que los controles no pueden pausar la evaluación.
- No se usa el reproductor HTML5 experimental de v53/v54.
