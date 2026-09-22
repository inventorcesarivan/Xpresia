/**
 * Xpresia — Biblioteca Karaoke desde una carpeta de Google Drive
 *
 * Carpeta predeterminada:
 * 1bCMFbQS5FFu9Ot65MCbNDgmY2z27WpUm
 *
 * Xpresia puede enviar otro folderId. El script intentará leerlo con
 * los permisos de la cuenta que ejecuta la aplicación web.
 *
 * Este script se publica como Aplicación web y Xpresia consulta este endpoint.
 * La aplicación web se ejecuta como el propietario del script, por lo que
 * puede leer la carpeta aunque no sea necesario exponer credenciales en Xpresia.
 */

const DEFAULT_FOLDER_ID = '1bCMFbQS5FFu9Ot65MCbNDgmY2z27WpUm';

function doPost(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = String(params.action || '').trim().toLowerCase();

    if (action === 'feedback-submit') {
      const rating = Number(params.rating || 0);
      const comment = String(params.comment || '').trim();
      return output_(JSON.stringify(submitFeedback_(rating, comment)), '');
    }

    return output_(JSON.stringify({ ok: false, error: 'Acción POST no válida.' }), '');
  } catch (err) {
    return output_(JSON.stringify({ ok: false, error: String(err && err.message || err) }), '');
  }
}

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
  if (mode === 'feedback') {
    try {
      const result = handleFeedback_(e.parameter || {});
      return output_(JSON.stringify(result), callback);
    } catch (err) {
      return output_(JSON.stringify({ok:false,error:String(err && err.message || err)}), callback);
    }
  }
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

// ============================================================
// Xpresia - Valoraciones públicas
// Guarda valoraciones anónimas en una hoja de Google Sheets y
// devuelve el promedio + las últimas 50 opiniones.
// ============================================================
const XPRESIA_FEEDBACK_SHEET_ID = ''; // Opcional: pega aquí el ID de una hoja existente.
const XPRESIA_FEEDBACK_SHEET_NAME = 'Valoraciones Xpresia';

function getFeedbackSheet_() {
  let ss;
  if (XPRESIA_FEEDBACK_SHEET_ID) {
    ss = SpreadsheetApp.openById(XPRESIA_FEEDBACK_SHEET_ID);
  } else {
    const props = PropertiesService.getScriptProperties();
    let id = props.getProperty('XPRESIA_FEEDBACK_SHEET_ID');
    if (id) {
      try { ss = SpreadsheetApp.openById(id); } catch (e) { id = ''; }
    }
    if (!ss) {
      ss = SpreadsheetApp.create('Xpresia - Valoraciones');
      props.setProperty('XPRESIA_FEEDBACK_SHEET_ID', ss.getId());
    }
  }
  let sh = ss.getSheetByName(XPRESIA_FEEDBACK_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(XPRESIA_FEEDBACK_SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Fecha', 'Puntuación', 'Comentario']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function feedbackPayload_() {
  const sh = getFeedbackSheet_();
  const last = sh.getLastRow();
  if (last < 2) return { ok:true, total:0, average:0, comments:[] };
  const values = sh.getRange(2,1,last-1,3).getValues();
  const rows = values.filter(r => Number(r[1]) >= 1 && Number(r[1]) <= 5);
  const total = rows.length;
  const sum = rows.reduce((a,r)=>a+Number(r[1]),0);
  const comments = rows.slice(-50).reverse().map(r => ({ date:r[0] instanceof Date ? r[0].toISOString() : String(r[0]||''), rating:Number(r[1]), comment:String(r[2]||'') }));
  return { ok:true, total:total, average:total ? Math.round((sum/total)*10)/10 : 0, comments:comments };
}

function handleFeedback_(params) {
  const action = String(params.action || 'list').toLowerCase();
  if (action === 'submit') {
    const rating = Math.round(Number(params.rating));
    const comment = String(params.comment || '').trim().slice(0,500);
    if (rating < 1 || rating > 5) return {ok:false,error:'Puntuación inválida'};
    if (!comment) return {ok:false,error:'El comentario es obligatorio'};
    const sh = getFeedbackSheet_();
    sh.appendRow([new Date(), rating, comment]);
    return feedbackPayload_();
  }
  return feedbackPayload_();
}
