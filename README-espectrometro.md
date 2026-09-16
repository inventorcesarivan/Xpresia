# XPRESIA — Espectrómetro visual

Esta versión incorpora un espectrómetro visual en tiempo real durante las evaluaciones cuando el micrófono está activo.

- En evaluaciones con cámara, aparece superpuesto en la parte inferior del área de video.
- En Canto y Lectura en modo Solo micrófono, aparece sobre la imagen representativa.
- El gráfico utiliza la señal captada por el micrófono y se oculta automáticamente cuando termina la evaluación o se desactiva el micrófono.
- No requiere enviar el audio a un servidor: el análisis visual se realiza localmente mediante Web Audio API.
