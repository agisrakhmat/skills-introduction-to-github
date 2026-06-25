<?php
namespace Sentiliun\OnEduSen\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Settings
 *
 * Mengelola halaman pengaturan di wp-admin dan notifikasi lisensi persisten.
 */
class Settings {

	/**
	 * Mendaftarkan hooks terkait pengaturan admin.
	 *
	 * @return void
	 */
	public function register_hooks() {
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_notices', array( $this, 'display_license_notice' ) );
	}

	/**
	 * Menambahkan menu ke admin WordPress.
	 *
	 * @return void
	 */
	public function add_admin_menu() {
		add_options_page(
			'On Edu-Sen Settings',
			'On Edu-Sen',
			'manage_options',
			'on-edu-sen-settings',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Mendaftarkan seksi dan bidang-bidang pengaturan (Settings API).
	 *
	 * @return void
	 */
	public function register_settings() {
		// 1. Registrasi Section Lisensi
		register_setting( 'snt_on_edu_sen_settings_group', 'snt_on_edu_sen_license_options' );

		add_settings_section(
			'snt_on_edu_sen_license_section',
			'Lisensi Sistem',
			array( $this, 'render_license_section' ),
			'on-edu-sen-settings'
		);

		add_settings_field(
			'snt_on_edu_sen_license_key',
			'License Key',
			array( $this, 'render_license_key_field' ),
			'on-edu-sen-settings',
			'snt_on_edu_sen_license_section'
		);

		// 2. Registrasi Section Terminologi Dinamis
		register_setting( 'snt_on_edu_sen_settings_group', 'snt_on_edu_sen_terminology_options' );

		add_settings_section(
			'snt_on_edu_sen_terminology_section',
			'Terminologi Dinamis',
			array( $this, 'render_terminology_section' ),
			'on-edu-sen-settings'
		);

		// Daftar fields untuk terminologi
		$terminologies = array(
			'siswa' => 'Siswa',
			'guru'  => 'Guru',
			'kelas' => 'Kelas',
			'spp'   => 'SPP',
		);

		foreach ( $terminologies as $key => $label ) {
			add_settings_field(
				'snt_on_edu_sen_term_' . $key,
				$label . ' (Default)',
				array( $this, 'render_terminology_field' ),
				'on-edu-sen-settings',
				'snt_on_edu_sen_terminology_section',
				array(
					'key' => $key,
					'label' => $label,
				)
			);
		}
	}

	/**
	 * Render deskripsi seksi lisensi.
	 *
	 * @return void
	 */
	public function render_license_section() {
		echo '<p class="snt-admin__desc">Masukkan lisensi yang Anda peroleh dari Sentiliun untuk mengaktifkan sistem On Edu-Sen.</p>';
	}

	/**
	 * Render field License Key.
	 *
	 * @return void
	 */
	public function render_license_key_field() {
		$options = get_option( 'snt_on_edu_sen_license_options' );
		$value   = isset( $options['license_key'] ) ? $options['license_key'] : '';

		printf(
			'<input type="text" class="regular-text snt-admin__input" name="snt_on_edu_sen_license_options[license_key]" value="%s" placeholder="Masukkan license key...">',
			esc_attr( $value )
		);
	}

	/**
	 * Render deskripsi seksi terminologi.
	 *
	 * @return void
	 */
	public function render_terminology_section() {
		echo '<p class="snt-admin__desc">Ubah label sistem agar sesuai dengan istilah di institusi Anda. Jika dibiarkan kosong, sistem akan menggunakan label default.</p>';
	}

	/**
	 * Render field spesifik untuk terminologi.
	 *
	 * @param array $args Parameter field.
	 * @return void
	 */
	public function render_terminology_field( $args ) {
		$key     = $args['key'];
		$options = get_option( 'snt_on_edu_sen_terminology_options' );
		$value   = isset( $options[ $key ] ) ? $options[ $key ] : '';

		printf(
			'<input type="text" class="regular-text snt-admin__input" name="snt_on_edu_sen_terminology_options[%s]" value="%s" placeholder="Label kustom untuk %s...">',
			esc_attr( $key ),
			esc_attr( $value ),
			esc_attr( $args['label'] )
		);
	}

	/**
	 * Menampilkan halaman utama pengaturan.
	 *
	 * @return void
	 */
	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		?>
		<div class="wrap snt-admin__wrap">
			<h1 class="snt-admin__title">Pengaturan On Edu-Sen</h1>
			<form action="options.php" method="post" class="snt-admin__form">
				<?php
				settings_fields( 'snt_on_edu_sen_settings_group' );
				do_settings_sections( 'on-edu-sen-settings' );
				submit_button( 'Simpan & Validasi' );
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Menampilkan Admin Notice merah persisten jika lisensi tidak valid/kadaluarsa.
	 *
	 * @return void
	 */
	public function display_license_notice() {
		$status = get_option( 'snt_on_edu_sen_license_status', 'invalid' );

		if ( 'active' !== $status ) {
			// Perhatikan penggunaan format notice-error untuk mendapatkan styling merah,
			// namun tanpa notice-dismissible agar tidak dapat di-close (persisten).
			// Diikuti dengan class BEM snt-admin__notice.
			?>
			<div class="notice notice-error snt-admin__notice">
				<p><strong>Lisensi Sistem On Edu-Sen Kadaluarsa. Fitur dihentikan sementara. Silakan hubungi Sentiliun.</strong></p>
			</div>
			<?php
		}
	}
}
