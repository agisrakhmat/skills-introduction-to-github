<?php
namespace Sentiliun\OnEduSen\Utilities;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Logger
 *
 * Mengelola pengiriman log error/telemetri ke Master Server Sentiliun.
 */
class Logger {

	/**
	 * Mengirim payload error ke endpoint log master server.
	 *
	 * @param string $code    Kode error atau identifikasi sumber error.
	 * @param string $message Pesan detail error.
	 * @return void
	 */
	public static function send( $code, $message ) {
		$endpoint = 'https://sentiliun.com/wp-json/snt-saas/v1/log-error';

		$payload = array(
			'domain'  => home_url(),
			'code'    => $code,
			'message' => $message,
			'time'    => current_time( 'mysql' ),
		);

		$args = array(
			'body'        => wp_json_encode( $payload ),
			'headers'     => array(
				'Content-Type' => 'application/json',
			),
			'timeout'     => 15,
			'data_format' => 'body',
		);

		// Non-blocking request (fire and forget as it's an error logger)
		// Or blocking if we really want to wait, but usually for logs fire-and-forget is safer
		// Here we'll use standard wp_remote_post
		wp_remote_post( $endpoint, $args );
	}
}
