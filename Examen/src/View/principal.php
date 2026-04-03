<!DOCTYPE html>
<html lang="es">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Control de Stock</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="src/css/productos.css">
</head>
<body>
	<main class="app-shell">
		<section class="hero-panel">
			<div class="hero-copy">
				<span class="eyebrow">Inventario simple</span>
				<h1>Agrega productos y controla su stock en una sola pantalla.</h1>
				<p>
					Registra un producto con su cantidad inicial y ajusta el stock con botones para aumentar o disminuir en tiempo real.
				</p>
			</div>

			<div class="stats-grid" id="statsGrid">
				<article class="stat-card accent-cyan">
					<span>Total productos</span>
					<strong id="totalProductos">0</strong>
				</article>
				<article class="stat-card accent-gold">
					<span>Cantidad acumulada</span>
					<strong id="stockAcumulado">0</strong>
				</article>
				<article class="stat-card accent-coral">
					<span>Stock bajo</span>
					<strong id="stockBajo">0</strong>
				</article>
			</div>
		</section>

		<section class="workspace-panel">
			<div class="form-card">
				<div class="section-heading">
					<span class="section-kicker">Nuevo producto</span>
					<h2>Registrar producto</h2>
				</div>

				<form id="productoForm" class="product-form">
					<label>
						<span>Nombre del producto</span>
						<input type="text" id="nombre" name="nombre" placeholder="Ej. Teclado mecánico" required>
					</label>

					<label>
						<span>Cantidad</span>
						<input type="number" id="cantidad" name="cantidad" min="0" value="0" required>
					</label>

					<label>
						<span>Precio</span>
						<div class="price-input">
							<span class="price-prefix">S/</span>
							<input type="number" id="precio" name="precio" min="0" step="0.01" value="0" required>
						</div>
					</label>

					<button type="submit" class="primary-btn">Agregar producto</button>
				</form>

				<p id="mensaje" class="status-message" aria-live="polite"></p>
			</div>

			<div class="list-card">
				<div class="section-heading">
					<span class="section-kicker">Inventario actual</span>
					<h2>Productos registrados</h2>
				</div>

				<div id="avisoStock" class="stock-alerts" aria-live="polite">
					<p class="stock-alert-empty">No hay alertas de stock bajo en este momento.</p>
				</div>

				<div id="listaProductos" class="table-container">
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
				</div>
			</div>
		</section>
	</main>

	<script src="src/js/productos.js"></script>
</body>
</html>
