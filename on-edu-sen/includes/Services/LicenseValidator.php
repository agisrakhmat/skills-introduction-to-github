<?php
namespace Sentiliun\OnEduSen\Services;

use Sentiliun\OnEduSen\Utilities\Logger;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class LicenseValidator
 *
 * Menangani validasi lisensi ke server Master, dan cron job harian.
 */
class LicenseValidator {

	/**
	 * Mendaftarkan hooks WordPress terkait lisensi.
	 *
	 * @return void
	 */
	public function register_hooks() {
		// Hook ketika opsi lisensi di-update di Settings API
		add_action( 'update_option_snt_on_edu_sen_license_options', array( $this, 'on_license_updated' ), 10, 3 );
		add_action( 'add_option_snt_on_edu_sen_license_options', array( $this, 'on_license_added' ), 10, 2 );

		// Setup WP Cron
		add_action( 'snt_on_edu_sen_daily_license_check', array( $this, 'check_license_routine' ) );
		if ( ! wp_next_scheduled( 'snt_on_edu_sen_daily_license_check' ) ) {
			wp_schedule_event( time(), 'daily', 'snt_on_edu_sen_daily_license_check' );
		}
	}

	/**
	 * Dipanggil ketika opsi lisensi diupdate (edit nilai lama).
	 *
	 * @param mixed $old_value Nilai lama.
	 * @param mixed $value     Nilai baru.
	 * @param string $option   Nama opsi.
	 * @return void
	 */
	public function on_license_updated( $old_value, $value, $option ) {
		$this->trigger_immediate_validation( $value );
	}

	/**
	 * Dipanggil ketika opsi lisensi ditambahkan (pertama kali disimpan).
	 *
	 * @param string $option Nama opsi.
	 * @param mixed $value   Nilai yang disimpan.
	 * @return void
	 */
	public function on_license_added( $option, $value ) {
		$this->trigger_immediate_validation( $value );
	}

	/**
	 * Menjalankan validasi secara langsung.
	 *
	 * @param array $options Array opsi lisensi.
	 * @return void
	 */
	private function trigger_immediate_validation( $options ) {
		$license_key = isset( $options['license_key'] ) ? $options['license_key'] : '';
		$this->validate_license_to_server( $license_key );
	}

	/**
	 * Routine pengecekan lisensi harian via Cron.
	 *
	 * @return void
	 */
	public function check_license_routine() {
		$options = get_option( 'snt_on_edu_sen_license_options', array() );
		$license_key = isset( $options['license_key'] ) ? $options['license_key'] : '';

		$this->validate_license_to_server( $license_key );
	}

	/**
	 * Melakukan request ke master server untuk cek lisensi dan memperbarui status.
	 *
	 * @param string $license_key Key lisensi.
	 * @return void
	 */
	private function validate_license_to_server( $license_key ) {
		if ( empty( $license_key ) ) {
			update_option( 'snt_on_edu_sen_license_status', 'invalid' );
			return;
		}

		$endpoint = 'https://sentiliun.com/wp-json/snt-saas/v1/check-license';

		// Payload sesuai spesifikasi
		$payload = array(
			'license_key' => sanitize_text_field( $license_key ),
			'domain'      => home_url(),
		);

		$args = array(
			'body'        => wp_json_encode( $payload ),
			'headers'     => array(
				'Content-Type' => 'application/json',
			),
			'timeout'     => 15,
			'data_format' => 'body',
		);

		$response = wp_remote_post( $endpoint, $args );

		// Jika gagal melakukan HTTP request
		if ( is_wp_error( $response ) ) {
			Logger::send( 'license_check_http_error', $response->get_error_message() );
			// Tidak update status lisensi menjadi invalid hanya karena masalah jaringan (timeout dll)
			// Status biarkan seperti sebelumnya
			return;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = wp_remote_retrieve_body( $response );
		$data        = json_decode( $body, true );

		// Jika HTTP Code bukan 200 atau gagal parsing JSON
		if ( $status_code !== 200 || json_last_error() !== JSON_ERROR_NONE ) {
			Logger::send( 'license_check_server_error', 'HTTP Code: ' . $status_code . ' | Body: ' . wp_trim_words( $body, 20 ) );
			return;
		}

		// Asumsikan master server mengembalikan JSON sederhana:
		// Berhasil: {"success": true, "data": {"status": "active"}}
		// Gagal: {"success": false, "data": {"status": "expired"}}
		if ( isset( $data['success'] ) && $data['success'] === true ) {
			update_option( 'snt_on_edu_sen_license_status', 'active' );
		} else {
			// Simpan status expired atau invalid
			update_option( 'snt_on_edu_sen_license_status', 'expired' );
		}
	}
}
