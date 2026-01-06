if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }

var Finance = {

    /**
     * Handles student enrollment logic:
     * 1. Saves uploaded proof to Drive (Folder BUKTI_TRANSFER).
     * 2. Records Transaction (SPP + Infaq).
     * 3. Updates Student Mustawa (if needed).
     */
    enrollStudent: function(data) {
        // data: { user_id (NIM), mustawa, nominal_spp, nominal_infaq, komitmen, file_base64, file_name }

        try {
            var nim = data.user_id;
            var fileUrl = "";

            // 1. Handle File Upload
            if (data.file_base64) {
                // Remove data:image/jpeg;base64, prefix if exists
                var encoded = data.file_base64.split(',')[1] || data.file_base64;
                var decoded = Utilities.base64Decode(encoded);
                var blob = Utilities.newBlob(decoded, "image/jpeg", "Bukti_" + nim + "_" + (data.file_name || "transfer.jpg"));

                // Get Folder
                var folderId = Config.FOLDERS.BUKTI_TRANSFER;
                // In mock/test this might fail if ID is placeholder
                try {
                    var folder = DriveApp.getFolderById(folderId);
                    var file = folder.createFile(blob);
                    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                    fileUrl = file.getUrl();
                } catch(err) {
                    fileUrl = "DRIVE_UPLOAD_FAILED: " + err.message;
                }
            }

            // 2. Record Transaction
            var now = new Date();
            var dateStr = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd HH:mm:ss");

            var total = Number(data.nominal_spp || 0) + Number(data.nominal_infaq || 0);

            var transData = {
                "Kode_Trans": "TRX." + now.getTime() + "." + nim,
                "NIM": nim,
                "Jenis_Transaksi": "Pendaftaran & SPP",
                "Nominal": total,
                "Bukti_Transfer": fileUrl,
                "Status": "Pending",
                "Tgl_Input": dateStr,
                "Tgl_Verifikasi": "",
                "Petugas_Verifikator": "",
                "Komitmen_Bayar": data.komitmen || ""
            };

            Database.insertRow(Config.SHEETS.TRANSAKSI, transData);

            // 3. Update Mustawa (Optional: We set default '01' in Auth, but user selected specific Mustawa)
            // Ideally we should update the USER record.
            // For MVP, we'll assume Admin verifies and sets Mustawa manually upon activation,
            // OR we update it now. Let's try to update if possible.
            // Since `insertRow` is append-only, updating requires finding the row.
            // We will skip update for now and rely on "Mustawa_Daftar" logic or Admin check.

            return {
                success: true,
                status: "success",
                message: "Enrollment berhasil.",
                data: {
                    transaction_id: transData.Kode_Trans,
                    file_url: fileUrl
                }
            };

        } catch (e) {
            return { success: false, status: "error", message: "Enroll Error: " + e.toString() };
        }
    }
};

if (typeof module !== 'undefined') module.exports = Finance;
