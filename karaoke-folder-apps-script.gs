/**
 * Xpresia v20 — Biblioteca Karaoke desde Google Drive
 *
 * IMPORTANTE:
 * - Ejecutar como: propietario de este script.
 * - Quién tiene acceso: Cualquiera.
 * - La carpeta solicitada debe estar compartida con ESA MISMA cuenta.
 * - Xpresia envía folderId; el script nunca sustituye una carpeta por la predeterminada.
 */

const DEFAULT_FOLDER_ID = '1aU7Zsf3p0VFGoFr2tM09h_ZShni9IkL2';
// Para una prueba manual desde Apps Script, pega aquí el ID de la carpeta externa.
const TEST_FOLDER_ID = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_EXTERNA';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const requested = String(params.folderId || '').trim();
  const folderId = requested || DEFAULT_FOLDER_ID;
  const callback = String(params.callback || '').trim();

  try {
    const result = readFolder_(folderId);
    return output_(JSON.stringify(result), callback);
  } catch (err) {
    const message = String(err && err.message || err || 'Error desconocido');
    const payload = {
      ok: false,
      folderId: folderId,
      folderName: '',
      songs: [],
      error: message,
      errorType: 'DRIVE_ACCESS_ERROR'
    };
    return output_(JSON.stringify(payload), callback);
  }
}

function readFolder_(folderId) {
  const id = String(folderId || '').trim();
  if (!id) throw new Error('No se recibió folderId.');

  const folder = DriveApp.getFolderById(id);
  const songs = listKaraokeFiles_(folder);

  return {
    ok: true,
    folderId: id,
    folderName: folder.getName(),
    songs: songs,
    count: songs.length,
    error: ''
  };
}

function listKaraokeFiles_(folder) {
  const files = folder.getFiles();
  const songs = [];
  const videoExts = ['mp4','mov','webm','m4v','mkv','avi','mpeg','mpg','3gp','ogv'];

  while (files.hasNext()) {
    const file = files.next();
    const mime = String(file.getMimeType() || '');
    const name = String(file.getName() || '');
    const match = name.match(/\.([a-z0-9]+)$/i);
    const ext = match ? match[1].toLowerCase() : '';
    if (!mime.startsWith('video/') && videoExts.indexOf(ext) === -1) continue;

    const title = name.replace(/\.[^.]+$/, '').trim() || 'Karaoke sin título';
    const parts = title.split(/\s+-\s+/);
    const artist = parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';

    songs.push({
      id: file.getId(),
      name: name,
      title: parts[0].trim() || title,
      artist: artist,
      mimeType: mime,
      url: 'https://drive.google.com/file/d/' + encodeURIComponent(file.getId()) + '/view',
      driveUrl: 'https://drive.google.com/file/d/' + encodeURIComponent(file.getId()) + '/view',
      previewUrl: 'https://drive.google.com/file/d/' + encodeURIComponent(file.getId()) + '/preview?autoplay=1',
      updated: file.getLastUpdated().toISOString()
    });
  }

  songs.sort(function(a,b) {
    return a.title.localeCompare(b.title, 'es', {sensitivity:'base'});
  });
  return songs;
}

function output_(json, callback) {
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * PRUEBA 1: carpeta principal.
 */
function testFolderAccess() {
  const result = readFolder_(DEFAULT_FOLDER_ID);
  Logger.log('Carpeta: ' + result.folderName);
  Logger.log('Vídeos encontrados: ' + result.count);
}

/**
 * PRUEBA 2: carpeta externa compartida con la cuenta ejecutora.
 * Antes de ejecutar, reemplaza TEST_FOLDER_ID por el ID real.
 */
function testSpecificFolder() {
  if (!TEST_FOLDER_ID || TEST_FOLDER_ID.indexOf('PEGA_AQUI') === 0) {
    throw new Error('Primero reemplaza TEST_FOLDER_ID por el ID real de la carpeta externa.');
  }
  const result = readFolder_(TEST_FOLDER_ID);
  Logger.log('Carpeta externa: ' + result.folderName);
  Logger.log('ID: ' + result.folderId);
  Logger.log('Vídeos encontrados: ' + result.count);
}
