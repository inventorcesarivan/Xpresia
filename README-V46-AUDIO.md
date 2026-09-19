# Xpresia v46 — audio de micrófono y karaoke

- Se aumentó la sensibilidad de captura del micrófono sin cambiar la interfaz.
- Se desactivaron noise suppression y echo cancellation para evitar que la voz sea atenuada durante canto/lectura; se mantiene auto gain control.
- Se aumentó la ganancia interna y la resolución de los analizadores.
- Se bajó el umbral de actividad de voz para captar señales más suaves.

## Karaoke
Los karaokes actuales se reproducen dentro de iframes de YouTube/Google Drive. Por las políticas de seguridad del navegador (orígenes cruzados), una página no puede leer directamente el audio interno de esos iframes con Web Audio. Por eso Xpresia no puede dibujar las barras rojas a partir del audio real de un YouTube/Drive embebido sin disponer de una fuente de audio accesible (por ejemplo un MP3/MP4 servido con CORS desde el propio sitio).

La evaluación de karaoke no se hace depender de esas barras: cuando la canción aporta BPM/tempo se utiliza esa referencia; de lo contrario se evalúa la voz por sus propias características.
