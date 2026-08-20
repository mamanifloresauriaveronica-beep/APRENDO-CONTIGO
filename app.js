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

// Cargar archivo
btnCargar.addEventListener('click', function() {
  var archivo = inputArchivo.files[0];
  if (!archivo) { alert('⚠️ Selecciona un archivo'); return; }

  var nombre = archivo.name.toLowerCase();
  var ext = nombre.split('.').pop();

  if (ext === 'txt') {
    var lector = new FileReader();
    lector.onload = function(e) {
      textoDocumento = e.target.result;
      areaTexto.value = textoDocumento;
      alert('✅ Archivo cargado correctamente');
    };
    lector.readAsText(archivo);
  } else {
    alert('⚠️ Para PDF y Word: copia el texto y pégalo en la caja ✅ Es más rápido y preciso');
  }
});

// Generar preguntas MEJORADAS
btnGenerar.addEventListener('click', function() {
  var texto = areaTexto.value.trim();
  if (!texto) { alert('⚠️ Escribe o pega tu contenido de estudio'); return; }

  preguntas = generarPreguntasMejoradas(texto);
  
  if (preguntas.length === 0) { alert('❌ No se pudieron generar preguntas. Intenta con texto más extenso.'); return; }

  seccionPreguntas.style.display = 'block';
  seccionDiagnostico.style.display = 'none';
  preguntaActual = 0;
  aciertos = 0;
  mostrarPregunta();
  alert('✅ Se generaron ' + preguntas.length + ' preguntas personalizadas');
});

// 🧠 FUNCIÓN MEJORADA: crea preguntas con sentido
function generarPreguntasMejoradas(texto) {
  var lista = [];
  var oraciones = texto.split(/[.!?]/);
  var frasesUtiles = [];

  // Filtrar frases con contenido significativo
  for (var i = 0; i < oraciones.length; i++) {
    var frase = oraciones[i].trim();
    if (frase.length > 30 && frase.length < 250) {
      frasesUtiles.push(frase);
    }
  }

  // Tipos de preguntas para variar
  var tiposPregunta = [
    '¿Cuál es la idea principal del siguiente fragmento?',
    'Según el texto, ¿qué afirmación es correcta?',
    '¿Qué explica o describe el texto anterior?',
    'De acuerdo con la lectura, ¿cuál de estas afirmaciones es verdadera?',
    '¿Qué información nos brinda el fragmento?'
  ];

  // Crear preguntas
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
    '<p style="font-size:17px; margin-bottom:20px; color:#2D3748;">' + p.pregunta + '</p>' +
    '<label class="opcion"><input type="radio" name="resp" value="0"> 1. ' + p.opciones[0] + '</label>' +
    '<label class="opcion"><input type="radio" name="resp" value="1"> 2. ' + p.opciones[1] + '</label>' +
    '<label class="opcion"><input type="radio" name="resp" value="2"> 3. ' + p.opciones[2] + '</label>' +
    '<label class="opcion"><input type="radio" name="resp" value="3"> 4. ' + p.opciones[3] + '</label>';
}

// Siguiente y Diagnóstico
btnSiguiente.addEventListener('click', function() {
  var sel = document.querySelector('input[name="resp"]:checked');
  if (!sel) { alert('⚠️ Selecciona una respuesta antes de continuar'); return; }
  
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
    var mensaje = porc >= 80 ? '🎉 ¡Excelente! Dominas muy bien el tema.' : 
                  porc >= 60 ? '📖 Buen trabajo, repasa algunos puntos clave.' : 
                  '⚠️ Necesitas leer con más atención y reforzar el contenido.';

    seccionDiagnostico.innerHTML = 
      '<h2>📋 Diagnóstico Final</h2>' +
      '<p><strong>Total de preguntas:</strong> ' + total + '</p>' +
      '<p style="color:#10B981; font-size:18px;"><strong>✅ Aciertos:</strong> ' + aciertos + '</p>' +
      '<p style="color:#EF4444; font-size:18px;"><strong>❌ Errores:</strong> ' + (total - aciertos) + '</p>' +
      '<p style="font-size:20px; font-weight:bold; margin-top:15px;">Porcentaje: ' + porc + '%</p>' +
      '<div style="margin-top:20px; padding:15px; background:#f3f4f6; border-radius:8px;">' +
        '<strong>💡 Recomendación:</strong><br>' + mensaje +
      '</div>' +
      '<button onclick="location.reload()" style="margin-top:25px; padding:14px 28px; background:#D81E05; color:white; border:none; border-radius:8px; font-size:17px; font-weight:bold; cursor:pointer;">🔄 Realizar Nuevo Examen</button>';
  }
});