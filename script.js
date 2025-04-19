// ===============================
// VARIABLES GLOBALES
// ===============================
let modoActivo = false;
let colocandoCarga = false;
let tipoCarga = null;
let cargaFantasma = null;
let cargaSeleccionada = null;
let dragging = false;
let cargaArrastrando = null;
let offsetX = 0, offsetY = 0;
let huboMovimiento = false;
let contador = 0;
let cargas = [];
let x0 = null;
let y0 = null;

const contenedor = document.getElementById("contenedor");
const sidebar = document.getElementById("sidebar");
const basurero = document.getElementById("basurero");
const toggleIcon = document.getElementById("toggle-icon");
toggleIcon.setAttribute("draggable", "false");

// ===============================
// FUNCIONES AUXILIARES
// ===============================
function getEventPosition(e) {
  if (e.touches?.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function toggleSidebar() {
  const isActive = sidebar.classList.toggle("active");
  toggleIcon.src = `images/${isActive ? "eliminar" : "agregar"}.png`;
  toggleIcon.alt = isActive ? "Cerrar sidebar" : "Abrir sidebar";
  toggleIcon.classList.toggle("rotated", isActive);
  toggleIcon.classList.toggle("rotated1", !isActive);
}

// ===============================
// FUNCIONES DE CREACIÓN Y MODO DE CARGAS
// ===============================
function crearCarga(x, y, tipo) {
  // if (tipo === "prueba" && document.querySelector(".cargaPrueba")) return;
  if(tipo==="prueba"){
    const nuevaCarga = document.createElement("div");
    nuevaCarga.classList.add(`carga${capitalizar(tipo)}`);
    nuevaCarga.setAttribute("data-tooltip", `Carga ${tipo}`);
    nuevaCarga.setAttribute("data-carga", "1");
    nuevaCarga.style.position = "absolute";
    nuevaCarga.style.left = `${x}px`;
    nuevaCarga.style.top = `${y}px`;

    contenedor.appendChild(nuevaCarga);
    x0 = x;
    y0 = y;

    const campo = calcularCampoTotal(cargas, x0, y0);
    const vector = getVectorDesdePunto(x0, y0, campo.magnitud, campo.angulo, 10); // ⚠️ Ajusta escala

    // console.log("Campo total:", campo);
    // console.log("Vector:", vector);

    dibujarFlecha(vector); // ✅ Esta función la defines abajo
  }else{

    const nuevaCarga = document.createElement("div");
    nuevaCarga.classList.add(`carga${capitalizar(tipo)}`);
    nuevaCarga.setAttribute("data-id", `${contador++}`);
    nuevaCarga.setAttribute("data-tooltip", `Carga ${tipo}`);
    nuevaCarga.setAttribute("data-carga", `${tipo=="positiva"?"1":"-1"}`);
    nuevaCarga.style.position = "absolute";
    nuevaCarga.style.left = `${x}px`;
    nuevaCarga.style.top = `${y}px`;
    
    contenedor.appendChild(nuevaCarga);
    
    let newCarga = {
      id: nuevaCarga.getAttribute("data-id"),
      x: parseInt(nuevaCarga.style.left, 10),  // Convertimos de string a número
      y: parseInt(nuevaCarga.style.top, 10),   // Convertimos de string a número
      q: parseFloat(nuevaCarga.getAttribute("data-carga")), // Convertimos a número flotante
      tipo: tipo
    }
    if(x0!=null){
      const campo = calcularCampoTotal(cargas, x0, y0);
          const vector = getVectorDesdePunto(x0, y0, campo.magnitud, campo.angulo, 10); // ⚠️ Ajusta escala

          // console.log("Campo total:", campo);
          // console.log("Vector:", vector);

          dibujarFlecha(vector);
    }
    
    cargas.push(newCarga);
    console.log("CARGA CREADA", cargas);
  }
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function activarModo(tipo) {
  toggleSidebar();
  modoActivo = true;
  tipoCarga = tipo;
  colocandoCarga = true;
  contenedor.classList.add("cursor-colocar");

  if (tipo === "prueba" && document.querySelector(".cargaPrueba")) return;

  cargaFantasma = document.createElement("div");
  cargaFantasma.classList.add(`carga${capitalizar(tipo)}`, "fantasma");
  cargaFantasma.setAttribute("data-tooltip", `Carga ${tipo}`);
  Object.assign(cargaFantasma.style, {
    position: "absolute",
    pointerEvents: "none",
    opacity: "0.5"
  });

  document.body.appendChild(cargaFantasma);
  document.addEventListener("mousemove", moverCargaFantasma);
  document.addEventListener("touchmove", moverCargaFantasma, { passive: false });
}

function moverCargaFantasma(e) {
  if (!colocandoCarga || !cargaFantasma) return;
  e.preventDefault();
  const { x, y } = getEventPosition(e);
  const rect = contenedor.getBoundingClientRect();

  cargaFantasma.style.left = `${x - rect.left - cargaFantasma.offsetWidth / 2}px`;
  cargaFantasma.style.top = `${y - rect.top - cargaFantasma.offsetHeight / 2}px`;
}

// ===============================
// EVENTOS DE DRAG Y DROP
// ===============================
contenedor.addEventListener("mousedown", iniciarArrastreMouse);
contenedor.addEventListener("touchstart", iniciarArrastreTouch, { passive: false });

function iniciarArrastreMouse(e) {
  iniciarArrastre(e, e.clientX, e.clientY);
}

function iniciarArrastreTouch(e) {
  const touch = e.touches[0];
  iniciarArrastre(e, touch.clientX, touch.clientY);
}

function iniciarArrastre(e, clientX, clientY) {
  if (!esCarga(e.target)) return;
  dragging = true;
  huboMovimiento = false;
  cargaArrastrando = e.target;

  const rect = cargaArrastrando.getBoundingClientRect();
  offsetX = clientX - rect.left;
  offsetY = clientY - rect.top;

  document.addEventListener("mousemove", moverCarga);
  document.addEventListener("mouseup", soltarCarga);
  document.addEventListener("touchmove", moverCarga, { passive: false });
  document.addEventListener("touchend", soltarCarga);
}

function moverCarga(e) {
  if (!dragging || !cargaArrastrando) return;
  huboMovimiento = true;
  e.preventDefault();

  const { x, y } = getEventPosition(e);
  const rect = contenedor.getBoundingClientRect();

  cargaArrastrando.style.left = `${x - rect.left - offsetX}px`;
  cargaArrastrando.style.top = `${y - rect.top - offsetY}px`;


}

function soltarCarga(e) {
  if (!dragging || !cargaArrastrando) return;

  const cargaRect = cargaArrastrando.getBoundingClientRect();
  const basureroRect = basurero.getBoundingClientRect();
  const idCarga = cargaArrastrando.getAttribute("data-id");

  const colisiona = (
    cargaRect.left < basureroRect.right &&
    cargaRect.right > basureroRect.left &&
    cargaRect.top < basureroRect.bottom &&
    cargaRect.bottom > basureroRect.top
  );

  if (colisiona) {
    cargaArrastrando.classList.add("fade-out");
    const cargaAEliminar = cargaArrastrando; // ✅ Guarda referencia
    // 🔧 Eliminamos del DOM y también del arreglo 'cargas'
    setTimeout(() => {
      if (cargaAEliminar && cargaAEliminar.remove) {
        cargaAEliminar.remove();
      }
      if(cargaAEliminar.getAttribute("data-tooltip") == "Carga prueba"){
        x0 = null;
        y0 = null;
        const svg = document.getElementById("canvas");
        const flechasAntiguas = svg.querySelectorAll("line");
        flechasAntiguas.forEach(f => f.remove());
      }else{
        cargas = cargas.filter(c => c.id !== idCarga); // 🔧 Elimina carga del arreglo
        if(x0!=null){
          const campo = calcularCampoTotal(cargas, x0, y0);
              const vector = getVectorDesdePunto(x0, y0, campo.magnitud, campo.angulo, 10); // ⚠️ Ajusta escala
    
              // console.log("Campo total:", campo);
              // console.log("Vector:", vector);
    
              dibujarFlecha(vector);
        }
      }
    }, 400);
  }else{
    if(cargaArrastrando.getAttribute("data-tooltip") == "Carga prueba"){
      x0 = parseInt(cargaArrastrando.style.left, 10);
      y0 = parseInt(cargaArrastrando.style.top, 10);
      const campo = calcularCampoTotal(cargas, x0, y0);
      const vector = getVectorDesdePunto(x0, y0, campo.magnitud, campo.angulo, 10); // ⚠️ Ajusta escala

      // console.log("Campo total:", campo);
      // console.log("Vector:", vector);
      dibujarFlecha(vector);

      console.log(x0 + ", " + y0);
    }else{

      let modCarga = cargas.find(c => c.id === idCarga);
      if (modCarga) {
        modCarga.x = parseInt(cargaArrastrando.style.left, 10);
        modCarga.y = parseInt(cargaArrastrando.style.top, 10);

        if(x0!=null){
          const campo = calcularCampoTotal(cargas, x0, y0);
          const vector = getVectorDesdePunto(x0, y0, campo.magnitud, campo.angulo, 10); // ⚠️ Ajusta escala

          // console.log("Campo total:", campo);
          // console.log("Vector:", vector);

          dibujarFlecha(vector);
        }
      }
    }
  }

  dragging = false;
  cargaArrastrando = null;
  document.removeEventListener("mousemove", moverCarga);
  document.removeEventListener("mouseup", soltarCarga);
  document.removeEventListener("touchmove", moverCarga);
  document.removeEventListener("touchend", soltarCarga);

}

function esCarga(elemento) {
  return elemento.classList.contains("cargaPositiva") ||
         elemento.classList.contains("cargaNegativa") ||
         elemento.classList.contains("cargaPrueba");
}

// ===============================
// CLICK EN EL CONTENEDOR
// ===============================
contenedor.addEventListener("click", function (e) {
  if (dragging || huboMovimiento) {
    huboMovimiento = false;
    return;
  }

  if (esCarga(e.target)) {
    mostrarMenuContextual(e, e.target);
  } else if (modoActivo && colocandoCarga && cargaFantasma) {
    const rect = contenedor.getBoundingClientRect();
    crearCarga(e.clientX - rect.left - 12.5, e.clientY - rect.top - 12.5, tipoCarga);
    cancelarColocacion();
  }
});

document.addEventListener("mouseup", (e) => {
  if (!modoActivo || !colocandoCarga || !cargaFantasma) return;

  const rect = contenedor.getBoundingClientRect();
  if (
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom
  ) {
    crearCarga(e.clientX - rect.left - 12.5, e.clientY - rect.top - 12.5, tipoCarga);
  }

  cancelarColocacion();
});

function cancelarColocacion() {
  if (cargaFantasma) cargaFantasma.remove();
  cargaFantasma = null;
  modoActivo = false;
  colocandoCarga = false;
  contenedor.classList.remove("cursor-colocar");
  document.removeEventListener("mousemove", moverCargaFantasma);
  document.removeEventListener("touchmove", moverCargaFantasma);
}

// ===============================
// MENÚ CONTEXTUAL
// ===============================
function mostrarMenuContextual(e, carga) {
  cargaSeleccionada = carga;
  const input = document.getElementById("input-carga");
  const label = document.getElementById("lbl");

  if (carga.classList.contains("cargaPrueba")) {
    input.style.display = label.style.display = "none";
  } else {
    input.value = carga.getAttribute("data-carga") || "1";
    input.style.display = label.style.display = "block";
  }

  const menu = document.getElementById("menu-contextual");
  menu.style.left = `${e.clientX}px`;
  menu.style.top = `${e.clientY}px`;
  menu.style.display = "block";
  menu.classList.remove("oculto", "fade-out");
  menu.classList.add("fade-in");

  e.stopPropagation();
}

function cerrarMenuContextual() {
  const menu = document.getElementById("menu-contextual");
  if (!menu.classList.contains("fade-out")) {
    menu.classList.replace("fade-in", "fade-out");
    setTimeout(() => {
      menu.style.display = "none";
      menu.classList.add("oculto");
    }, 300);
  }
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("menu-contextual");
  if (!menu.contains(e.target)) cerrarMenuContextual();
  if(x0!=null){
    const campo = calcularCampoTotal(cargas, x0, y0);
        const vector = getVectorDesdePunto(x0, y0, campo.magnitud, campo.angulo, 10); // ⚠️ Ajusta escala

        // console.log("Campo total:", campo);
        // console.log("Vector:", vector);

        dibujarFlecha(vector);
  }
});

// ===============================
// INPUT DE CARGA
// ===============================
const inputCarga = document.getElementById("input-carga");

inputCarga.addEventListener("input", () => {
  if (cargaSeleccionada) {
    const idCarga = cargaSeleccionada.getAttribute("data-id");
    cargaSeleccionada.setAttribute("data-carga", inputCarga.value);
    let modCarga = cargas.find(c => c.id === idCarga);
    if (modCarga) {
      modCarga.q=parseFloat(inputCarga.value);
    }
    if(x0!=null){
      const campo = calcularCampoTotal(cargas, x0, y0);
          const vector = getVectorDesdePunto(x0, y0, campo.magnitud, campo.angulo, 10); // ⚠️ Ajusta escala

          // console.log("Campo total:", campo);
          // console.log("Vector:", vector);

          dibujarFlecha(vector);
    }
  }
});

inputCarga.addEventListener("keypress", (e) => {
  if (e.key === "Enter") cerrarMenuContextual();
});

// ===============================
// ELIMINAR CARGA DESDE MENÚ
// ===============================
function eliminarCargaSeleccionada() {
  if (cargaSeleccionada) {
    const idCarga = cargaSeleccionada.getAttribute("data-id");
    cargaSeleccionada.classList.add("fade-out");
    setTimeout(() => {
      cargaSeleccionada.remove();
      cargas = cargas.filter(c => c.id !== idCarga);
      cargaSeleccionada = null;
      if(x0!=null){
        const campo = calcularCampoTotal(cargas, x0, y0);
            const vector = getVectorDesdePunto(x0, y0, campo.magnitud, campo.angulo, 10); // ⚠️ Ajusta escala
  
            // console.log("Campo total:", campo);
            // console.log("Vector:", vector);
  
            dibujarFlecha(vector);
      }
    }, 400);
  }
  cerrarMenuContextual();
}

// ===============================
// DRAG DESDE SIDEBAR
// ===============================
document.querySelectorAll(".item-carga, .opcion").forEach(item => {
  item.addEventListener("dragstart", (e) => {
    e.preventDefault();
    const tipo = item.id?.replace("carga", "").toLowerCase() ||
                 item.getAttribute("onclick").split("'")[1];
    activarModo(tipo);
  });

  item.addEventListener("dragend", cancelarColocacion);
});

// ===============================
// ELIMINAR CARGA FANTASMA DESDE BASURERO
// ===============================
basurero.addEventListener("click", cancelarColocacion);

function dibujarFlecha({ x0, y0, x1, y1 }) {
  const svg = document.getElementById("canvas");
  const flechasAntiguas = svg.querySelectorAll("line");
flechasAntiguas.forEach(f => f.remove());

  const flecha = document.createElementNS("http://www.w3.org/2000/svg", "line");
  flecha.setAttribute("x1", x0+12.5);
  flecha.setAttribute("y1", y0+12.5);
  flecha.setAttribute("x2", x1);
  flecha.setAttribute("y2", y1);
  flecha.setAttribute("stroke", "red");
  flecha.setAttribute("stroke-width", 2);
  flecha.setAttribute("marker-end", "url(#punta)");

  svg.appendChild(flecha);
}
