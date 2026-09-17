/**
 * Xpresia — Biblioteca Karaoke desde una carpeta de Google Drive
 *
 * Carpeta configurada:
 * 1aU7Zsf3p0VFGoFr2tM09h_ZShni9IkL2
 *
 * Este script se publica como Aplicación web y Xpresia consulta este endpoint.
 * La aplicación web se ejecuta como el propietario del script, por lo que
 * puede leer la carpeta aunque no sea necesario exponer credenciales en Xpresia.
 */

const FOLDER_ID = '1aU7Zsf3p0VFGoFr2tM09h_ZShni9IkL2';

function doGet(e) {
  const callback = e && e.parameter ? String(e.parameter.callback || '').trim() : '';
  try {
    const songs = listKaraokeFiles_();
    const payload = JSON.stringify({ ok: true, folderId: FOLDER_ID, songs: songs });
    return output_(payload, callback);
  } catch (err) {
    const payload = JSON.stringify({ ok: false, error: String(err && err.message || err), songs: [] });
    return output_(payload, callback);
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

function listKaraokeFiles_() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();
  const songs = [];

  while (files.hasNext()) {
    const file = files.next();
    const mime = String(file.getMimeType() || '');
    const name = String(file.getName() || '');

    // Solo vídeos. Si prefieres aceptar cualquier archivo de Drive,
    // elimina esta condición.
    if (!mime.startsWith('video/')) continue;

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
  const folder = DriveApp.getFolderById(FOLDER_ID);
  Logger.log('Carpeta: ' + folder.getName());
  const songs = listKaraokeFiles_();
  Logger.log('Vídeos encontrados: ' + songs.length);
  songs.forEach(function(song) { Logger.log(song.name + ' → ' + song.id); });
}
