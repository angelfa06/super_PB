const KEY = "listaCompras";
const KEY_COMPRADOS = "listaComprados";

// Cargar ambas listas
function cargarListas() {
    cargarListaPendientes();
    cargarListaComprados();
}

function cargarListaPendientes() {
    const data = JSON.parse(localStorage.getItem(KEY)) || [];
    const ul = document.getElementById("listaCompras");

    ul.innerHTML = "";
    data.forEach((texto, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <span>${texto}</span>
            <div>
                <button class="check" onclick="marcarComprado(${index}, this)">✔</button>
                <button onclick="eliminar(${index})">X</button>
            </div>
        `;
        ul.appendChild(li);
    });
}

function cargarListaComprados() {
    const data = JSON.parse(localStorage.getItem(KEY_COMPRADOS)) || [];
    const ul = document.getElementById("listaComprados");

    ul.innerHTML = "";
    data.forEach((texto, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <span>${texto}</span>
            <button class="restore" onclick="restaurar(${index}, this)">↩</button>
        `;
        ul.appendChild(li);
    });
}

// Agregar ítem
function agregarItem() {
    const input = document.getElementById("item");
    const texto = input.value.trim();

    if (!texto) return;

    const data = JSON.parse(localStorage.getItem(KEY)) || [];
    data.push(texto);

    localStorage.setItem(KEY, JSON.stringify(data));
    input.value = "";
    cargarListas();
}

// Eliminar ítem de pendientes
function eliminar(index) {
    const data = JSON.parse(localStorage.getItem(KEY)) || [];
    data.splice(index, 1);

    localStorage.setItem(KEY, JSON.stringify(data));
    cargarListas();
}

// Marcar como comprado
function marcarComprado(index, btn) {
    const li = btn.closest("li");
    li.classList.add("move-anim");

    setTimeout(() => {
        const pendientes = JSON.parse(localStorage.getItem(KEY)) || [];
        const comprados = JSON.parse(localStorage.getItem(KEY_COMPRADOS)) || [];

        const item = pendientes[index];

        comprados.push(item);
        pendientes.splice(index, 1);

        localStorage.setItem(KEY, JSON.stringify(pendientes));
        localStorage.setItem(KEY_COMPRADOS, JSON.stringify(comprados));

        cargarListas();
    }, 300);
}

// Restaurar producto
function restaurar(index, btn) {
    const li = btn.closest("li");
    li.classList.add("restore-anim");

    setTimeout(() => {
        const pendientes = JSON.parse(localStorage.getItem(KEY)) || [];
        const comprados = JSON.parse(localStorage.getItem(KEY_COMPRADOS)) || [];

        const item = comprados[index];

        pendientes.push(item);
        comprados.splice(index, 1);

        localStorage.setItem(KEY, JSON.stringify(pendientes));
        localStorage.setItem(KEY_COMPRADOS, JSON.stringify(comprados));

        cargarListas();
    }, 300);
}

// Borrar todos los comprados
function borrarTodosComprados() {
    localStorage.setItem(KEY_COMPRADOS, JSON.stringify([]));
    cargarListas();
}

cargarListas();
