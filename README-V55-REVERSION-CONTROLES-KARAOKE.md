# Xpresia v55 — Reversión del reproductor de Karaoke

Se revierte el reproductor HTML5 experimental de v53/v54 y se vuelve al reproductor incrustado de Google Drive que funcionaba correctamente en v52.

Cambios: 
- Se mantiene la reproducción mediante iframe de Google Drive.
- Se mantiene `rm=minimal` en la URL del reproductor.
- Se evita que el usuario pueda tocar directamente los controles internos del iframe mediante `pointer-events:none`, para que no interfieran con las letras ni pausen el video sin que Xpresia lo controle.
- No se cambia la lógica de biblioteca, caché ni evaluación de v52.

Nota: un iframe de otro dominio no permite a Xpresia ocultar sus controles internos mediante CSS. Esta versión evita su interacción; el parámetro `rm=minimal` queda activo para pedir a Drive la interfaz mínima.
