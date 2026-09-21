# Xpresia v66 — Epidemic Sound Connect

Esta versión integra **Epidemic Sound Connect (OAuth 2.0 + PKCE)** para que el usuario pueda autorizar Xpresia con su propia cuenta de Epidemic Sound.

## Qué hace

- Botón **Epidemic Sound** dentro de Música de fondo.
- Inicio de sesión mediante Epidemic Sound; Xpresia nunca solicita ni almacena la contraseña.
- Búsqueda de canciones por texto.
- Filtro por género.
- **Mis favoritos**, usando el endpoint oficial de favoritos del usuario conectado.
- Colecciones disponibles para la aplicación.
- Vista previa de una canción.
- Selección de una canción para usarla como música de fondo en la evaluación.
- La reproducción utiliza una URL temporal entregada por Epidemic Sound; Xpresia no guarda una copia del catálogo.
- Reporte de uso cuando el usuario descarga el video de la evaluación con una pista de Epidemic Sound.

## Configuración de Netlify

En **Site configuration → Environment variables** agrega:

`EPIDEMIC_SOUND_CLIENT_ID`

con el Client ID que te entregue Epidemic Sound Developer Portal.

No pongas el Client Secret en el HTML ni en GitHub. La integración usa PKCE y el intercambio de tokens pasa por `/.netlify/functions/epidemic-auth`.

## Redirect URI

En Epidemic Sound Developer Portal debes registrar exactamente:

`https://TU-DOMINIO-NETLIFY.netlify.app/`

Si tu sitio utiliza una ruta diferente como `/index.html`, registra exactamente esa URL que utiliza Xpresia. La aplicación calcula automáticamente `location.origin + location.pathname`.

También debes agregar el dominio de Xpresia en **Web Origins** si Epidemic Sound lo solicita.

## Importante sobre playlists personales

La documentación actual de Epidemic Sound confirma que Connect proporciona acceso a contenido personalizado, incluyendo playlists, pero la referencia pública actual del Partner Content API expone de forma documentada el endpoint de favoritos (`/v0/users/me/liked/tracks`) y no publica un endpoint de lectura de playlists personales. Por eso esta versión **no inventa una ruta de API para playlists**: muestra Favoritos y las Colecciones disponibles oficialmente.

Si el Developer Portal de tu aplicación habilita un endpoint específico para playlists personales, se puede añadir posteriormente sin cambiar el resto del sistema.

## Requisitos de Epidemic Sound

La API de Partner requiere acceso al Developer Portal y un acuerdo de partnership para producción. Connect es el método destinado a usuarios que ya tienen cuenta/suscripción de Epidemic Sound.

Consulta:
- https://developers.epidemicsound.com/docs/auth/
- https://developers.epidemicsound.com/docs/

## Seguridad

- Access/refresh tokens se mantienen en `sessionStorage` del navegador.
- Se eliminan al cerrar sesión o cuando el refresh deja de ser válido.
- El Client ID se entrega desde una función Netlify.
- No se almacena el Client Secret en el frontend.
