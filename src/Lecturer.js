if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }
if (typeof Academic === 'undefined') { try { var Academic = require('./Academic'); } catch(e) {} }

var Lecturer = {

    getDosenCourses: function(dosenId) {
        var allMK = Database.getTable(Config.SHEETS.MATAKULIAH);
        // For MVP, if Dosen_ID is simple (e.g. 001) it might match.
        // Or if Dosen_ID is full Kode_Staff (DI.DS.001).
        // Let's filter loosely or strictly.

        var myCourses = allMK.filter(function(mk) {
            return mk.Dosen_Pengampu && (
                mk.Dosen_Pengampu === dosenId ||
                dosenId.endsWith(mk.Dosen_Pengampu) || // "DI.DS.001" ends with "001"
                mk.Dosen_Pengampu.endsWith(dosenId)    // "001" ends with "001" (safety)
            );
        });

        return myCourses.map(function(c) {
            return {
                course_id: c.Kode_MK,
                course_name: c.Nama_MK,
                mustawa: c.Mustawa
            };
        });
    },

    getEnrolledStudents: function(courseId, mustawa) {
        // Logic: Get Students where Mustawa_Saat_Ini matches the Course's Mustawa.
        // Ideally we should have an ENROLLMENT table.
        // But per Master Doc, "Matakuliah" has "Mustawa". "Users" has "Mustawa_Saat_Ini".
        // We assume all active students in Mustawa X take all courses in Mustawa X.

        var allStudents = Database.getTable(Config.SHEETS.USERS_MAHASISWA);
        var activeStudents = allStudents.filter(function(s) {
            return s.Status_Aktif === 'Aktif' && s.Mustawa_Saat_Ini === mustawa;
        });

        // Also fetch existing grades if any (to pre-fill)
        var allGrades = Database.getTable(Config.SHEETS.NILAI);

        return activeStudents.map(function(s) {
            var g = allGrades.find(function(n) { return n.NIM === s.NIM && n.Kode_MK === courseId; }) || {};
            return {
                nim: s.NIM,
                name: s.Nama,
                tugas: g.Nilai_Latihan || 0,
                uts: g.Nilai_UTS || 0,
                uas: g.Nilai_UAS || 0
            };
        });
    },

    submitBulkAttendance: function(courseId, meeting, dataList) {
        // dataList: [{nim, status}, ...]
        var successCount = 0;
        dataList.forEach(function(item) {
            // submitAttendance(nim, kodeMK, pertemuanKe, type, linkBukti)
            var res = Academic.submitAttendance(item.nim, courseId, meeting, item.status, "");
            if (res.success) successCount++;
        });
        return { success: true, count: successCount };
    },

    submitBulkGrades: function(courseId, dataList) {
        // dataList: [{nim, tugas, uts, uas}, ...]
        var successCount = 0;
        dataList.forEach(function(item) {
            // processFinalGrade(nim, kodeMK, nilaiTugas, nilaiUTS, nilaiUAS)
            // Academic.js has processFinalGrade which SAVES to DB.
            Academic.processFinalGrade(item.nim, courseId, Number(item.tugas), Number(item.uts), Number(item.uas));
            successCount++;
        });
        return { success: true, count: successCount };
    }
};

if (typeof module !== 'undefined') module.exports = Lecturer;
