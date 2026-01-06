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

    enrollStudent: function(data) {
        try {
            var lock = LockService.getScriptLock();
            var hasLock = lock.tryLock(10000);
            if (!hasLock) return { success: false, message: "Server sibuk." };

            var nim = data.user_id;
            var fileUrl = "";

            if (data.file_base64) {
                var encoded = data.file_base64.split(',')[1] || data.file_base64;
                var decoded = Utilities.base64Decode(encoded);
                var blob = Utilities.newBlob(decoded, "image/jpeg", "Bukti_" + nim + "_" + (data.file_name || "transfer.jpg"));

                try {
                    var folder = DriveApp.getFolderById(Config.FOLDERS.BUKTI_TRANSFER);
                    var file = folder.createFile(blob);
                    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                    fileUrl = file.getUrl();
                } catch(err) {
                    fileUrl = "DRIVE_UPLOAD_FAILED: " + err.message;
                }
            }

            var now = new Date();
            var dateStr = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd HH:mm:ss");
            var total = Number(data.nominal_spp || 0) + Number(data.nominal_infaq || 0);
            var transType = "Pendaftaran";
            var kodeTrans = this.generateTransactionCode(transType);

            var transData = {
                "Kode_Trans": kodeTrans,
                "NIM": nim,
                "Jenis_Transaksi": transType,
                "Nominal": total,
                "Bukti_Transfer": fileUrl,
                "Status": "Pending",
                "Tgl_Input": dateStr,
                "Tgl_Verifikasi": "",
                "Petugas_Verifikator": "",
                "Komitmen_Bayar": data.komitmen || ""
            };

            Database.insertRow(Config.SHEETS.TRANSAKSI, transData);
            lock.releaseLock();

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
            try { LockService.getScriptLock().releaseLock(); } catch(e2) {}
            return { success: false, status: "error", message: "Enroll Error: " + e.toString() };
        }
    },

    getStudentPayments: function(nim) {
        var allTrans = Database.getTable(Config.SHEETS.TRANSAKSI);
        var myTrans = allTrans.filter(function(t) { return t.NIM === nim; });

        return myTrans.map(function(t) {
            return {
                description: t.Jenis_Transaksi,
                amount: t.Nominal,
                date: t.Tgl_Input,
                status: t.Status
            };
        });
    }
};

if (typeof module !== 'undefined') module.exports = Finance;
