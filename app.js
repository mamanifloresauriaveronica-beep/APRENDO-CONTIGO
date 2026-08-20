// ==============================================
// PLATAFORMA DE EXÁMENES - LECTURA DE TODOS LOS FORMATOS
// ==============================================

var textoDocumento = "";
var preguntas = [];
var preguntaActual = 0;
var aciertos = 0;

// Elementos HTML
var inputArchivo = document.getElementById('archivo');
var btnCargar = document.getElementById('btnCargar');
var btnGenerar = document.getElementById('btnGenerar');
var areaTexto = document.getElementById('areaTexto');
var seccionPreguntas = document.getElementById('seccionPreguntas');
var seccionDiagnostico = document.getElementById('seccionDiagnostico');
var contenedorPregunta = document.getElementById('contenedorPregunta');
var btnSiguiente = document.getElementById('btnSiguiente');

// ==============================================
// 1. CARGAR Y LEER CUALQUIER ARCHIVO
// ==============================================
btnCargar.addEventListener('click', function() {
  var archivo = inputArchivo.files[0];
  if (!archivo) {
    alert('⚠️ Selecciona un archivo primero');
    return;
  }

  var nombre = archivo.name.toLowerCase();
  var extension = nombre.split('.').pop();

  if (extension === 'txt') {
    leerTXT(archivo);
  } else if (extension === 'pdf') {
    leerPDF(archivo);
  } else if (extension === 'docx') {
    leerDOCX(archivo);
  } else if (extension === 'doc') {
    alert('⚠️ El formato .doc (Word antiguo) no se lee bien. Por favor, copia el texto y pégalo en el área.');
  } else {
    alert('⚠️ Formato no soportado. Sube: .txt, .pdf o .docx\nO pega el texto directamente.');
  }
});

// ---------- Leer TXT ----------
function leerTXT(archivo) {
  var lector = new FileReader();
  lector.onload = function(e) {
    textoDocumento = e.target.result;
    areaTexto.value = textoDocumento;
    alert('✅ Archivo .txt cargado correctamente');
  };
  lector.readAsText(archivo);
}

// ---------- Leer PDF ----------
async function leerPDF(archivo) {
  try {
    var lector = new FileReader();
    lector.onload = async function(e) {
      var arrayBuffer = e.target.result;
      var pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      var textoCompleto = "";

      for (var pagina = 1; pagina <= pdf.numPages; pagina++) {
        var paginaObj = await pdf.getPage(pagina);
        var texto = await paginaObj.getTextContent();
        var items = texto.items;
        var textoPagina = items.map(function(item) { return item.str; }).join(' ');
        textoCompleto += textoPagina + "\n";
      }

      textoDocumento = textoCompleto;
      areaTexto.value = textoDocumento.substring(0, 5000);
      alert('✅ PDF cargado correctamente (' + pdf.numPages + ' páginas)');
    };
    lector.readAsArrayBuffer(archivo);
  } catch (err) {
    alert('❌ No se pudo leer el PDF: ' + err.message);
  }
}

// ---------- Leer DOCX ----------
function leerDOCX(archivo) {
  var lector = new FileReader();
  lector.onload = function(e) {
    var arrayBuffer = e.target.result;
    window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
      .then(function(resultado) {
        textoDocumento = resultado.value;
        areaTexto.value = textoDocumento;
        alert('✅ Documento .docx cargado correctamente');
      })
      .catch(function(err) {
        alert('❌ No se pudo leer el archivo Word: ' + err.message);
      });
  };
  lector.readAsArrayBuffer(archivo);
}

// ==============================================
// 2. GENERAR PREGUNTAS
// ==============================================
btnGenerar.addEventListener('click', function() {
  var texto = areaTexto.value.trim();
  if (!texto && textoDocumento) {
    texto = textoDocumento;
  }
  if (!texto) {
    alert('⚠️ Escribe contenido, pega el texto o sube un archivo');
    return;
  }

  preguntas = generarPreguntas(texto);
  if (preguntas.length === 0) {
    alert('❌ No se pudieron generar preguntas. Intenta con texto más extenso.');
    return;
  }

  seccionPreguntas.style.display = 'block';
  seccionDiagnostico.style.display = 'none';
  preguntaActual = 0;
  aciertos = 0;
  mostrarPregunta();
  alert('✅ ' + preguntas.length + ' preguntas generadas');
});

// ==============================================
// 3. CREAR PREGUNTAS DESDE EL TEXTO
// ==============================================
function generarPreguntas(texto) {
  var lista = [];
  var oraciones = texto.split(/[.!?]/);
  var oracionesValidas = [];

  for (var i = 0; i < oraciones.length; i++) {
    var frase = oraciones[i].trim();
    if (frase.length > 20) {
      oracionesValidas.push(frase);
    }
  }

  var cantidad = Math.min(5, oracionesValidas.length);
  for (var j = 0; j < cantidad; j++) {
    var oracion = oracionesValidas[j];
    lista.push({
      pregunta: 'Pregunta ' + (j + 1) + ': ¿Cuál es la afirmación correcta?',
      opciones: [
        oracion.substring(0, 80) + '...',
        'Opción incorrecta A',
        'Opción incorrecta B',
        'Opción incorrecta C'
      ],
      correcta: 0
    });
  }
  return lista;
}

// ==============================================
// 4. MOSTRAR PREGUNTA
// ==============================================
function mostrarPregunta() {
  var p = preguntas[preguntaActual];
  contenedorPregunta.innerHTML =
    '<h3>' + p.pregunta + '</h3>' +
    '<div class="opciones">' +
      '<label class="opcion"><input type="radio" name="resp" value="0"> 1. ' + p.opciones[0] + '</label>' +
      '<label class="opcion"><input type="radio" name="resp" value="1"> 2. ' + p.opciones[1] + '</label>' +
      '<label class="opcion"><input type="radio" name="resp" value="2"> 3. ' + p.opciones[2] + '</label>' +
      '<label class="opcion"><input type="radio" name="resp" value="3"> 4. ' + p.opciones[3] + '</label>' +
    '</div>';
}

// ==============================================
// 5. SIGUIENTE / DIAGNÓSTICO
// ==============================================
btnSiguiente.addEventListener('click', function() {
  var seleccion = document.querySelector('input[name="resp"]:checked');
  if (!seleccion) {
    alert('⚠️ Selecciona una respuesta');
    return;
  }

  if (parseInt(seleccion.value) === preguntas[preguntaActual].correcta) {
    aciertos++;
  }

  preguntaActual++;
  if (preguntaActual < preguntas.length) {
    mostrarPregunta();
  } else {
    mostrarDiagnostico();
  }
});

// ==============================================
// 6. DIAGNÓSTICO FINAL
// ==============================================
function mostrarDiagnostico() {
  seccionPreguntas.style.display = 'none';
  seccionDiagnostico.style.display = 'block';
  var total = preguntas.length;
  var porcentaje = Math.round((aciertos / total) * 100);
  var mensaje = porcentaje >= 80 ? '🎉 ¡Excelente!' : porcentaje >= 60 ? '📖 Buen trabajo, repasa algunos temas.' : '⚠️ Necesitas reforzar más el contenido.';

  seccionDiagnostico.innerHTML =
    '<h2>📋 Diagnóstico del Examen</h2>' +
    '<p><strong>Total de preguntas:</strong> ' + total + '</p>' +
    '<p style="color:#10B981;"><strong>✅ Aciertos:</strong> ' + aciertos + '</p>' +
    '<p style="color:#EF4444;"><strong>❌ Errores:</strong> ' + (total - aciertos) + '</p>' +
    '<p><strong>Porcentaje obtenido:</strong> ' + porcentaje + '%</p>' +
    '<div style="margin-top:15px; padding:15px; background:#f3f4f6; border-radius:8px;">' +
      '<strong>💡 Recomendación:</strong><br>' + mensaje +
    '</div>' +
    '<button onclick="location.reload()" style="margin-top:20px; padding:12px 24px; background:#D81E05; color:white; border:none; border-radius:8px; font-size:16px; cursor:pointer;">🔄 Nuevo Examen</button>';
}