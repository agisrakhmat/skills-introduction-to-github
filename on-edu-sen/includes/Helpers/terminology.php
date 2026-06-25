<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'snt_get_label' ) ) {
	/**
	 * Mengambil label dinamis terminologi.
	 *
	 * Jika nilai opsi kustom belum di-set di halaman Settings, fungsi ini
	 * mengembalikan nilai bawaan (default).
	 *
	 * @param string $key Kunci label terminologi (contoh: 'siswa', 'guru', 'kelas', 'spp').
	 * @return string Label terminologi.
	 */
	function snt_get_label( $key ) {
		// Daftar default term
		$defaults = array(
			'siswa' => 'Siswa',
			'guru'  => 'Guru',
			'kelas' => 'Kelas',
			'spp'   => 'SPP',
		);

		// Ambil pengaturan opsi dari database
		$options = get_option( 'snt_on_edu_sen_terminology_options' );

		// Jika label kustom ada dan tidak kosong, gunakan itu
		if ( isset( $options[ $key ] ) && ! empty( trim( $options[ $key ] ) ) ) {
			return trim( $options[ $key ] );
		}

		// Kembalikan default jika kustom tidak ditemukan
		if ( isset( $defaults[ $key ] ) ) {
			return $defaults[ $key ];
		}

		return ucfirst( $key );
	}
}
