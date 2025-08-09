// ==UserScript==
// @name         Trailforks GPX Auto Export
// @namespace    https://example.local/
// @version      1.0
// @description  Si la URL contiene ?tf_gpx_auto=1, extrae encodedpath y descarga GPX automáticamente.
// @match        https://www.trailforks.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  // Decode encoded polyline (Google / Mapbox algorithm) - ES5
  function decodePolyline(encoded) {
    var index = 0, lat = 0, lng = 0, coordinates = [], length = encoded.length;
    while (index < length) {
      var shift = 0, result = 0, byte = null;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      var deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += deltaLat;

      shift = 0; result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      var deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += deltaLng;

      coordinates.push([lat / 1e5, lng / 1e5]);
    }
    return coordinates;
  }

  function downloadFile(filename, text) {
    var a = document.createElement('a');
    a.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(text));
    a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function extractEncodedPathFromHtml(html) {
    var m = html.match(/encodedpath:\s?'(.*?)'/);
    if (!m || !m[1]) return null;
    try { return m[1].replace(/\\\\/g, '\\'); } catch (e) { return m[1]; }
  }

  function buildGpx(title, shortTitle, pageUrl, waypoints) {
    var trk = '';
    for (var i = 0; i < waypoints.length; i++) {
      var c = waypoints[i];
      trk += '\n\t\t\t<trkpt lat=\"' + c[0] + '\" lon=\"' + c[1] + '\"/>';
    }
    var head = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\\n' +
               '<gpx xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ' +
               'xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" ' +
               'version=\"1.1\" xmlns=\"http://www.topografix.com/GPX/1/1\" creator=\"tf-gpx-auto\">';
    var meta = '\\n\\t<metadata>\\n\\t\\t<link href=\"' + pageUrl + '\">\\n\\t\\t\\t<text>' + title + '</text>\\n\\t\\t</link>\\n\\t</metadata>\\n\\t<trk>\\n\\t\\t<name>' + shortTitle + '</name>\\n\\t\\t<trkseg>';
    var foot = '\\n\\t\\t</trkseg>\\n\\t</trk>\\n</gpx>';
    return head + meta + trk + foot;
  }

  function tryExport() {
    try {
      var html = document.getElementsByTagName('html')[0].innerHTML;
    } catch (e) {
      console.log('tf-gpx: no html yet', e);
      return false;
    }

    var enc = extractEncodedPathFromHtml(html);
    if (!enc) {
      if (window.location.pathname.indexOf('map/') === -1) {
        if (confirm('No se encontró el mapa en esta página. ¿Ir a la versión /map/ y volver a exportar automáticamente?')) {
          window.location.href = window.location.href.replace(/\/?$/, '').replace(/\/map\/?$/,'') + 'map/';
          return true;
        }
      }
      return false;
    }

    var pageTitle = document.title || '';
    var shortTitle = (pageTitle.split('|')[0] || '').trim();
    var pageUrl = 'https://' + window.location.hostname + window.location.pathname;
    var filenameBase = (window.location.pathname.split('/')[2] || 'trail') + '.gpx';

    var waypoints;
    try {
      waypoints = decodePolyline(enc);
    } catch (e) {
      alert('Error decodificando polyline: ' + e);
      return false;
    }
    if (!waypoints || !waypoints.length) {
      alert('No se pudieron obtener waypoints de la ruta.');
      return false;
    }

    var gpx = buildGpx(pageTitle, shortTitle, pageUrl, waypoints);
    downloadFile(filenameBase, gpx);
    return true;
  }

  if (window.location.search && window.location.search.indexOf('tf_gpx_auto=1') !== -1) {
    var attempts = 0;
    var maxAttempts = 8;
    var delay = 600;
    var ran = false;
    function attemptLoop() {
      attempts++;
      try {
        var ok = tryExport();
        if (ok) { ran = true; return; }
      } catch (e) {
        console.log('tf-gpx attempt error', e);
      }
      if (!ran && attempts < maxAttempts) {
        setTimeout(attemptLoop, delay);
        delay = Math.min(3000, delay + 600);
      } else if (!ran) {
        alert('No se pudo exportar automáticamente. Por favor ejecuta el bookmarklet manualmente o abre la consola y pega el script.');
      }
    }
    setTimeout(attemptLoop, 600);
  }

})();