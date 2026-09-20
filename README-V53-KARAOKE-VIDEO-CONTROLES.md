# Xpresia v53 — Karaoke con reproductor propio

Cambios principales:

- Los videos oficiales de karaoke de Google Drive se intentan reproducir mediante un `<video>` HTML5 propio de Xpresia.
- Se eliminan los controles grandes del reproductor de Google Drive cuando la reproducción nativa funciona.
- Se agregan controles compactos propios: reproducir/pausar y silenciar.
- En móvil los controles son pequeños y semitransparentes para no tapar las letras.
- Si el navegador no puede reproducir directamente el archivo de Drive, Xpresia conserva un reproductor alternativo de Drive para no dejar al usuario sin video.
- Durante una evaluación, pausar el video pausa automáticamente la evaluación, el cronómetro y el muestreo de voz.
- Reanudar el video reanuda la evaluación desde el punto exacto en que quedó.
- Si el video termina durante una evaluación, Xpresia finaliza automáticamente la evaluación.
- Se conserva la biblioteca oficial de Xpresia y el sistema de caché de versiones anteriores.
- El mensaje de carga sigue siendo: “Cargando biblioteca de Xpresia... Espera por favor, puede demorar un poco.”

Nota: la reproducción HTML5 depende de que los archivos de Google Drive estén accesibles para reproducción/descarga mediante enlace. Si un archivo concreto no admite reproducción directa, se activa el reproductor alternativo de Drive.
