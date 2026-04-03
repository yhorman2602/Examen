const productos = [];
const apiUrl = 'Controller/ProductoController.php';

const productoForm = document.getElementById('productoForm');
const nombreInput = document.getElementById('nombre');
const cantidadInput = document.getElementById('cantidad');
const precioInput = document.getElementById('precio');
const mensaje = document.getElementById('mensaje');
const listaProductos = document.getElementById('listaProductos');
const avisoStock = document.getElementById('avisoStock');
const totalProductos = document.getElementById('totalProductos');
const stockAcumulado = document.getElementById('stockAcumulado');
const stockBajo = document.getElementById('stockBajo');

const LIMITE_STOCK_BAJO = 5;
let productoEnEdicionId = null;

function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(precio);
}

function limpiarCeroInput(input) {
    if (input.value === '0' || input.value === '0.00') {
        input.value = '';
    }
}

function limpiarValorPorDefecto(input, valor) {
    if (input.value === valor) {
        input.value = '';
    }
}

function restaurarCeroInput(input) {
    if (input.value.trim() === '') {
        input.value = '0';
    }
}

function restaurarValorPorDefecto(input, valor) {
    if (input.value.trim() === '') {
        input.value = valor;
    }
}

function renderAvisosStock() {
    const productosConStockBajo = productos.filter((producto) => producto.cantidad < LIMITE_STOCK_BAJO);

    if (productosConStockBajo.length === 0) {
        avisoStock.innerHTML = '<p class="stock-alert-empty">No hay alertas de stock bajo en este momento.</p>';
        return;
    }

    avisoStock.innerHTML = productosConStockBajo
        .map(
            (producto) => `
                <p class="stock-alert">
                    Ya no hay muchos productos de <span>${producto.nombre}</span>. Quedan <span>${producto.cantidad}</span> unidades.
                </p>
            `
        )
        .join('');
}

async function solicitar(url, opciones = {}) {
    const respuesta = await fetch(url, {
        headers: {
            'Content-Type': 'application/json'
        },
        ...opciones
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.mensaje || 'No se pudo completar la solicitud.');
    }

    return datos;
}

async function cargarProductos() {
    try {
        const datos = await solicitar(apiUrl, { method: 'GET' });
        productos.splice(0, productos.length, ...datos.productos.map((producto) => ({
            id: Number(producto.id),
            nombre: producto.nombre,
            cantidad: Number(producto.cantidad),
            precio: Number(producto.precio)
        })));
        renderProductos();
    } catch (error) {
        mensaje.textContent = error.message;
    }
}

function renderProductos() {
    if (productos.length === 0) {
        productoEnEdicionId = null;
        listaProductos.innerHTML = `
            <table class="products-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="5" class="empty-table-row">Aun no hay productos registrados.</td>
                    </tr>
                </tbody>
            </table>
        `;
    } else {
        const filas = productos
            .map((producto) => {
                const stockBajoProducto = producto.cantidad < LIMITE_STOCK_BAJO;
                const claseFila = stockBajoProducto ? 'low-quantity-row' : '';
                const claseTexto = stockBajoProducto ? 'product-subtitle low-stock-text' : 'product-subtitle';
                const estaEnEdicion = productoEnEdicionId === producto.id;

                if (estaEnEdicion) {
                    return `
                        <tr class="${claseFila} edit-row">
                            <td data-label="ID"><span class="table-id">${producto.id}</span></td>
                            <td data-label="Nombre">
                                <input class="table-edit-input" type="text" data-edit-field="nombre" data-id="${producto.id}" value="${producto.nombre}">
                            </td>
                            <td data-label="Cantidad">
                                <input class="table-edit-input" type="number" min="0" data-edit-field="cantidad" data-id="${producto.id}" value="${producto.cantidad}">
                            </td>
                            <td data-label="Precio">
                                <div class="table-edit-price">
                                    <span>S/</span>
                                    <input class="table-edit-input" type="number" min="0" step="0.01" data-edit-field="precio" data-id="${producto.id}" value="${producto.precio}">
                                </div>
                            </td>
                            <td data-label="Acciones">
                                <div class="table-actions">
                                    <button class="action-btn save" type="button" data-action="save-edit" data-id="${producto.id}">Aceptar</button>
                                    <button class="action-btn cancel" type="button" data-action="cancel-edit" data-id="${producto.id}">Cancelar</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }

                return `
                    <tr class="${claseFila}">
                        <td data-label="ID"><span class="table-id">${producto.id}</span></td>
                        <td data-label="Nombre">
                            <div class="product-name">
                                <strong>${producto.nombre}</strong>
                                <span class="${claseTexto}">Cantidad disponible: ${producto.cantidad}</span>
                            </div>
                        </td>
                        <td data-label="Cantidad de producto">
                            <div class="quantity-stack">
                                <span class="quantity-value">${producto.cantidad} unidades</span>
                                <div class="row-actions">
                                    <button class="stock-btn decrease" type="button" data-action="decrease" data-id="${producto.id}">Disminuir stock</button>
                                    <button class="stock-btn increase" type="button" data-action="increase" data-id="${producto.id}">Aumentar stock</button>
                                </div>
                            </div>
                        </td>
                        <td data-label="Precio"><span class="price-value">${formatearPrecio(producto.precio)}</span></td>
                        <td data-label="Acciones">
                            <div class="table-actions">
                                <button class="action-btn edit" type="button" data-action="edit" data-id="${producto.id}">Editar</button>
                                <button class="action-btn delete" type="button" data-action="delete" data-id="${producto.id}">Borrar</button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join('');

        listaProductos.innerHTML = `
            <table class="products-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>
        `;
    }

    renderAvisosStock();

    totalProductos.textContent = String(productos.length);
    stockAcumulado.textContent = String(productos.reduce((total, producto) => total + producto.cantidad, 0));
    stockBajo.textContent = String(productos.filter((producto) => producto.cantidad < LIMITE_STOCK_BAJO).length);
}

productoForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombre = nombreInput.value.trim();
    const cantidad = Number.parseInt(cantidadInput.value, 10);
    const precio = Number.parseFloat(precioInput.value);

    if (!nombre) {
        mensaje.textContent = 'Escribe un nombre valido para el producto.';
        return;
    }

    if (Number.isNaN(cantidad) || cantidad < 1) {
        mensaje.textContent = 'La cantidad debe ser un numero igual o mayor a 1.';
        return;
    }

    if (Number.isNaN(precio) || precio < 0) {
        mensaje.textContent = 'El precio debe ser un numero igual o mayor a 0.';
        return;
    }

    try {
        const datos = await solicitar(apiUrl, {
            method: 'POST',
            body: JSON.stringify({ nombre, cantidad, precio })
        });

        productos.push({
            id: Number(datos.producto.id),
            nombre: datos.producto.nombre,
            cantidad: Number(datos.producto.cantidad),
            precio: Number(datos.producto.precio)
        });
        productoForm.reset();
        cantidadInput.value = '0';
        precioInput.value = '0';
        mensaje.textContent = datos.mensaje;
        renderProductos();
        nombreInput.focus();
    } catch (error) {
        mensaje.textContent = error.message;
    }
});

cantidadInput.addEventListener('focus', () => {
    limpiarValorPorDefecto(cantidadInput, '0');
});

cantidadInput.addEventListener('blur', () => {
    restaurarValorPorDefecto(cantidadInput, '0');
});

precioInput.addEventListener('focus', () => {
    limpiarCeroInput(precioInput);
});

precioInput.addEventListener('blur', () => {
    restaurarCeroInput(precioInput);
});

listaProductos.addEventListener('click', async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
        return;
    }

    const { action, id } = target.dataset;
    const producto = productos.find((item) => item.id === Number(id));

    if (!producto) {
        return;
    }

    if (action === 'edit') {
        productoEnEdicionId = producto.id;
        renderProductos();
        return;
    }

    if (action === 'cancel-edit') {
        productoEnEdicionId = null;
        mensaje.textContent = 'Se cancelo la edicion del producto.';
        renderProductos();
        return;
    }

    if (action === 'save-edit') {
        const nombreEditado = listaProductos.querySelector(`[data-edit-field="nombre"][data-id="${producto.id}"]`);
        const cantidadEditada = listaProductos.querySelector(`[data-edit-field="cantidad"][data-id="${producto.id}"]`);
        const precioEditado = listaProductos.querySelector(`[data-edit-field="precio"][data-id="${producto.id}"]`);

        if (!(nombreEditado instanceof HTMLInputElement) || !(cantidadEditada instanceof HTMLInputElement) || !(precioEditado instanceof HTMLInputElement)) {
            mensaje.textContent = 'No se pudo leer la fila en edicion.';
            return;
        }

        const nombre = nombreEditado.value.trim();
        const cantidad = Number.parseInt(cantidadEditada.value, 10);
        const precio = Number.parseFloat(precioEditado.value);

        if (!nombre) {
            mensaje.textContent = 'Escribe un nombre valido para el producto.';
            nombreEditado.focus();
            return;
        }

        if (Number.isNaN(cantidad) || cantidad < 0) {
            mensaje.textContent = 'La cantidad debe ser un numero igual o mayor a 0.';
            cantidadEditada.focus();
            return;
        }

        if (Number.isNaN(precio) || precio < 0) {
            mensaje.textContent = 'El precio debe ser un numero igual o mayor a 0.';
            precioEditado.focus();
            return;
        }

        try {
            const datos = await solicitar(apiUrl, {
                method: 'PUT',
                body: JSON.stringify({ id: producto.id, nombre, cantidad, precio })
            });

            producto.nombre = datos.producto.nombre;
            producto.cantidad = Number(datos.producto.cantidad);
            producto.precio = Number(datos.producto.precio);
            productoEnEdicionId = null;
            mensaje.textContent = datos.mensaje;
            renderProductos();
        } catch (error) {
            mensaje.textContent = error.message;
        }

        return;
    }

    if (action === 'delete') {
        const confirmado = window.confirm(`¿Deseas borrar el producto "${producto.nombre}"?`);

        if (!confirmado) {
            return;
        }

        try {
            const datos = await solicitar(apiUrl, {
                method: 'DELETE',
                body: JSON.stringify({ id: producto.id })
            });

            const indice = productos.findIndex((item) => item.id === producto.id);

            if (indice !== -1) {
                productos.splice(indice, 1);
            }

            if (productoEnEdicionId === producto.id) {
                productoEnEdicionId = null;
            }

            mensaje.textContent = datos.mensaje;
            renderProductos();
        } catch (error) {
            mensaje.textContent = error.message;
        }

        return;
    }

    if (action === 'decrease' && producto.cantidad === 0) {
        mensaje.textContent = `El producto "${producto.nombre}" ya no tiene stock disponible.`;
        return;
    }

    try {
        const datos = await solicitar(apiUrl, {
            method: 'PATCH',
            body: JSON.stringify({ id: producto.id, accion: action })
        });

        producto.cantidad = Number(datos.producto.cantidad);
        mensaje.textContent = action === 'increase'
            ? `Se aumento el stock de "${producto.nombre}".`
            : `Se disminuyo el stock de "${producto.nombre}".`;
        renderProductos();
    } catch (error) {
        mensaje.textContent = error.message;
    }
});

listaProductos.addEventListener('focusin', (event) => {
    const target = event.target;

    if (target instanceof HTMLInputElement && target.dataset.editField === 'precio') {
        limpiarCeroInput(target);
    }
});

listaProductos.addEventListener('focusout', (event) => {
    const target = event.target;

    if (target instanceof HTMLInputElement && target.dataset.editField === 'precio') {
        restaurarCeroInput(target);
    }
});

cargarProductos();