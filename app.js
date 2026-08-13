// --------------------------
// 1. Banco de preguntas organizado por temas
// --------------------------
const bancoPreguntas = {
  matematicas: {
    palabrasClave: ["matemáticas", "fracción", "ecuación", "álgebra", "geometría", "triángulo", "área", "volumen"],
    preguntas: [
      { pregunta: "¿Cuánto es 7 × 8?", opciones: ["54", "56", "63", "48"], respuesta: 1, tema: "operaciones" },
      { pregunta: "¿Cuánto es 15 ÷ 3?", opciones: ["3", "4", "5", "6"], respuesta: 2, tema: "operaciones" },
      { pregunta: "¿Cuál es el resultado de resolver 2x + 5 = 15?", opciones: ["x=5", "x=10", "x=2", "x=4"], respuesta: 0, tema: "ecuaciones" }
    ]
  },
  lenguaje: {
    palabrasClave: ["lenguaje", "sustantivo", "verbo", "adjetivo", "oración", "gramática", "literatura"],
    preguntas: [
      { pregunta: "¿Qué es un sustantivo?", opciones: [
        "Palabra que nombra personas, cosas o lugares",
        "Palabra que expresa una acción",
        "Palabra que describe un adjetivo",
        "Palabra que une oraciones"
      ], respuesta: 0, tema: "gramática" },
      { pregunta: "¿Qué función cumple el verbo en una oración?", opciones: [
        "Nombrar seres u objetos",
        "Expresar la acción o estado",
        "Describir cualidades",
        "Conectar ideas"
      ], respuesta: 1, tema: "gramática" }
    ]
  },
  ciencias: {
    palabrasClave: ["ciencias", "célula", "átomo", "ecosistema", "planeta", "ser vivo", "nutrición"],
    preguntas: [
      { pregunta: "¿Cuál es el planeta más cercano al Sol?", opciones: ["Venus", "Marte", "Mercurio", "Júpiter"], respuesta: 2, tema: "sistema solar" },
      { pregunta: "¿Cuál es la unidad básica de la vida?", opciones: ["Átomo", "Célula", "Tejido", "Órgano"], respuesta: 1, tema: "biología" }
    ]
  }
};

// --------------------------
// 2. Elementos del DOM
// --------------------------
const seccionSubir = document.getElementById("subir-documento");
const seccionExamen = document.getElementById("zona-examen");
const seccionDiagnostico = document.getElementById("zona-diagnostico");
const mensajeArchivo = document.getElementById("mensaje-archivo");
const archivoInput = document.getElementById("archivo");
const btnSubir = document.getElementById("btn-subir");
const preguntaTexto = document.getElementById("pregunta-texto");
const opcionesDiv = document.getElementById("opciones");
const btnSiguiente = document.getElementById("btn-siguiente");
const contenidoDiagnostico = document.getElementById("contenido-diagnostico");
const btnReiniciar = document.getElementById("btn-reiniciar");

// Variables de estado
let preguntasSeleccionadas = [];
let indicePregunta = 0;
let respuestasUsuario = [];

// --------------------------
// 3. Eventos
// --------------------------
btnSubir.addEventListener("click", procesarArchivo);
btnSiguiente.addEventListener("click", siguientePregunta);
btnReiniciar.addEventListener("click", reiniciar);

// --------------------------
// 4. Funciones
// --------------------------

// Leer y procesar el archivo subido
async function procesarArchivo() {
  const archivo = archivoInput.files[0];
  if (!archivo) {
    mensajeArchivo.textContent = "⚠️ Por favor, selecciona un archivo primero.";
    return;
  }

  try {
    let texto = "";
    const extension = archivo.name.split('.').pop().toLowerCase();

    if (extension === "txt") {
      texto = await leerTXT(archivo);
    } else if (extension === "pdf") {
      texto = await leerPDF(archivo);
    } else if (extension === "docx") {
      texto = await leerDOCX(archivo);
    } else {
      mensajeArchivo.textContent = "⚠️ Formato no soportado. Usa TXT, PDF o DOCX.";
      return;
    }

    mensajeArchivo.innerHTML = "✅ Archivo analizado con éxito. Preparando examen...";
    setTimeout(() => prepararExamen(texto.toLowerCase()), 1200);

  } catch (err) {
    mensajeArchivo.textContent = "❌ Error al leer el archivo: " + err.message;
  }
}

// Funciones auxiliares para leer archivos
function leerTXT(archivo) {
  return new Promise((resolve) => {
    const lector = new FileReader();
    lector.onload = e => resolve(e.target.result);
    lector.readAsText(archivo);
  });
}

async function leerPDF(archivo) {
  const arrayBuffer = await leerComoArrayBuffer(archivo);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let texto = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const pagina = await pdf.getPage(i);
    const contenido = await pagina.getTextContent();
    texto += contenido.items.map(item => item.str).join(" ") + "\n";
  }
  return texto;
}

async function leerDOCX(archivo) {
  const arrayBuffer = await leerComoArrayBuffer(archivo);
  const resultado = await mammoth.extractRawText({ arrayBuffer });
  return resultado.value;
}

function leerComoArrayBuffer(archivo) {
  return new Promise((resolve) => {
    const lector = new FileReader();
    lector.onload = e => resolve(e.target.result);
    lector.readAsArrayBuffer(archivo);
  });
}

// Analizar texto y preparar examen
function prepararExamen(texto) {
  const temasEncontrados = new Set();

  // Detectar temas según palabras clave
  Object.entries(bancoPreguntas).forEach(([tema, datos]) => {
    if (datos.palabrasClave.some(palabra => texto.includes(palabra))) {
      temasEncontrados.add(tema);
    }
  });

  if (temasEncontrados.size === 0) {
    mensajeArchivo.textContent = "⚠️ No se detectaron temas reconocibles. Se hará un examen general.";
    preguntasSeleccionadas = obtenerExamenGeneral();
  } else {
    mensajeArchivo.innerHTML = ✅ Temas detectados: <strong>${Array.from(temasEncontrados).join(", ")}</strong>;
    // Recolectar preguntas de los temas detectados
    preguntasSeleccionadas = Object.entries(bancoPreguntas)
      .filter(([t]) => temasEncontrados.has(t))
      .flatMap(([, datos]) => datos.preguntas);
    // Mezclar preguntas
    preguntasSeleccionadas = preguntasSeleccionadas.sort(() => 0.5 - Math.random()).slice(0, 5);
  }

  // Iniciar examen
  setTimeout(() => {
    seccionSubir.classList.add("oculta");
    seccionExamen.classList.remove("oculta");
    mostrarPregunta();
  }, 1000);
}

function obtenerExamenGeneral() {
  return Object.values(bancoPreguntas).flatMap(d => d.preguntas).sort(() => 0.5 - Math.random()).slice(0, 5);
}

// Mostrar pregunta actual
function mostrarPregunta() {
  const actual = preguntasSeleccionadas[indicePregunta];
  preguntaTexto.textContent = Pregunta ${indicePregunta + 1} de ${preguntasSeleccionadas.length}: ${actual.pregunta};
  opcionesDiv.innerHTML = "";
  btnSiguiente.classList.add("oculta");

  actual.opciones.forEach((opcion, idx) => {
    const opEl = document.createElement("div");
    opEl.className = "opcion";
    opEl.textContent = opcion;
    opEl.addEventListener("click", () => verificarRespuesta(idx, opEl, actual.respuesta));
    opcionesDiv.appendChild(opEl);
  });
}

function verificarRespuesta(seleccionada, elemento, correcta) {
  respuestasUsuario.push({ seleccionada, correcta });
  if (seleccionada === correcta) {
    elemento.classList.add("correcta");
  } else {
    elemento.classList.add("incorrecta");
  }
  document.querySelectorAll(".opcion").forEach(o => o.style.pointerEvents = "none");
  btnSiguiente.classList.remove("oculta");
}

function siguientePregunta() {
  indicePregunta++;
  if (indicePregunta < preguntasSeleccionadas.length) {
    mostrarPregunta();
  } else {
    mostrarDiagnostico();
  }
}

// Generar y mostrar diagnóstico final
function mostrarDiagnostico() {
  seccionExamen.classList.add("oculta");
  seccionDiagnostico.classList.remove("oculta");

  const aciertos = respuestasUsuario.filter(r => r.seleccionada === r.correcta).length;
  const total = preguntasSeleccionadas.length;
  const porcentaje = Math.round((aciertos / total) * 100);

  // Clasificar por temas
  const temasAciertos = {};
  respuestasUsuario.forEach((resp, i) => {
    const tema = preguntasSeleccionadas[i].tema;
    if (!temasAciertos[tema]) temasAciertos[tema] = { aciertos: 0, total: 0 };
    temasAciertos[tema].total++;
    if (resp.seleccionada === resp.correcta) temasAciertos[tema].aciertos++;
  });

  // Crear contenido HTML
  contenidoDiagnostico.innerHTML = `
    <h3>📋 Resumen de tu desempeño</h3>
    <p style="font-size: 1.2rem; font-weight:bold;">Resultado general: ${aciertos} de ${total} aciertos (${porcentaje}%)</p>
    <ul>
      ${Object.entries(temasAciertos).map(([t, datos]) => `
        <li><strong>${t}:</strong> ${datos.aciertos}/${datos.total} → ${Math.round((datos.aciertos / datos.total) * 100)}%</li>
      `).join('')}
    </ul>
    <h3>💡 Recomendaciones de estudio</h3>
    <ul>
      ${Object.entries(temasAciertos).map(([t, datos]) => {
        const porc = Math.round((datos.aciertos / datos.total) * 100);
        if (porc >= 80) return <li>✅ Dominas bien el tema de ${t}, ¡muy bien!</li>;
        else if (porc >= 50) return <li>⚠️ Tienes nociones de ${t}, pero conviene repasar un poco más.</li>;
        else return <li>📖 Necesitas reforzar el tema de ${t}. Te sugiero volver a leer los apuntes y hacer más ejercicios.</li>;
      }).join('')}
    </ul>
  `;
}

function reiniciar() {
  archivoInput.value = "";
  mensajeArchivo.textContent = "";
  respuestasUsuario = [];
  indicePregunta = 0;
  preguntasSeleccionadas = [];
  seccionDiagnostico.classList.add("oculta");
  seccionSubir.classList.remove("oculta");
}