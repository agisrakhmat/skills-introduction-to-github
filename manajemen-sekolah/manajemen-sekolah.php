<?php
/**
 * Plugin Name: Manajemen Sekolah & Bimbel
 * Plugin URI:  #
 * Description: Sistem terintegrasi untuk manajemen kesiswaan, HR (Rekrutmen), keuangan (Tagihan), dan admisi (PPDB).
 * Version:     1.3.0
 * Author:      Lu & Tim
 * Text Domain: manajemen-sekolah
 */

// Keamanan dasar
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * -----------------------------------------------------------------------------
 * 1. SETUP USER ROLES & ACTIVATION
 * -----------------------------------------------------------------------------
 */
function sekolah_aktivasi_plugin() {
    // Tambah Role khusus agar tidak bentrok dengan core WordPress
    add_role( 'manajemen', 'Manajemen', [
        'read'         => true,
        'edit_posts'   => true,
        'delete_posts' => true,
        'upload_files' => true,
    ]);

    add_role( 'pegawai', 'Pegawai', [
        'read' => true,
    ]);

    add_role( 'murid', 'Murid', [
        'read' => true,
    ]);

    sekolah_register_all_cpts();
    flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'sekolah_aktivasi_plugin' );

/**
 * -----------------------------------------------------------------------------
 * 2. REGISTRASI CUSTOM POST TYPES (CPT)
 * -----------------------------------------------------------------------------
 */
function sekolah_register_all_cpts() {
    $cpts = [
        'siswa'     => ['label' => 'Data Siswa', 'icon' => 'dashicons-welcome-learn-more', 'pos' => 20],
        'pegawai'   => ['label' => 'Data Pegawai', 'icon' => 'dashicons-businessman', 'pos' => 21],
        'kelas'     => ['label' => 'Kelas & Program', 'icon' => 'dashicons-networking', 'pos' => 22],
        'admisi'    => ['label' => 'Admisi (PPDB)', 'icon' => 'dashicons-id', 'pos' => 23],
        'rekrutmen' => ['label' => 'Rekrutmen', 'icon' => 'dashicons-portfolio', 'pos' => 24],
        'tagihan'   => ['label' => 'Tagihan & SPP', 'icon' => 'dashicons-cart', 'pos' => 25],
    ];

    foreach ($cpts as $slug => $args) {
        register_post_type($slug, [
            'labels'      => ['name' => $args['label'], 'singular_name' => $args['label']],
            'public'      => false,
            'show_ui'     => true,
            'supports'    => ['title', 'custom-fields', 'editor', 'thumbnail'],
            'menu_icon'   => $args['icon'],
            'menu_position' => $args['pos'],
        ]);
    }
}
add_action('init', 'sekolah_register_all_cpts');

/**
 * -----------------------------------------------------------------------------
 * 3. SHARED STYLES (Inline CSS untuk Elementor Compatibility)
 * -----------------------------------------------------------------------------
 */
function sekolah_form_styles() {
    ?>
    <style>
        .sekolah-card { max-width: 100%; padding: 30px; border: 1px solid #e2e8f0; border-radius: 15px; background: #ffffff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); font-family: sans-serif; margin: 15px 0; }
        .sekolah-card h3 { margin: 0 0 20px 0; color: #1e293b; font-size: 1.25rem; font-weight: 700; border-left: 4px solid #2563eb; padding-left: 15px; }
        .sekolah-field { margin-bottom: 20px; }
        .sekolah-field label { display: block; font-weight: 600; margin-bottom: 8px; color: #475569; font-size: 0.9rem; }
        .sekolah-field input, .sekolah-field textarea, .sekolah-field select { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; transition: border 0.3s ease; }
        .sekolah-field input:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .sekolah-btn { background: #2563eb; color: #ffffff; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-weight: 700; width: 100%; font-size: 1rem; transition: background 0.3s ease; }
        .sekolah-btn:hover { background: #1d4ed8; }
        .sekolah-msg { margin-top: 15px; padding: 12px; border-radius: 8px; display: none; font-size: 0.9rem; text-align: center; }
    </style>
    <?php
}

/**
 * -----------------------------------------------------------------------------
 * 4. SHORTCODES & AJAX HANDLERS
 * -----------------------------------------------------------------------------
 */

// Universal Form Renderer
function sekolah_render_form($type, $title) {
    sekolah_form_styles();
    ob_start(); ?>
    <div class="sekolah-card">
        <h3><?php echo esc_html($title); ?></h3>
        <form class="sekolah-ajax-form" data-type="<?php echo esc_attr($type); ?>">
            <div class="sekolah-field"><label>Nama Lengkap</label><input type="text" name="nama" required></div>
            <div class="sekolah-field"><label>Email</label><input type="email" name="email" required></div>
            <div class="sekolah-field"><label>Nomor WhatsApp</label><input type="text" name="wa" required></div>
            <?php if($type === 'rekrutmen'): ?>
                <div class="sekolah-field"><label>Posisi yang Dilamar</label><input type="text" name="posisi" required></div>
            <?php endif; ?>
            <div class="sekolah-field"><label>Pesan/Catatan Tambahan</label><textarea name="pesan" rows="3"></textarea></div>
            <?php wp_nonce_field('sekolah_action', 'sekolah_nonce'); ?>
            <button type="submit" class="sekolah-btn">Kirim Sekarang</button>
        </form>
        <div class="sekolah-msg"></div>
    </div>

    <script>
    jQuery(document).ready(function($) {
        $('.sekolah-ajax-form').on('submit', function(e) {
            e.preventDefault();
            const $form = $(this);
            const $msg = $form.siblings('.sekolah-msg');
            const type = $form.data('type');

            $msg.hide().css('background', '#f1f5f9').css('color', '#475569').text('Sedang memproses...').fadeIn();

            const formData = new FormData(this);
            formData.append('action', 'sekolah_handle_submission');
            formData.append('form_type', type);

            fetch('<?php echo admin_url('admin-ajax.php'); ?>', { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => {
                if(data.success) {
                    $msg.css('background', '#dcfce7').css('color', '#166534').text('Berhasil! Data Anda telah kami terima.');
                    $form[0].reset();
                } else {
                    $msg.css('background', '#fee2e2').css('color', '#991b1b').text('Gagal: ' + data.data);
                }
            });
        });
    });
    </script>
    <?php return ob_get_clean();
}

add_shortcode('sekolah_form_admisi', function() { return sekolah_render_form('admisi', 'Pendaftaran Siswa Baru'); });
add_shortcode('sekolah_form_rekrutmen', function() { return sekolah_render_form('rekrutmen', 'Formulir Lamaran Kerja'); });

// AJAX Backend Handler
add_action('wp_ajax_sekolah_handle_submission', 'sekolah_process_form');
add_action('wp_ajax_nopriv_sekolah_handle_submission', 'sekolah_process_form');

function sekolah_process_form() {
    check_ajax_referer('sekolah_action', 'sekolah_nonce');

    $type = sanitize_text_field($_POST['form_type']);

    // Keamanan: Pastikan hanya tipe form yang diizinkan yang dapat diproses
    $allowed_types = ['admisi', 'rekrutmen'];
    if (!in_array($type, $allowed_types)) {
        wp_send_json_error('Tipe form tidak valid.');
        return;
    }

    $nama = sanitize_text_field($_POST['nama']);

    $post_id = wp_insert_post([
        'post_title'  => $nama,
        'post_type'   => $type,
        'post_status' => 'publish'
    ]);

    if($post_id) {
        update_post_meta($post_id, '_email', sanitize_email($_POST['email']));
        update_post_meta($post_id, '_wa', sanitize_text_field($_POST['wa']));
        update_post_meta($post_id, '_pesan', sanitize_textarea_field($_POST['pesan']));
        if(isset($_POST['posisi'])) update_post_meta($post_id, '_posisi', sanitize_text_field($_POST['posisi']));

        wp_send_json_success();
    }
    wp_send_json_error('Gagal menyimpan data ke server.');
}

/**
 * -----------------------------------------------------------------------------
 * 5. MODUL KEUANGAN (META BOX)
 * -----------------------------------------------------------------------------
 */
add_action('add_meta_boxes', function() {
    add_meta_box('sekolah_finance_box', 'Detail Tagihan', function($post) {
        // Tambahkan nonce untuk keamanan meta box
        wp_nonce_field('sekolah_finance_action', 'sekolah_finance_nonce');

        $nominal = get_post_meta($post->ID, '_nominal', true);
        $status  = get_post_meta($post->ID, '_status', true);
        ?>
        <div style="padding:10px;">
            <p><strong>Nominal Tagihan (IDR):</strong></p>
            <input type="number" name="nominal" value="<?php echo esc_attr($nominal); ?>" style="width:100%; padding:8px;">
            <p><strong>Status Pembayaran:</strong></p>
            <select name="status" style="width:100%; padding:8px;">
                <option value="unpaid" <?php selected($status, 'unpaid'); ?>>Belum Lunas</option>
                <option value="paid" <?php selected($status, 'paid'); ?>>Lunas</option>
            </select>
        </div>
        <?php
    }, 'tagihan', 'side');
});

add_action('save_post_tagihan', function($post_id) {
    // Keamanan: Cek nonce
    if (!isset($_POST['sekolah_finance_nonce']) || !wp_verify_nonce($_POST['sekolah_finance_nonce'], 'sekolah_finance_action')) {
        return;
    }

    // Hindari penyimpanan otomatis dari wp
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    // Keamanan: Cek izin user
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    if(isset($_POST['nominal'])) update_post_meta($post_id, '_nominal', sanitize_text_field($_POST['nominal']));
    if(isset($_POST['status'])) update_post_meta($post_id, '_status', sanitize_text_field($_POST['status']));
});
