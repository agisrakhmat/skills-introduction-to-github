<?php
namespace Sentiliun\OnEduSen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Autoloader
 *
 * Menangani autoloading untuk namespace Sentiliun\OnEduSen.
 */
class Autoloader {

	/**
	 * Mendaftarkan autoloader menggunakan spl_autoload_register.
	 *
	 * @return void
	 */
	public static function register() {
		spl_autoload_register( array( __CLASS__, 'autoload' ) );
	}

	/**
	 * Memuat file class secara dinamis.
	 *
	 * @param string $class Nama class lengkap beserta namespacenya.
	 * @return void
	 */
	public static function autoload( $class ) {
		// Prefix namespace khusus untuk plugin ini
		$prefix = 'Sentiliun\\OnEduSen\\';

		// Base directory untuk file-file class
		$base_dir = plugin_dir_path( __DIR__ ) . 'includes/';

		// Periksa apakah class menggunakan prefix namespace plugin
		$len = strlen( $prefix );
		if ( strncmp( $prefix, $class, $len ) !== 0 ) {
			// Tidak, lanjutkan ke autoloader lain terdaftar
			return;
		}

		// Ambil nama class relatif
		$relative_class = substr( $class, $len );

		// Ubah separator namespace menjadi direktori separator, tambah .php
		$file = $base_dir . str_replace( '\\', '/', $relative_class ) . '.php';

		// Jika file ada, require
		if ( file_exists( $file ) ) {
			require $file;
		}
	}
}
