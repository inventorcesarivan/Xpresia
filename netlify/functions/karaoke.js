// Xpresia — puente same-origin para la biblioteca de Karaoke.
// Netlify consulta Apps Script desde el servidor y devuelve JSON a Xpresia.
// Esto evita CORS/JSONP en navegadores móviles.

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwCLUEeIhVcna-iYUADBjfn9Tf1C9lxvkmCU40EbVO_CiOikETJUT-b-U82HBgn9XeOA/exec';
const DEFAULT_FOLDER_ID = '1aU7Zsf3p0VFGoFr2tM09h_ZShni9IkL2';

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ok:false,error:'Método no permitido',songs:[]}) };
  }

  try {
    const folderId = String((event.queryStringParameters || {}).folderId || DEFAULT_FOLDER_ID).trim();
    if (!folderId) throw new Error('No hay carpeta configurada');

    const url = APPS_SCRIPT_URL + '?folderId=' + encodeURIComponent(folderId) + '&_=' + Date.now();
    const response = await fetch(url, { redirect: 'follow' });
    const text = await response.text();
    if (!response.ok) throw new Error('Apps Script respondió HTTP ' + response.status);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Apps Script no devolvió JSON válido');
    }

    if (!data || !data.ok || !Array.isArray(data.songs)) {
      throw new Error(data && data.error ? String(data.error) : 'Apps Script no devolvió una biblioteca válida');
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ok:false,error:String(err && err.message || err),songs:[]})
    };
  }
};
