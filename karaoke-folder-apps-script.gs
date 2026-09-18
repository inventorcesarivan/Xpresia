/**
 * Xpresia — Biblioteca Karaoke desde una carpeta de Google Drive
 *
 * Carpeta predeterminada:
 * 1aU7Zsf3p0VFGoFr2tM09h_ZShni9IkL2
 *
 * Xpresia puede enviar otro folderId. El script intentará leerlo con
 * los permisos de la cuenta que ejecuta la aplicación web.
 *
 * Este script se publica como Aplicación web y Xpresia consulta este endpoint.
 * La aplicación web se ejecuta como el propietario del script, por lo que
 * puede leer la carpeta aunque no sea necesario exponer credenciales en Xpresia.
 */

const DEFAULT_FOLDER_ID = '1aU7Zsf3p0VFGoFr2tM09h_ZShni9IkL2';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const mode = String(params.mode || '').trim().toLowerCase();

  // Puente HTML para navegadores móviles/WebViews. La página de Apps Script
  // obtiene los datos con google.script.run (sin CORS/JSONP) y los envía al
  // Xpresia padre mediante postMessage.
  if (mode === 'bridge') {
    const folderId = String(params.folderId || DEFAULT_FOLDER_ID).trim();
    const safeFolderId = JSON.stringify(folderId);
    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script>
      const folderId = ${safeFolderId};
      function send(ok, songs, error, returnedFolderId, folderName){
        try { parent.postMessage({type:'xpresia-karaoke-bridge', ok:!!ok, songs:Array.isArray(songs)?songs:[], error:error||'', folderId:String(returnedFolderId||''), folderName:String(folderName||'')}, '*'); } catch(e) {}
      }
      google.script.run
        .withSuccessHandler(function(result){ send(!!result.ok, result.songs || [], result.error || '', result.folderId || '', result.folderName || ''); })
        .withFailureHandler(function(err){ send(false, [], String(err && err.message || err || 'Error de Apps Script'), folderId, ''); })
        .getKaraokeLibrary(folderId);
    </script></body></html>`;
    return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const callback = e && e.parameter ? String(e.parameter.callback || '').trim() : '';
  try {
    const requestedFolderId = e && e.parameter ? String(e.parameter.folderId || '').trim() : '';
    const folderId = requestedFolderId || DEFAULT_FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);
    const songs = listKaraokeFiles_(folderId);
    const payload = JSON.stringify({ ok: true, folderId: folderId, folderName: folder.getName(), songs: songs });
    return output_(payload, callback);
  } catch (err) {
    const payload = JSON.stringify({ ok: false, error: String(err && err.message || err), songs: [] });
    return output_(payload, callback);
  }
}

/** Devuelve la biblioteca para el puente HTML de navegadores móviles. */
function getKaraokeLibrary(folderId) {
  const id = String(folderId || DEFAULT_FOLDER_ID).trim();
  try {
    const folder = DriveApp.getFolderById(id);
    const songs = listKaraokeFiles_(id);
    return { ok: true, folderId: id, folderName: folder.getName(), songs: songs, error: '' };
  } catch (err) {
    return { ok: false, folderId: id, folderName: '', songs: [], error: String(err && err.message || err || 'No se pudo acceder a la carpeta') };
  }
}

function output_(json, callback) {
  // JSONP evita problemas de CORS en navegadores cuando Xpresia está publicada
  // en Netlify y el Apps Script está en el dominio de Google.
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function listKaraokeFiles_(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const songs = [];

  while (files.hasNext()) {
    const file = files.next();
    const mime = String(file.getMimeType() || '');
    const name = String(file.getName() || '');

    // Aceptar vídeos aunque Drive entregue un MIME inesperado.
    // Esto cubre MP4/MOV/WebM/M4V/MKV/AVI y otros archivos de vídeo comunes.
    const ext = (name.match(/\.([a-z0-9]+)$/i) || [,''])[1].toLowerCase();
    const videoExts = ['mp4','mov','webm','m4v','mkv','avi','mpeg','mpg','3gp','ogv'];
    if (!mime.startsWith('video/') && videoExts.indexOf(ext) === -1) continue;

    const title = name.replace(/\.[^.]+$/, '').trim() || 'Karaoke sin título';
    const artistParts = title.split(/\s+-\s+/);
    const artist = artistParts.length > 1 ? artistParts.slice(1).join(' - ').trim() : '';

    songs.push({
      id: file.getId(),
      name: name,
      title: artistParts[0].trim() || title,
      artist: artist,
      mimeType: mime,
      url: 'https://drive.google.com/file/d/' + encodeURIComponent(file.getId()) + '/view',
      driveUrl: 'https://drive.google.com/file/d/' + encodeURIComponent(file.getId()) + '/view',
      previewUrl: 'https://drive.google.com/file/d/' + encodeURIComponent(file.getId()) + '/preview?autoplay=1',
      updated: file.getLastUpdated().toISOString()
    });
  }

  songs.sort(function(a, b) {
    return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
  });
  return songs;
}

/**
 * Ejecuta esta función una vez desde el editor para comprobar permisos y acceso.
 */
function testFolderAccess() {
  const folder = DriveApp.getFolderById(DEFAULT_FOLDER_ID);
  Logger.log('Carpeta: ' + folder.getName());
  const songs = listKaraokeFiles_(DEFAULT_FOLDER_ID);
  Logger.log('Vídeos encontrados: ' + songs.length);
  songs.forEach(function(song) { Logger.log(song.name + ' → ' + song.id); });
}


/** Prueba una carpeta concreta. Pega su ID al ejecutar esta función. */
function testSpecificFolder() {
  const folderId = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA';
  const folder = DriveApp.getFolderById(folderId);
  Logger.log('Cuenta ejecutora: ' + Session.getEffectiveUser().getEmail());
  Logger.log('Carpeta: ' + folder.getName() + ' → ' + folder.getId());
  const songs = listKaraokeFiles_(folderId);
  Logger.log('Vídeos encontrados: ' + songs.length);
  songs.forEach(function(song) { Logger.log(song.name + ' → ' + song.id); });
}
