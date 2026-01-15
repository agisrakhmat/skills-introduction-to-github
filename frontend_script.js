<script>
    // --- KONFIGURASI URL GAS ---
    // GANTI URL DI BAWAH DENGAN URL WEB APP YANG ANDA DAPAT DARI GOOGLE APPS SCRIPT
    const GOOGLE_SCRIPT_URL = 'PASTE_URL_WEB_APP_GAS_DISINI';

    function handleSearch(event) {
        event.preventDefault();
        const nim = document.getElementById('nim').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const btn = document.getElementById('sp-submit-btn');
        const loading = document.getElementById('sp-loading');

        if(!nim || !phone) {
            alert("Harap isi NIM dan Nomor Telepon!");
            return;
        }

        btn.disabled = true; btn.innerText = 'Memproses...';
        loading.style.display = 'block';

        // --- REAL FETCH ---
        const finalUrl = `${GOOGLE_SCRIPT_URL}?nim=${encodeURIComponent(nim)}&phone=${encodeURIComponent(phone)}`;

        fetch(finalUrl)
            .then(response => response.json())
            .then(json => {
                loading.style.display = 'none';
                btn.disabled = false; btn.innerText = 'Cek Data';

                if (json.status === 'success') {
                    renderModal(json);
                } else {
                    // Jika status error, tampilkan Modal Error
                    renderError(json.message || 'Maaf NIM atau Nomor telepon tidak terdaftar, mohon cek kembali data anda');
                }
            })
            .catch(err => {
                loading.style.display = 'none';
                btn.disabled = false; btn.innerText = 'Cek Data';
                console.error(err);
                renderError('Terjadi kesalahan koneksi server. Pastikan URL Script benar.');
            });
    }

    function renderModal(response) {
        const data = response.data;

        // Isi Data Header
        document.getElementById('res-nim').innerText = data.nim || '-';
        document.getElementById('res-nama').innerText = data.nama || '-';
        document.getElementById('res-prodi').innerText = data.program_pembelajaran || '-';
        document.getElementById('res-upbjj').innerText = data.angkatan || '-'; // Mapping Angkatan ke UPBJJ placeholder
        document.getElementById('res-alamat').innerText = data.alamat || '-';
        document.getElementById('res-ttl').innerText = data.ttl || '-';

        // Isi Tabel
        const tbody = document.getElementById('sp-table-body');
        tbody.innerHTML = '';

        if (data.nilai && data.nilai.length > 0) {
            data.nilai.forEach(item => {
                const row = document.createElement('tr');
                const statusClass = item.status === 'LL' ? 'sp-status-lulus' : (item.status === 'BL' ? 'sp-status-gagal' : '');

                // MAPPING SESUAI REQUEST:
                // item.nilai = ANGKA (dari GAS field 'nilai')
                // item.mutu = HURUF (dari GAS field 'mutu')
                row.innerHTML = `
                    <td class="sp-text-center">${item.no}</td>
                    <td class="sp-text-left">${item.nama}</td>
                    <td class="sp-text-center">${item.nilai}</td>
                    <td class="sp-text-center">${item.mutu}</td>
                    <td class="sp-text-center ${statusClass}">${item.status}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="sp-text-center">Belum ada data nilai.</td></tr>';
        }

        // --- LOGIKA TOMBOL SERTIFIKAT (LOCK/UNLOCK) ---
        const btnCert = document.getElementById('sp-dl-sertifikat');
        const warnText = document.getElementById('sp-cert-warning');

        // Cek apakah data status_kelulusan TRUE/FALSE
        const isGraduated = data.status_kelulusan === true || data.status_kelulusan === "true";

        if(isGraduated && data.sertifikat_url) {
            // Lulus & Ada URL -> Aktifkan Tombol
            btnCert.href = data.sertifikat_url;
            btnCert.classList.remove('btn-disabled');
            btnCert.removeAttribute('onclick'); // Hapus pencegah klik
            warnText.style.display = 'none'; // Sembunyikan peringatan
        } else {
            // Tidak Lulus atau URL kosong -> Lock Tombol
            btnCert.href = "javascript:void(0)";
            btnCert.classList.add('btn-disabled');
            warnText.style.display = 'block'; // Munculkan peringatan
        }

        // Buka Modal Hasil
        openModal('sp-result-modal');
    }

    function renderError(msg) {
        document.getElementById('sp-error-msg').innerText = msg;
        openModal('sp-error-modal');
    }

    function openModal(id) {
        document.getElementById(id).classList.add('active');
    }

    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    // Close modal jika klik di luar area konten
    window.onclick = function(event) {
        if (event.target.classList.contains('sp-modal-overlay')) {
            event.target.classList.remove('active');
        }
    }
</script>
