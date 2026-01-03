let presupuesto = 0;
let total = 0;

// ------------------ ELEMENTOS ------------------

const video = document.getElementById("video");
const estado = document.getElementById("ocrEstado");

// Modal edición
let liEditando = null;

const modal = document.getElementById("modalEditar");
const editNombre = document.getElementById("editNombre");
const editPrecio = document.getElementById("editPrecio");
const btnGuardarEdicion = document.getElementById("btnGuardarEdicion");
const btnCerrarModal = document.getElementById("btnCerrarModal");


// ------------------ GUARDAR / CARGAR ------------------

function guardarEstado() {
    const productos = [...document.querySelectorAll("#lista li")].map(li => li.dataset.raw);

    const data = {
        presupuesto,
        productos
    };

    localStorage.setItem("compras", JSON.stringify(data));
}

function cargarEstado() {
    const data = JSON.parse(localStorage.getItem("compras"));
    if (!data) return;

    presupuesto = data.presupuesto || 0;
    document.getElementById("presupuesto").value = presupuesto;

    total = 0;
    document.getElementById("lista").innerHTML = "";

    data.productos.forEach(raw => {
        const [nombre, precio] = raw.split("||");
        crearItem(nombre, parseFloat(precio), true);
        total += parseFloat(precio);
    });

    actualizarTotales();
}

window.onload = cargarEstado;

// ------------------ PRESUPUESTO ------------------

function setPresupuesto() {
    presupuesto = parseFloat(document.getElementById("presupuesto").value);
    actualizarTotales();
    guardarEstado();
}

// ------------------ CREAR ÍTEM ------------------

function crearItem(nombre, precio, cargar = false) {
    const li = document.createElement("li");
    li.dataset.raw = `${nombre}||${precio}`;
    li.innerHTML = `${nombre}: $${precio} <button class="delete">X</button>`;

    li.querySelector(".delete").onclick = () => {
        li.remove();
        total -= precio;
        actualizarTotales();
        guardarEstado();
    };

    li.onclick = (e) => {
        if (e.target.classList.contains("delete")) return;
        abrirModal(li, nombre, precio);
    };

    document.getElementById("lista").appendChild(li);

    if (!cargar) {
        total += precio;
    }
}

// ------------------ AGREGAR PRODUCTO ------------------

function agregarProducto(nombre, precio) {
    crearItem(nombre, precio);
    actualizarTotales();
    guardarEstado();
}

function agregarProductoManual() {
    const nombre = document.getElementById("nombre").value.trim();
    const precio = parseFloat(document.getElementById("precio").value);

    if (!nombre || isNaN(precio)) return;

    agregarProducto(nombre, precio);

    document.getElementById("nombre").value = "";
    document.getElementById("precio").value = "";
}

// ------------------ TOTALES ------------------

function actualizarTotales() {
    document.getElementById("total").textContent = total;
    document.getElementById("restante").textContent = Math.max(0, presupuesto - total);

    document.getElementById("alerta").style.display =
        (total >= presupuesto && presupuesto > 0) ? "block" : "none";
}

// ------------------ RESET ------------------

function resetear() {
    if (confirm("¿Seguro que querés borrar todo?")) {
        localStorage.clear();
        location.reload();
    }
}

// ------------------ MODAL EDICIÓN ------------------

function abrirModal(li, nombre, precio) {
    liEditando = li;
    editNombre.value = nombre;
    editPrecio.value = precio;
    modal.style.display = "flex";
}

btnCerrarModal.onclick = () => {
    modal.style.display = "none";
    liEditando = null;
};

btnGuardarEdicion.onclick = () => {
    if (!liEditando) return;

    const nuevoNombre = editNombre.value.trim();
    const nuevoPrecio = parseFloat(editPrecio.value);

    if (!nuevoNombre || isNaN(nuevoPrecio)) {
        alert("Datos inválidos");
        return;
    }

    const [nombreViejo, precioViejo] = liEditando.dataset.raw.split("||");

    total -= parseFloat(precioViejo);
    total += nuevoPrecio;

    liEditando.dataset.raw = `${nuevoNombre}||${nuevoPrecio}`;
    liEditando.innerHTML = `
        ${nuevoNombre}: $${nuevoPrecio}
        <button class="delete">X</button>
    `;

    liEditando.querySelector(".delete").onclick = () => {
        liEditando.remove();
        total -= nuevoPrecio;
        actualizarTotales();
        guardarEstado();
    };

    actualizarTotales();
    guardarEstado();

    modal.style.display = "none";
    liEditando = null;
};

// ------------------ OCR ------------------

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => video.srcObject = stream)
    .catch(err => alert("No se pudo acceder a la cámara: " + err));

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

let cooldown = false;

async function escanear() {
    if (cooldown) return setTimeout(escanear, 800);

    cooldown = true;
    setTimeout(() => cooldown = false, 1500);

    const w = video.videoWidth * 0.6;
    const h = video.videoHeight * 0.25;
    const x = (video.videoWidth - w) / 2;
    const y = (video.videoHeight - h) / 2;

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(video, x, y, w, h, 0, 0, w, h);

    const imagen = canvas.toDataURL("image/png");

    estado.textContent = "Leyendo...";

    try {
        const result = await Tesseract.recognize(imagen, "eng");
        const data = result.data.text;

        const numeros = data.match(/\$?\s?\d+[.,]?\d*/g);

        if (numeros && numeros.length > 0) {
            const precio = parseFloat(numeros[numeros.length - 1].replace(",", "."));

            if (!isNaN(precio)) {
                estado.textContent = "Precio detectado: $" + precio;
                agregarProducto("Producto (OCR)", precio);
            }
        } else {
            estado.textContent = "No se detectó número";
        }
    } catch (e) {
        estado.textContent = "Error OCR";
    }

    setTimeout(escanear, 1300);
}

// ------------------ BOTÓN CAPTURAR IMAGEN ------------------

btnCapturar.addEventListener("click", async () => {

    if (!video.videoWidth) {
        estado.textContent = "La cámara no está lista";
        return;
    }

    // ⬇️ ESTADO PROCESANDO (ACÁ VA)
    btnCapturar.classList.add("loading");
    btnCapturar.querySelector(".btn-text").textContent = "Procesando...";
    btnCapturar.disabled = true;

    try {
        const w = video.videoWidth * 0.6;
        const h = video.videoHeight * 0.25;
        const x = (video.videoWidth - w) / 2;
        const y = (video.videoHeight - h) / 2;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, x, y, w, h, 0, 0, w, h);

        estado.textContent = "Procesando imagen...";

        const result = await Tesseract.recognize(canvas, "spa");

        ; const texto = result.data.text;
        const precio = extraerPrecioArgentina(texto);

        if (!precio) {
            estado.textContent = "No se detectó un precio válido";
            return;
        }


        if (isNaN(precio)) {
            estado.textContent = "Precio inválido";
            return;
        }

        estado.textContent = "Precio detectado: $" + precio;
        agregarProducto("Producto (OCR)", precio);

    } catch (err) {
        console.error(err);
        estado.textContent = "Error al leer la imagen";
    } finally {
        // ⬇️ VOLVER A ESTADO NORMAL (ACÁ TAMBIÉN)
        btnCapturar.classList.remove("loading");
        btnCapturar.querySelector(".btn-text").textContent = "Capturar";
        btnCapturar.disabled = false;
    }
});

function extraerPrecioArgentina(texto) {
    // Buscar números con formato argentino
    const matches = texto.match(/\$?\s?\d{1,3}(\.\d{3})*(,\d{2})?/g);
    if (!matches) return null;

    const precios = matches
        .map(p => p.replace(/\$/g, "").trim())
        .map(p => {
            // 1.234,56 → 1234.56
            if (p.includes(",") && p.includes(".")) {
                return parseFloat(p.replace(/\./g, "").replace(",", "."));
            }
            // 1234,56 → 1234.56
            if (p.includes(",")) {
                return parseFloat(p.replace(",", "."));
            }
            // 1.234 → 1234
            if (p.includes(".")) {
                return parseFloat(p.replace(/\./g, ""));
            }
            return parseFloat(p);
        })
        .filter(p => !isNaN(p) && p > 10); // descartamos precios chicos

    if (precios.length === 0) return null;

    // devolver el precio más alto (suele ser el total)
    return Math.max(...precios);
}





//video.addEventListener("loadeddata", escanear);








