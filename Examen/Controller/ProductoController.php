<?php

require_once __DIR__ . '/../Model/Conexion.php';

class ProductoController
{
    private const TABLA = 'producto';

    private \PDO $conexion;

    public function __construct()
    {
        $this->conexion = \Conexion::obtenerConexion();
        $this->crearTablaSiNoExiste();
    }

    public function manejarSolicitud(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

            if ($metodo === 'GET') {
                $this->responder([
                    'ok' => true,
                    'productos' => $this->listarProductos(),
                ]);
                return;
            }

            $datos = $this->obtenerCuerpoJson();

            if ($metodo === 'POST') {
                $producto = $this->crearProducto($datos);

                $this->responder([
                    'ok' => true,
                    'mensaje' => 'Producto agregado correctamente.',
                    'producto' => $producto,
                ], 201);
                return;
            }

            if ($metodo === 'PATCH') {
                $producto = $this->actualizarCantidad($datos);

                $this->responder([
                    'ok' => true,
                    'mensaje' => 'Cantidad actualizada correctamente.',
                    'producto' => $producto,
                ]);
                return;
            }

            if ($metodo === 'PUT') {
                $producto = $this->editarProducto($datos);

                $this->responder([
                    'ok' => true,
                    'mensaje' => 'Producto actualizado correctamente.',
                    'producto' => $producto,
                ]);
                return;
            }

            if ($metodo === 'DELETE') {
                $this->eliminarProducto($datos);

                $this->responder([
                    'ok' => true,
                    'mensaje' => 'Producto eliminado correctamente.',
                ]);
                return;
            }

            $this->responder([
                'ok' => false,
                'mensaje' => 'Metodo no permitido.',
            ], 405);
        } catch (\Throwable $error) {
            $codigo = $error instanceof \InvalidArgumentException ? 422 : 500;

            $this->responder([
                'ok' => false,
                'mensaje' => $error->getMessage(),
            ], $codigo);
        }
    }

    public function listarProductos(): array
    {
        $consulta = $this->conexion->query(
            'SELECT id, nombre, cantidad, precio FROM ' . self::TABLA . ' ORDER BY id ASC'
        );

        return $consulta->fetchAll();
    }

    public function crearProducto(array $datos): array
    {
        $nombre = trim((string) ($datos['nombre'] ?? ''));
        $cantidad = filter_var($datos['cantidad'] ?? null, FILTER_VALIDATE_INT);
        $precio = filter_var($datos['precio'] ?? null, FILTER_VALIDATE_FLOAT);

        if ($nombre === '') {
            throw new \InvalidArgumentException('Escribe un nombre valido para el producto.');
        }

        if ($cantidad === false || $cantidad < 1) {
            throw new \InvalidArgumentException('La cantidad debe ser un numero igual o mayor a 1.');
        }

        if ($precio === false || $precio < 0) {
            throw new \InvalidArgumentException('El precio debe ser un numero igual o mayor a 0.');
        }

        $sentencia = $this->conexion->prepare(
            'INSERT INTO ' . self::TABLA . ' (nombre, cantidad, precio) VALUES (:nombre, :cantidad, :precio)'
        );
        $sentencia->execute([
            'nombre' => $nombre,
            'cantidad' => $cantidad,
            'precio' => $precio,
        ]);

        return [
            'id' => (int) $this->conexion->lastInsertId(),
            'nombre' => $nombre,
            'cantidad' => $cantidad,
            'precio' => (float) $precio,
        ];
    }

    public function actualizarCantidad(array $datos): array
    {
        $id = filter_var($datos['id'] ?? null, FILTER_VALIDATE_INT);
        $accion = (string) ($datos['accion'] ?? '');

        if ($id === false || $id < 1) {
            throw new \InvalidArgumentException('El producto indicado no es valido.');
        }

        if (!in_array($accion, ['increase', 'decrease'], true)) {
            throw new \InvalidArgumentException('La accion indicada no es valida.');
        }

        $producto = $this->buscarProductoPorId($id);

        if (!$producto) {
            throw new \InvalidArgumentException('No se encontro el producto solicitado.');
        }

        $cantidadActual = (int) $producto['cantidad'];
        $nuevaCantidad = $accion === 'increase' ? $cantidadActual + 1 : max(0, $cantidadActual - 1);

        $sentencia = $this->conexion->prepare(
            'UPDATE ' . self::TABLA . ' SET cantidad = :cantidad WHERE id = :id'
        );
        $sentencia->execute([
            'cantidad' => $nuevaCantidad,
            'id' => $id,
        ]);

        return [
            'id' => (int) $producto['id'],
            'nombre' => $producto['nombre'],
            'cantidad' => $nuevaCantidad,
            'precio' => (float) $producto['precio'],
        ];
    }

    public function editarProducto(array $datos): array
    {
        $id = filter_var($datos['id'] ?? null, FILTER_VALIDATE_INT);
        $nombre = trim((string) ($datos['nombre'] ?? ''));
        $cantidad = filter_var($datos['cantidad'] ?? null, FILTER_VALIDATE_INT);
        $precio = filter_var($datos['precio'] ?? null, FILTER_VALIDATE_FLOAT);

        if ($id === false || $id < 1) {
            throw new \InvalidArgumentException('El producto indicado no es valido.');
        }

        if ($nombre === '') {
            throw new \InvalidArgumentException('Escribe un nombre valido para el producto.');
        }

        if ($cantidad === false || $cantidad < 0) {
            throw new \InvalidArgumentException('La cantidad debe ser un numero igual o mayor a 0.');
        }

        if ($precio === false || $precio < 0) {
            throw new \InvalidArgumentException('El precio debe ser un numero igual o mayor a 0.');
        }

        if (!$this->buscarProductoPorId($id)) {
            throw new \InvalidArgumentException('No se encontro el producto solicitado.');
        }

        $sentencia = $this->conexion->prepare(
            'UPDATE ' . self::TABLA . ' SET nombre = :nombre, cantidad = :cantidad, precio = :precio WHERE id = :id'
        );
        $sentencia->execute([
            'id' => $id,
            'nombre' => $nombre,
            'cantidad' => $cantidad,
            'precio' => $precio,
        ]);

        return [
            'id' => $id,
            'nombre' => $nombre,
            'cantidad' => $cantidad,
            'precio' => (float) $precio,
        ];
    }

    public function eliminarProducto(array $datos): void
    {
        $id = filter_var($datos['id'] ?? null, FILTER_VALIDATE_INT);

        if ($id === false || $id < 1) {
            throw new \InvalidArgumentException('El producto indicado no es valido.');
        }

        if (!$this->buscarProductoPorId($id)) {
            throw new \InvalidArgumentException('No se encontro el producto solicitado.');
        }

        $sentencia = $this->conexion->prepare('DELETE FROM ' . self::TABLA . ' WHERE id = :id');
        $sentencia->execute(['id' => $id]);
    }

    private function buscarProductoPorId(int $id): ?array
    {
        $sentencia = $this->conexion->prepare(
            'SELECT id, nombre, cantidad, precio FROM ' . self::TABLA . ' WHERE id = :id LIMIT 1'
        );
        $sentencia->execute(['id' => $id]);

        $producto = $sentencia->fetch();

        return $producto ?: null;
    }

    private function crearTablaSiNoExiste(): void
    {
        $this->conexion->exec(
            'CREATE TABLE IF NOT EXISTS ' . self::TABLA . ' (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(120) NOT NULL,
                cantidad INT NOT NULL DEFAULT 0,
                precio DECIMAL(10,2) NOT NULL DEFAULT 0,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );
    }

    private function obtenerCuerpoJson(): array
    {
        $contenido = file_get_contents('php://input');

        if ($contenido === false || trim($contenido) === '') {
            return [];
        }

        $datos = json_decode($contenido, true);

        if (!is_array($datos)) {
            throw new \InvalidArgumentException('No se pudo leer la solicitud enviada.');
        }

        return $datos;
    }

    private function responder(array $datos, int $estado = 200): void
    {
        http_response_code($estado);
        echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    }
}

$controlador = new ProductoController();
$controlador->manejarSolicitud();