# Xpresia v54 — corrección de vídeo Karaoke

Se corrigió el problema introducido en v53 donde algunos vídeos de Google Drive podían reproducir el audio pero mostrar pantalla negra mediante el reproductor HTML5 directo.

Cambios:
- El reproductor HTML5 directo sigue siendo el primer intento.
- Se añadió una comprobación de que el navegador realmente está obteniendo una pista de vídeo (`videoWidth`/`videoHeight`).
- Si Drive entrega audio pero no un frame de vídeo utilizable, Xpresia cambia automáticamente al reproductor de Drive en lugar de dejar una pantalla negra.
- El reproductor alternativo mantiene `rm=minimal` para reducir al máximo los controles visibles.
- Los controles propios pequeños continúan funcionando cuando el reproductor HTML5 es compatible.
