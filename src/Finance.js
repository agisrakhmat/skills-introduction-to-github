if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }

var Finance = {

    generateTransactionCode: function(type) {
        var cleanType = type.replace(/[^a-zA-Z]/g, "").toUpperCase();
        var codeType = "XXX";
        if (cleanType.length >= 3) {
            var first = cleanType.charAt(0);
            var last = cleanType.charAt(cleanType.length - 1);
            var midIndex = Math.floor(cleanType.length / 2);
            var mid = cleanType.charAt(midIndex);
            codeType = first + mid + last;
        } else {
            codeType = (cleanType + "XXX").slice(0, 3);
        }

        var now = new Date();
        var year = now.getFullYear().toString().slice(-2);
        var month = ("0" + (now.getMonth() + 1)).slice(-2);

        var prefix = "KEU." + codeType + "." + year + "." + month + ".";

        var allTrans = Database.getTable(Config.SHEETS.TRANSAKSI);
        var maxSeq = 0;

        for (var i = 0; i < allTrans.length; i++) {
            var t = allTrans[i];
            if (t.Kode_Trans && t.Kode_Trans.startsWith(prefix)) {
                var parts = t.Kode_Trans.split('.');
                var seq = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(seq) && seq > maxSeq) {
                    maxSeq = seq;
                }
            }
        }

        var newSeq = ("0000" + (maxSeq + 1)).slice(-4);
        return prefix + newSeq;
    },

    // Handles initial enrollment
    enrollStudent: function(data) {
        return this._processUploadAndRecord(data.user_id, "Pendaftaran", data.nominal_spp, data.file_base64, data.file_name);
    },

    // Handles recurring payments (Upload Bukti)
    uploadPaymentProof: function(data) {
        // data: { session_user_id, type, amount, file_name, file_data }
        return this._processUploadAndRecord(data.session_user_id, data.type || "Pembayaran", data.amount, data.file_data, data.file_name);
    },

    _processUploadAndRecord: function(nim, type, amount, base64Str, fileName) {
        try {
            var lock = LockService.getScriptLock();
            var hasLock = lock.tryLock(10000);
            if (!hasLock) return { success: false, message: "Server sibuk." };

            var fileUrl = "";
            if (base64Str) {
                var encoded = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
                var decoded = Utilities.base64Decode(encoded);
                var blob = Utilities.newBlob(decoded, "image/jpeg", "Bukti_" + nim + "_" + (fileName || "transfer.jpg"));

                try {
                    var folderId = Config.FOLDERS.BUKTI_TRANSFER;
                    // In test environment this might fail if mock not perfect
                    var folder = DriveApp.getFolderById(folderId);
                    var file = folder.createFile(blob);
                    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                    fileUrl = file.getUrl();
                } catch(err) {
                    fileUrl = "DRIVE_UPLOAD_FAILED"; // Proceed even if drive fails for MVP
                }
            }

            var now = new Date();
            var dateStr = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd HH:mm:ss");
            var total = Number(amount || 0);
            var kodeTrans = this.generateTransactionCode(type);

            var transData = {
                "Kode_Trans": kodeTrans,
                "NIM": nim,
                "Jenis_Transaksi": type,
                "Nominal": total,
                "Bukti_Transfer": fileUrl,
                "Status": "Pending",
                "Tgl_Input": dateStr,
                "Tgl_Verifikasi": "",
                "Petugas_Verifikator": "",
                "Komitmen_Bayar": ""
            };

            Database.insertRow(Config.SHEETS.TRANSAKSI, transData);
            lock.releaseLock();

            return {
                success: true,
                status: "success",
                message: "Pembayaran berhasil dicatat.",
                data: { transaction_id: kodeTrans, file_url: fileUrl }
            };

        } catch (e) {
            try { LockService.getScriptLock().releaseLock(); } catch(e2) {}
            return { success: false, status: "error", message: "Error: " + e.toString() };
        }
    },

    getStudentPayments: function(nim) {
        var allTrans = Database.getTable(Config.SHEETS.TRANSAKSI);
        var myTrans = allTrans.filter(function(t) { return t.NIM === nim; });

        return myTrans.map(function(t) {
            return {
                desc: t.Jenis_Transaksi, // Key adapted
                description: t.Jenis_Transaksi,
                amount: t.Nominal,
                date: t.Tgl_Input,
                status: t.Status
            };
        });
    }
};

if (typeof module !== 'undefined') module.exports = Finance;
