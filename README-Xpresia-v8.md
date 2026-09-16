# Xpresia Neon v8 — motor de puntuación recalibrado

Base: Xpresia Neon v7 (finalización estable).

Cambios:
- Reescritura del cálculo de Actividad, Coordinación, Fluidez, Estabilidad y Variedad.
- Curvas de respuesta y contraste ampliado para evitar concentración artificial en 50–70.
- Cada métrica usa señales distintas y no solo la cantidad de movimiento.
- Canto conserva la combinación 55% expresión corporal + 45% voz cuando existen muestras vocales.
- Eliminado el fallback universal a 50: si hay muestras, se calcula una puntuación degradada; si no hay muestras, el resultado es 0 y se informa la causa.
- Cámara, MediaPipe, micrófono, temporizador y finalización se mantienen sobre la base v7.

Prueba recomendada:
1. 10 s quieto.
2. 10 s con movimientos pequeños.
3. 10 s con movimientos amplios y variados.
4. Comparar las cinco habilidades.
5. En Canto, probar con micrófono y una nota sostenida seguida de una frase/canción.
