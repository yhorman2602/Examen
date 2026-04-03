// ===== Storage Key =====
const STORAGE_KEY = 'inventario_productos';

// ===== State =====
let products = loadProducts();
let editingId = null;
let deleteTargetId = null;

// ===== DOM References =====
const form = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const productIdInput = document.getElementById('product-id');
const nameInput = document.getElementById('product-name');
const categoryInput = document.getElementById('product-category');
const priceInput = document.getElementById('product-price');
const quantityInput = document.getElementById('product-quantity');
const descriptionInput = document.getElementById('product-description');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const sortBy = document.getElementById('sort-by');
const productsBody = document.getElementById('products-body');
const emptyState = document.getElementById('empty-state');
const productsTable = document.getElementById('products-table');
const productsCount = document.getElementById('products-count');
const modalOverlay = document.getElementById('modal-overlay');
const modalProductName = document.getElementById('modal-product-name');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const toast = document.getElementById('toast');

// ===== Storage =====
function loadProducts() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : getSampleProducts();
    } catch {
        return getSampleProducts();
    }
}

function saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function getSampleProducts() {
    return [
        { id: 1, name: 'Martillo de carpintero', category: 'Herramientas', price: 35000, quantity: 25, description: 'Martillo con mango de madera, 500g' },
        { id: 2, name: 'Tornillos 1/4 pulgada', category: 'Materiales', price: 150, quantity: 500, description: 'Caja de 100 unidades' },
        { id: 3, name: 'Cable eléctrico 2.5mm', category: 'Electrónica', price: 8500, quantity: 8, description: 'Metro lineal, calibre 14' },
        { id: 4, name: 'Pintura blanca 1 galón', category: 'Materiales', price: 45000, quantity: 0, description: 'Pintura látex interior/exterior' },
        { id: 5, name: 'Taladro inalámbrico', category: 'Herramientas', price: 185000, quantity: 12, description: '18V, con maletín y brocas' },
    ];
}

// ===== Utilities =====
function generateId() {
    return Date.now();
}

function formatPrice(price) {
    return '$' + Number(price).toLocaleString('es-CO');
}

function getStockStatus(quantity) {
    if (quantity === 0) return { label: 'Sin stock', cls: 'status-empty' };
    if (quantity < 10) return { label: 'Stock bajo', cls: 'status-low' };
    return { label: 'Disponible', cls: 'status-ok' };
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ===== Stats =====
function updateStats() {
    const total = products.length;
    const totalStock = products.reduce((sum, p) => sum + Number(p.quantity), 0);
    const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);
    const lowStock = products.filter(p => Number(p.quantity) < 10).length;

    document.getElementById('total-products').textContent = total;
    document.getElementById('total-stock').textContent = totalStock.toLocaleString('es-CO');
    document.getElementById('total-value').textContent = formatPrice(totalValue);
    document.getElementById('low-stock').textContent = lowStock;

    const lowStockCard = document.getElementById('low-stock-card');
    lowStockCard.classList.toggle('warning', lowStock > 0);
}

// ===== Render Table =====
function getFilteredProducts() {
    const query = searchInput.value.toLowerCase().trim();
    const catFilter = filterCategory.value;
    const sort = sortBy.value;

    let filtered = products.filter(p => {
        const matchSearch = !query ||
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query));
        const matchCat = !catFilter || p.category === catFilter;
        return matchSearch && matchCat;
    });

    filtered.sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name, 'es');
        if (sort === 'category') return a.category.localeCompare(b.category, 'es');
        if (sort === 'price') return Number(a.price) - Number(b.price);
        if (sort === 'quantity') return Number(b.quantity) - Number(a.quantity);
        return 0;
    });

    return filtered;
}

function renderTable() {
    const filtered = getFilteredProducts();
    productsCount.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
        productsTable.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.querySelector('p').textContent = products.length === 0
            ? 'No hay productos registrados'
            : 'No se encontraron productos con ese filtro';
        return;
    }

    productsTable.classList.remove('hidden');
    emptyState.classList.add('hidden');

    productsBody.innerHTML = filtered.map((p, index) => {
        const status = getStockStatus(Number(p.quantity));
        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="product-name">${escapeHtml(p.name)}</div>
                    ${p.description ? `<div class="product-desc">${escapeHtml(p.description)}</div>` : ''}
                </td>
                <td><span class="category-badge">${escapeHtml(p.category)}</span></td>
                <td>${formatPrice(p.price)}</td>
                <td>${Number(p.quantity).toLocaleString('es-CO')}</td>
                <td><span class="status-badge ${status.cls}">${status.label}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-edit" onclick="startEdit(${p.id})" title="Editar">✏️ Editar</button>
                        <button class="btn btn-delete" onclick="confirmDelete(${p.id})" title="Eliminar">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

// ===== Form =====
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const price = parseFloat(priceInput.value);
    const quantity = parseInt(quantityInput.value, 10);
    const description = descriptionInput.value.trim();

    if (!name || !category || isNaN(price) || isNaN(quantity)) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    if (editingId !== null) {
        const idx = products.findIndex(p => p.id === editingId);
        if (idx !== -1) {
            products[idx] = { id: editingId, name, category, price, quantity, description };
        }
        showToast('✅ Producto actualizado correctamente');
        stopEdit();
    } else {
        products.push({ id: generateId(), name, category, price, quantity, description });
        showToast('✅ Producto agregado correctamente');
        form.reset();
    }

    saveProducts();
    updateStats();
    renderTable();
});

cancelBtn.addEventListener('click', stopEdit);

function startEdit(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingId = id;
    productIdInput.value = id;
    nameInput.value = product.name;
    categoryInput.value = product.category;
    priceInput.value = product.price;
    quantityInput.value = product.quantity;
    descriptionInput.value = product.description || '';

    formTitle.textContent = '✏️ Editar Producto';
    submitBtn.innerHTML = '<span>💾</span> Guardar Cambios';
    cancelBtn.classList.remove('hidden');

    formTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function stopEdit() {
    editingId = null;
    form.reset();
    formTitle.textContent = 'Agregar Producto';
    submitBtn.innerHTML = '<span>➕</span> Agregar Producto';
    cancelBtn.classList.add('hidden');
}

// ===== Delete =====
function confirmDelete(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    deleteTargetId = id;
    modalProductName.textContent = product.name;
    modalOverlay.classList.remove('hidden');
}

confirmDeleteBtn.addEventListener('click', () => {
    if (deleteTargetId === null) return;
    const product = products.find(p => p.id === deleteTargetId);
    products = products.filter(p => p.id !== deleteTargetId);
    deleteTargetId = null;
    modalOverlay.classList.add('hidden');
    saveProducts();
    updateStats();
    renderTable();
    if (product) showToast(`🗑️ "${product.name}" eliminado`, 'warning');
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteTargetId = null;
    modalOverlay.classList.add('hidden');
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        deleteTargetId = null;
        modalOverlay.classList.add('hidden');
    }
});

// ===== Filters =====
searchInput.addEventListener('input', renderTable);
filterCategory.addEventListener('change', renderTable);
sortBy.addEventListener('change', renderTable);

// ===== Init =====
updateStats();
renderTable();
