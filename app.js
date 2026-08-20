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

btnCargar.addEventListener('click', async function() {
  var archivo = inputArchivo.files[0];
  if (!archivo) {
    mostrarMensaje('⚠️ Selecciona un archivo primero', 'error');
    return;
  }
  var nombre = archivo.name.toLowerCase();
  var extension = nombre.split('.').pop();
  if (extension === 'txt') leerTXT(archivo);
  else if (extension === 'pdf') await leerPDF(archivo);
  else if (extension === 'docx') leerDOCX(archivo);
  else if (extension === 'doc') mostrarMensaje('⚠️ Convierte a .docx o pega el texto', 'info');
  else mostrarMensaje('⚠️ Formato no soportado. Usa: .txt, .pdf o .docx', 'error');
});

function leerTXT(archivo) {
  var lector = new FileReader();
  lector.onload = function(e) {
    textoDocumento = e.target.result;
    areaTexto.value = textoDocumento;
    mostrarMensaje('✅ Archivo .txt cargado correctamente', 'exito');
  };
  lector.readAsText(archivo);
}

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

btnGenerar.addEventListener('click', function() {
  var texto = areaTexto.value.trim();
  if (!texto && textoDocumento) texto = textoDocumento;
  if (!texto) {
    mostrarMensaje('⚠️ Sube un archivo o pega el contenido primero', 'error');
    return;
  }
  preguntas = generarPreguntasDesarrolladas(texto);
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

// ==============================================
// 🎯 PREGUNTAS MÁS DESARROLLADAS Y CLARAS
// ==============================================
function generarPreguntasDesarrolladas(texto) {
  var lista = [];
  var oraciones = texto.split(/[.!?]/);
  var frasesUtiles = [];

  for (var i = 0; i < oraciones.length; i++) {
    var frase = oraciones[i].trim();
    if (frase.length > 40 && frase.length < 300) {
      frasesUtiles.push(frase);
    }
  }

  // 📋 PREGUNTAS MÁS ELABORADAS Y VARIADAS
  var tiposPregunta = [
    'De acuerdo con la información presentada en el texto, ¿cuál de las siguientes afirmaciones es la correcta?',
    'Según lo que se explica en la lectura, ¿qué afirmación refleja con mayor precisión la idea principal?',
    'Al analizar el contenido del fragmento, podemos afirmar que:',
    '¿Cuál de las siguientes opciones coincide exactamente con lo que dice el texto?',
    'A partir de la lectura del texto, identifica la afirmación que es verdadera según la información proporcionada:'
  ];

  var opcionesIncorrectas = [
    'Afirmación que contradice lo expresado en el texto',
    'Información que no se menciona en ningún momento de la lectura',
    'Interpretación equivocada del contenido presentado',
    'Dato que no corresponde a la información del texto',
    'Explicación contraria a la idea principal del fragmento'
  ];

  var cantidad = Math.min(5, frasesUtiles.length);
  for (var j = 0; j < cantidad; j++) {
    var frase = frasesUtiles[j];
    var tipoPregunta = tiposPregunta[j % tiposPregunta.length];
    
    // Mejorar la opción correcta: más completa
    var opcionCorrecta = frase.length > 100 
      ? frase.substring(0, 100) + '...' 
      : frase;

    // Seleccionar 3 opciones incorrectas distintas
    var opsIncorrectas = [...opcionesIncorrectas];
    var op2 = opsIncorrectas.splice(Math.floor(Math.random() * opsIncorrectas.length), 1)[0];
    var op3 = opsIncorrectas.splice(Math.floor(Math.random() * opsIncorrectas.length), 1)[0];
    var op4 = opsIncorrectas.splice(Math.floor(Math.random() * opsIncorrectas.length), 1)[0];

    lista.push({
      pregunta: tipoPregunta,
      opciones: [opcionCorrecta, op2, op3, op4],
      correcta: 0
    });
  }
  return lista;
}

function mostrarPregunta() {
  var p = preguntas[preguntaActual];
  contenedorPregunta.innerHTML = 
    '<h3>Pregunta ' + (preguntaActual + 1) + '</h3>' +
    '<p style="font-size:16px; margin-bottom:25px; line-height:1.7; color:#4A4855; font-weight:500;">' + p.pregunta + '</p>' +
    '<label class="opcion"><input type="radio" name="resp" value="0"> <strong>1.</strong> ' + p.opciones[0] + '</label>' +
    '<label class="opcion"><input type="radio" name="resp" value="1"> <strong>2.</strong> ' + p.opciones[1] + '</label>' +
    '<label class="opcion"><input type="radio" name="resp" value="2"> <strong>3.</strong> ' + p.opciones[2] + '</label>' +
    '<label class="opcion"><input type="radio" name="resp" value="3"> <strong>4.</strong> ' + p.opciones[3] + '</label>';
}

btnSiguiente.addEventListener('click', function() {
  var sel = document.querySelector('input[name="resp"]:checked');
  if (!sel) {
    mostrarMensaje('⚠️ Selecciona una respuesta antes de continuar', 'error');
    return;
  }
  if (parseInt(sel.value) === preguntas[preguntaActual].correcta) aciertos++;
  
  preguntaActual++;
  if (preguntaActual < preguntas.length) {
    mostrarPregunta();
  } else {
    seccionPreguntas.style.display = 'none';
    seccionDiagnostico.style.display = 'block';
    var total = preguntas.length;
    var porc = Math.round((aciertos / total) * 100);
    var mensajeFinal = porc >= 80 ? '🎉 ¡Excelente trabajo! Dominas muy bien el tema y comprendes perfectamente la lectura.' : 
                       porc >= 60 ? '📖 Buen desempeño. Te recomiendo repasar algunos puntos clave para mejorar tu comprensión lectora.' : 
                       '⚠️ Es necesario leer con más atención. Vuelve a estudiar el contenido y analiza bien cada afirmación.';

    seccionDiagnostico.innerHTML = 
      '<h2>📋 Diagnóstico Final del Examen</h2>' +
      '<p style="font-size:16px; margin:8px 0;"><strong>Total de preguntas respondidas:</strong> ' + total + '</p>' +
      '<p style="color:#50A080; font-size:18px; margin:8px 0;"><strong>✅ Respuestas correctas:</strong> ' + aciertos + '</p>' +
      '<p style="color:#D08078; font-size:18px; margin:8px 0;"><strong>❌ Respuestas incorrectas:</strong> ' + (total - aciertos) + '</p>' +
      '<p style="font-size:22px; font-weight:bold; margin-top:20px; color:#A06040;">Porcentaje de aciertos: ' + porc + '%</p>' +
      '<div style="margin-top:25px; padding:18px; background:#FFEDE0; border-radius:12px; line-height:1.7;">' +
        '<strong>💡 Recomendación personalizada:</strong><br>' + mensajeFinal +
      '</div>' +
      '<button onclick="location.reload()" style="margin-top:25px; padding:15px 30px; background:#E8A87C; color:#A05F3E; border:none; border-radius:12px; font-size:17px; font-weight:bold; cursor:pointer; width:100%;">🔄 Realizar un Nuevo Examen</button>';
    seccionDiagnostico.scrollIntoView({ behavior: 'smooth' });
  }
});