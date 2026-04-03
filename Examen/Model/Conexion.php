<?php

class Conexion
{
	private const HOST = '127.0.0.1';
	private const DBNAME = 'producto';
	private const USER = 'root';
	private const PASSWORD = '';

	private static ?PDO $conexion = null;

	public static function obtenerConexion(): PDO
	{
		if (self::$conexion instanceof PDO) {
			return self::$conexion;
		}

		$dsn = 'mysql:host=' . self::HOST . ';dbname=' . self::DBNAME . ';charset=utf8mb4';

		self::$conexion = new PDO($dsn, self::USER, self::PASSWORD, [
			PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
			PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		]);

		return self::$conexion;
	}
}
