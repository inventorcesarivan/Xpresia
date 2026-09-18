/**
 * Xpresia — Biblioteca oficial combinada + biblioteca personal
 *
 * La biblioteca OFICIAL se configura aquí y sus IDs NO se envían al navegador.
 * Agrega todas las carpetas oficiales a OFFICIAL_FOLDER_IDS.
 *
 * Ejecutar como: propietario del script.
 * Quién tiene acceso: Cualquiera.
 */

const OFFICIAL_FOLDER_IDS = [
  '1aU7Zsf3p0VFGoFr2tM09h_ZShni9IkL2',
  // 'PEGA_AQUI_EL_ID_DE_LA_SEGUNDA_CARPETA_OFICIAL',
  // 'PEGA_AQUI_EL_ID_DE_LA_TERCERA_CARPETA_OFICIAL'
];

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const mode = String(params.mode || 'official').trim().toLowerCase();
  const callback = String(params.callback || '').trim();

  try {
    if (mode === 'official') {
      return output_(JSON.stringify(readOfficialLibrary_()), callback);
    }

    if (mode === 'custom') {
      const folderId = String(params.folderId || '').trim();
      return output_(JSON.stringify(readCustomFolder_(folderId)), callback);
    }

    // Compatibilidad con versiones anteriores que enviaban directamente folderId.
    if (params.folderId) {
      return output_(JSON.stringify(readCustomFolder_(String(params.folderId).trim())), callback);
    }

    return output_(JSON.stringify(readOfficialLibrary_()), callback);
  } catch (err) {
    const message = String(err && err.message || err || 'Error desconocido');
    return output_(JSON.stringify({
      ok: false,
      libraryType: mode === 'custom' ? 'custom' : 'official',
      songs: [],
      count: 0,
      error: message,
      errorType: 'DRIVE_ACCESS_ERROR'
    }), callback);
  }
}

function readOfficialLibrary_() {
  const ids = OFFICIAL_FOLDER_IDS.filter(function(id) {
    const value = String(id || '').trim();
    return value && value.indexOf('PEGA_AQUI_') !== 0;
  });

  if (!ids.length) throw new Error('No hay carpetas oficiales configuradas.');

  const songs = [];
  const folders = [];
  const seen = {};
  const errors = [];

  ids.forEach(function(id) {
    try {
      const folder = DriveApp.getFolderById(id);
      folders.push({ id: id, name: folder.getName(), count: 0 });
      const items = listKaraokeFiles_(folder);
      items.forEach(function(song) {
        if (seen[song.id]) return;
        seen[song.id] = true;
        song.libraryType = 'official';
        song.libraryFolderName = folder.getName();
        songs.push(song);
        folders[folders.length - 1].count++;
      });
    } catch (err) {
      errors.push('No se pudo leer la carpeta oficial ' + id + ': ' + String(err && err.message || err));
    }
  });

  if (!songs.length && errors.length) {
    throw new Error(errors.join(' | '));
  }

  songs.sort(sortSongs_);
  return {
    ok: true,
    libraryType: 'official',
    folderCount: folders.length,
    folders: folders.map(function(f) { return { name: f.name, count: f.count }; }),
    songs: songs,
    count: songs.length,
    warnings: errors
  };
}

function readCustomFolder_(folderId) {
  const id = String(folderId || '').trim();
  if (!id) throw new Error('No se recibió el ID de la carpeta personal.');

  const folder = DriveApp.getFolderById(id);
  const songs = listKaraokeFiles_(folder);
  songs.forEach(function(song) {
    song.libraryType = 'custom';
    song.libraryFolderName = folder.getName();
  });
  songs.sort(sortSongs_);

  return {
    ok: true,
    libraryType: 'custom',
    folderId: id,
    folderName: folder.getName(),
    songs: songs,
    count: songs.length,
    warnings: []
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
  return songs;
}

function sortSongs_(a, b) {
  return String(a.title || '').localeCompare(String(b.title || ''), 'es', {sensitivity:'base'}) ||
         String(a.artist || '').localeCompare(String(b.artist || ''), 'es', {sensitivity:'base'});
}

function output_(json, callback) {
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function testOfficialLibraries() {
  const result = readOfficialLibrary_();
  Logger.log('Biblioteca oficial combinada: ' + result.count + ' vídeos en ' + result.folderCount + ' carpetas.');
  result.folders.forEach(function(folder) { Logger.log(folder.name + ' → ' + folder.count + ' vídeos'); });
  if (result.warnings && result.warnings.length) Logger.log('Advertencias: ' + result.warnings.join(' | '));
}

function testSpecificFolder() {
  throw new Error('Usa readCustomFolder_ con un ID real desde una función de prueba si necesitas diagnosticar una carpeta personal.');
}
