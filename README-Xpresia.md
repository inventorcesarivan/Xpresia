# Xpresia — Neon v3: evaluación inteligente + canto por voz

Esta versión parte de la base estable con interfaz Neon v2 y agrega un módulo experimental de análisis vocal para Canto, además de una calibración de puntuación para reducir la concentración artificial de resultados alrededor de 60–70.

## Cambios principales

### 1. Puntuación corporal mejor calibrada
Se conserva el análisis corporal existente (Actividad, Coordinación, Fluidez, Estabilidad y Variedad), pero la salida final utiliza una calibración no lineal para aprovechar mejor el rango 0–100. Esto busca que una actuación claramente débil, media o sobresaliente no termine agrupada innecesariamente en un mismo intervalo.

La calibración no pretende decir que el sistema ya sea una IA entrenada: sigue siendo un modelo matemático basado en características extraídas de MediaPipe Pose.

### 2. Canto — voz + expresión
La disciplina Canto ahora combina:
- Análisis corporal.
- Detección de voz durante la evaluación.
- Afinación aproximada respecto del temperamento de 12 semitonos.
- Estabilidad de la altura vocal.
- Dinámica de intensidad.
- Presencia/actividad vocal.
- Rango tonal aproximado.

Para Canto se solicita activar el micrófono. Si no está activo, la evaluación vocal no se ejecuta.

### 3. Panel de análisis vocal
Durante Canto aparece un panel con:
- Afinación
- Estabilidad
- Dinámica
- Presencia vocal

El resultado final combina 55% del desempeño corporal y 45% del módulo vocal cuando el micrófono está activo.

## Sobre incorporar una IA real
La arquitectura actual queda preparada conceptualmente para una segunda etapa de IA, pero esta versión no contiene todavía un modelo de aprendizaje automático entrenado.

El siguiente salto de precisión debería hacerse con un modelo híbrido:
1. MediaPipe Pose para obtener la secuencia corporal.
2. Extracción de características temporales normalizadas.
3. Un modelo pequeño entrenado con ejemplos reales de actuaciones.
4. Análisis vocal separado para Canto.
5. Una capa final de calibración que convierta las predicciones en una puntuación 0–100.

Para entrenar esa IA de forma seria sería necesario construir un conjunto de ejemplos etiquetados por habilidad y nivel. Eso permitiría que Xpresia aprenda qué patrones distinguen, por ejemplo, una actuación excelente de una simplemente activa.

## Compatibilidad
Se mantiene la arquitectura estática del proyecto: cámara y MediaPipe siguen dependiendo de sus recursos CDN, mientras que el análisis vocal se realiza localmente mediante Web Audio API.
