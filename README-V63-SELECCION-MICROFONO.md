# Xpresia v63 — selección inteligente de cámara y micrófono (solo Canto)

- Se mantiene el flujo de selección de cámara únicamente para Canto.
- El panel auxiliar ya no aparece si el dispositivo tiene una sola cámara y un solo micrófono.
- Si hay 2 o más cámaras, el panel muestra las cámaras disponibles para elegir.
- Si hay 2 o más micrófonos, el mismo panel muestra los micrófonos disponibles para elegir.
- Si solo uno de los dos tipos tiene múltiples dispositivos, el panel muestra únicamente ese tipo.
- La selección de micrófono se aplica realmente al `getUserMedia` utilizado por la evaluación.
- Si hay un único dispositivo de cada tipo, se seleccionan automáticamente y no se muestra el panel.
- Las demás habilidades conservan el flujo anterior a la selección de cámara global de v61.
