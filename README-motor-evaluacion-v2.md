# XPRESIA — Motor de evaluación v2

Esta versión recalibra el motor de puntuación sin alterar cámara, micrófono, temporizador, grabación ni interfaz.

## Cambios
- Todas las habilidades usan una escala final de 0 a 100, con máximo real de 100.
- La duración afecta la confiabilidad de los datos, pero no limita el máximo: una prueba corta puede alcanzar 100 si la evidencia disponible es excelente.
- Lectura adapta el texto a la duración elegida y no penaliza automáticamente por no terminar un texto demasiado largo.
- Lectura separa precisión, fluidez, pausas, expresión vocal y cobertura útil.
- Canto mejora la evaluación de afinación: se compara cada frecuencia con la nota musical más cercana, en lugar de exigir A4/440 Hz como referencia.
- Canto separa afinación, estabilidad, dinámica, rango, presencia y actividad vocal.
- Cámara y solo micrófono producen escalas comparables: sin cámara no se inventa una penalización corporal.
- La música no reduce la puntuación por estar apagada; cuando está presente acompaña la evaluación, sin convertir volumen en calidad artística.

## Nota
La IA entrenada con ejemplos reales todavía no forma parte de esta versión. Esta etapa prepara señales y métricas más confiables para poder incorporar posteriormente un modelo aprendido sin romper el sistema estable.
