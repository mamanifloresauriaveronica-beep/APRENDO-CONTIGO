var textoDocumento = "";
var preguntas = [];
var preguntaActual = 0;
var aciertos = 0;

var inputArchivo = document.getElementById('archivo');
var btnCargar = document.getElementById('btnCargar');
var btnGenerar = document.getElementById('btnGenerar');
var areaTexto = document.getElementById('areaTexto');
var seccionPreguntas = document.getElementById('seccionPreguntas');
var seccionDiagnostico = document.getElementById('seccionDiagnostico');
var contenedorPregunta = document.getElementById('contenedorPregunta');
var btnSiguiente = document.getElementById('btnSiguiente');
var mensaje = document.getElementById('mensaje');

// Mostrar mensaje SIN bloquear la pantalla
function mostrarMensaje(texto, tipo = 'info') {
  if (!mensaje) return;
  mensaje.style.display = 'block';
  mensaje.textContent = texto;
  if (tipo === 'exito') {
    mensaje.style.background = '#D4F1E4';
    mensaje.style.color = '#2F7558';
  } else if (tipo === 'error') {
    mensaje.style.background = '#FFE2E0';
    mensaje.style.color = '#B05550';
  } else {
    mensaje.style.background = '#FFEDE0';
    mensaje.style.color = '#A06040';
  }
  clearTimeout(window.tiempoMensaje);
  window.tiempoMensaje = setTimeout(function() {
    mensaje.style.display = 'none';
  }, 5000);
}

// ==============================================
// CARGAR Y LEER PDF, DOCX Y TXT
// ==============================================
btnCargar.addEventListener('click', async function() {
  var archivo = inputArchivo.files[0];
  if (!archivo) {
    mostrarMensaje('⚠️ Selecciona un archivo primero', 'error');
    return;
  }

  var nombre = archivo.name.toLowerCase();
  var extension = nombre.split('.').pop();

  if (extension === 'txt') {
    leerTXT(archivo);
  } else if (extension === 'pdf') {
    await leerPDF(archivo);
  } else if (extension === 'docx') {
    leerDOCX(archivo);
  } else if (extension === 'doc') {
    mostrarMensaje('⚠️ El formato .doc no se lee bien. Convierte a .docx o pega el texto.', 'info');
  } else {
    mostrarMensaje('⚠️ Formato no soportado. Usa: .txt, .pdf o .docx', 'error');
  }
});

// Leer TXT
function leerTXT(archivo) {
  var lector = new FileReader();
  lector.onload = function(e) {
    textoDocumento = e.target.result;
    areaTexto.value = textoDocumento;
    mostrarMensaje('✅ Archivo .txt cargado correctamente', 'exito');
  };
  lector.readAsText(archivo);
}

// Leer PDF
async function leerPDF(archivo) {
  try {
    mostrarMensaje('⏳ Leyendo PDF... espera un momento', 'info');
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
        textoCompleto += textoPagina + " ";
      }

      textoDocumento = textoCompleto;
      areaTexto.value = textoCompleto.substring(0, 8000);
      mostrarMensaje('✅ PDF cargado: ' + pdf.numPages + ' páginas leídas', 'exito');
    };
    lector.readAsArrayBuffer(archivo);
  } catch (err) {
    mostrarMensaje('❌ No se pudo leer el PDF: ' + err.message, 'error');
  }
}

// Leer DOCX
function leerDOCX(archivo) {
  mostrarMensaje('⏳ Leyendo documento Word...', 'info');
  var lector = new FileReader();
  lector.onload = function(e) {
    var arrayBuffer = e.target.result;
    window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
      .then(function(resultado) {
        textoDocumento = resultado.value;
        areaTexto.value = textoDocumento;
        mostrarMensaje('✅ Documento .docx cargado correctamente', 'exito');
      })
      .catch(function(err) {
        mostrarMensaje('❌ No se pudo leer el Word: ' + err.message, 'error');
      });
  };
  lector.readAsArrayBuffer(archivo);
}

// ==============================================
// GENERAR PREGUNTAS
// ==============================================
btnGenerar.addEventListener('click', function() {
  var texto = areaTexto.value.trim();
  if (!texto && textoDocumento) {
    texto = textoDocumento;
  }
  if (!texto) {
    mostrarMensaje('⚠️ Sube un archivo o pega el contenido primero', 'error');
    return;
  }

  preguntas = generarPreguntasMejoradas(texto);
  
  if (preguntas.length === 0) {
    mostrarMensaje('❌ No se pudieron generar preguntas. Usa texto más extenso.', 'error');
    return;
  }

  seccionPreguntas.style.display = 'block';
  seccionDiagnostico.style.display = 'none';
  preguntaActual = 0;
  aciertos = 0;
  mostrarPregunta();
  mostrarMensaje('✅ ' + preguntas.length + ' preguntas generadas', 'exito');
  seccionPreguntas.scrollIntoView({ behavior: 'smooth' });
});

// Crear preguntas con sentido
function generarPreguntasMejoradas(texto) {
  var lista = [];
  var oraciones = texto.split(/[.!?]/);
  var frasesUtiles = [];

  for (var i = 0; i < oraciones.length; i++) {
    var frase = oraciones[i].trim();
    if (frase.length > 30 && frase.length < 250) {
      frasesUtiles.push(frase);
    }
  }

  var tiposPregunta = [
    '¿Cuál es la idea principal del fragmento?',
    'Según el texto, ¿qué afirmación es correcta?',
    '¿Qué explica o describe el fragmento leído?',
    'De acuerdo con la lectura, ¿cuál afirmación es verdadera?',
    '¿Qué información nos brinda el texto?'
  ];

  var cantidad = Math.min(5, frasesUtiles.length);
  for (var j = 0; j < cantidad; j++) {
    var frase = frasesUtiles[j];
    var tipoAleatorio = tiposPregunta[j % tiposPregunta.length];
    
    lista.push({
      pregunta: tipoAleatorio,
      opciones: [
        frase.substring(0, 90) + (frase.length > 90 ? '...' : ''),
        'Afirmación que contradice el texto',
        'Información que no se menciona en la lectura',
        'Interpretación errónea del contenido'
      ],
      correcta: 0
    });
  }
  return lista;
}

// Mostrar pregunta
function mostrarPregunta() {
  var p = preguntas[preguntaActual];
  contenedorPregunta.innerHTML = 
    '<h3>Pregunta ' + (preguntaActual + 1) + '</h3>' +
    '<p style="font-size:17px; margin-bottom:20px;">' + p.pregunta + '</p>' +
    '<label class="opcion"><input type="radio" name="resp" value="0"> 1. ' + p.opciones[0] + '</label>' +
    '<label class="opcion"><input type="radio" name="resp" value="1"> 2. ' + p.opciones[1] + '</label>' +
    '<label class="opcion"><input type="radio" name="resp" value="2"> 3. ' + p.opciones[2] + '</label>' +
    '<label class="opcion"><input type="radio" name="resp" value="3"> 4. ' + p.opciones[3] + '</label>';
}

// Siguiente y Diagnóstico
btnSiguiente.addEventListener('click', function() {
  var sel = document.querySelector('input[name="resp"]:checked');
  if (!sel) {
    mostrarMensaje('⚠️ Selecciona una respuesta', 'error');
    return;
  }
  
  if (parseInt(sel.value) === preguntas[preguntaActual].correcta) {
    aciertos++;
  }
  
  preguntaActual++;
  if (preguntaActual < preguntas.length) {
    mostrarPregunta();
  } else {
    seccionPreguntas.style.display = 'none';
    seccionDiagnostico.style.display = 'block';
    var total = preguntas.length;
    var porc = Math.round((aciertos / total) * 100);
    var mensajeFinal = porc >= 80 ? '🎉 ¡Excelente! Dominas muy bien el tema.' : 
                       porc >= 60 ? '📖 Buen trabajo, repasa algunos puntos clave.' : 
                       '⚠️ Necesitas leer con más atención y reforzar el contenido.';

    seccionDiagnostico.innerHTML = 
      '<h2>📋 Diagnóstico Final</h2>' +
      '<p><strong>Total de preguntas:</strong> ' + total + '</p>' +
      '<p style="color:#50A080; font-size:18px;"><strong>✅ Aciertos:</strong> ' + aciertos + '</p>' +
      '<p style="color:#D08078; font-size:18px;"><strong>❌ Errores:</strong> ' + (total - aciertos) + '</p>' +
      '<p style="font-size:20px; font-weight:bold; margin-top:15px; color:#A06040;">Porcentaje: ' + porc + '%</p>' +
      '<div style="margin-top:20px; padding:15px; background:#FFEDE0; border-radius:12px;">' +
        '<strong>💡 Recomendación:</strong><br>' + mensajeFinal +
      '</div>' +
      '<button onclick="location.reload()" style="margin-top:25px; padding:14px 28px; background:#E8A87C; color:#A05F3E; border:none; border-radius:12px; font-size:17px; font-weight:bold; cursor:pointer;">🔄 Realizar Nuevo Examen</button>';
    seccionDiagnostico.scrollIntoView({ behavior: 'smooth' });
  }
});