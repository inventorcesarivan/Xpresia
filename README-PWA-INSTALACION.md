# Xpresia v40 — instalación como aplicación (PWA)

Esta versión conserva el proyecto Xpresia v39 y añade la infraestructura para instalarlo como una aplicación web progresiva (PWA), sin necesidad de publicarlo en Google Play Store o Apple App Store.

## 1. Publicación

Sube **todo el contenido de esta carpeta** a GitHub Pages o Netlify.

La instalación debe hacerse desde una dirección **HTTPS**. No abras `index.html` directamente con `file://`, porque el navegador no puede instalar una PWA desde ese modo.

## 2. PC — Chrome / Edge / navegadores Chromium

1. Abre la URL HTTPS de Xpresia.
2. El navegador puede mostrar el icono de instalación en la barra de direcciones.
3. Si aparece dentro de Xpresia el botón **INSTALAR XPRESIA**, también puedes usarlo.
4. Acepta la instalación.

Xpresia se abrirá en una ventana independiente, sin la barra normal del navegador.

## 3. Android

En Chrome, abre la URL HTTPS de Xpresia.

- Puede aparecer la opción de instalar Xpresia automáticamente.
- También puede aparecer el botón **INSTALAR XPRESIA** dentro de la aplicación.
- Una vez instalada, Xpresia tendrá su propio icono y podrá abrirse como una aplicación independiente.

## 4. iPhone / iPad

En iOS la instalación se hace desde el menú del sistema:

1. Abre Xpresia en el navegador.
2. Pulsa **Compartir**.
3. Elige **Agregar a pantalla de inicio**.
4. Confirma.

Xpresia aparecerá en la pantalla de inicio como una aplicación.

## 5. Qué hace el Service Worker

Xpresia v40 incluye `service-worker.js`. Guarda la estructura básica y los recursos locales que se hayan visitado para mejorar la carga y permitir una recuperación básica si se pierde la conexión.

Esto **no convierte automáticamente en offline todas las funciones** que dependen de Internet, por ejemplo:

- bibliotecas externas de detección corporal;
- YouTube;
- Google Drive / la biblioteca de karaoke;
- APIs externas;
- archivos que todavía no hayan sido visitados y almacenados.

La cámara, el micrófono y la reproducción multimedia siguen dependiendo de las capacidades y permisos del navegador/dispositivo.

## 6. Archivos PWA incluidos

- `manifest.webmanifest` — identidad y comportamiento de la aplicación.
- `service-worker.js` — caché y recuperación básica.
- `assets/icons/icon-180.png` — icono para iOS.
- `assets/icons/icon-192.png` — icono PWA.
- `assets/icons/icon-512.png` — icono PWA de alta resolución.
- `index.html` — registro del manifest, Service Worker y flujo de instalación.

## 7. Actualizaciones

Cuando se publique una versión posterior, hay que cambiar el identificador `CACHE_NAME` de `service-worker.js` (por ejemplo `xpresia-v41-shell-1`). Así los dispositivos reciben la nueva caché.


## v41 — botón de instalación propio

Xpresia ahora muestra siempre un botón **“INSTALAR XPRESIA EN TU DISPOSITIVO · RECOMENDADO”**.

- Si el navegador entrega el evento de instalación PWA, el botón abre directamente el diálogo nativo de instalación.
- En iPhone/iPad muestra los pasos de Safari para **Compartir → Agregar a pantalla de inicio**.
- Si el navegador todavía no habilita la instalación automática, muestra instrucciones en lugar de fallar silenciosamente.

La página web no puede forzar una instalación cuando el navegador no la autoriza; en ese caso se utiliza la opción del propio navegador.
