<?php
/**
 * Plugin Name: On Edu-Sen
 * Description: WaaS Plugin berskala enterprise untuk institusi pendidikan online.
 * Version: 1.0.0
 * Author: Sentiliun Developer Team
 * Text Domain: on-edu-sen
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// 1. Require Autoloader
require_once plugin_dir_path( __FILE__ ) . 'includes/Autoloader.php';
\Sentiliun\OnEduSen\Autoloader::register();

// 2. Require Global Helpers
require_once plugin_dir_path( __FILE__ ) . 'includes/Helpers/terminology.php';

// 3. Initialize the plugin
function snt_on_edu_sen_init() {
	// Inisialisasi Settings & Admin
	if ( is_admin() ) {
		$settings = new \Sentiliun\OnEduSen\Admin\Settings();
		$settings->register_hooks();
	}

	// Inisialisasi Service License Validator
	$license_validator = new \Sentiliun\OnEduSen\Services\LicenseValidator();
	$license_validator->register_hooks();
}

add_action( 'plugins_loaded', 'snt_on_edu_sen_init' );
