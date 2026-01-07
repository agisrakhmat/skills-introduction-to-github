
if (typeof Config === 'undefined') {
  var Config = require('./Config.js');
}
if (typeof Database === 'undefined') {
  var Database = require('./Database.js');
}

var Kesiswaan = {
  // Stats
  get_kesiswaan_stats: function() {
      var students = Database.getAll(Config.SHEET_NAMES.USERS_MAHASISWA);
      var sertifs = Database.getAll(Config.SHEET_NAMES.KESISWAAN_SERTIFIKAT);

      var total = students.length;
      var aktif = students.filter(function(s) { return s.Status_Akademik === 'Aktif'; }).length;
      var alumni = students.filter(function(s) { return s.Status_Akademik === 'Lulus'; }).length;

      return {
          success: true,
          data: {
              total: total,
              aktif: aktif,
              alumni: alumni,
              sertif: sertifs.length
          }
      };
  },

  // Batch Certificate Generation
  generate_certificates_batch: function(level, templateUrl) {
      // Find students who passed the level
      // Criteria: Status_Akademik = 'Aktif' and Mustawa = level? Or Graduated from level?
      // Assumption: We generate for current students in that level who have passing grades.
      // Or users specifically marked as 'Lulus' for that level.
      // Simplified: Generate for all Active students in 'level'.

      // Parse Level from string "Mustawa 1" -> "01"
      var lvlCode = "01";
      if (level.includes("1")) lvlCode = "01";
      if (level.includes("2")) lvlCode = "02";
      // ... etc

      var students = Database.getAll(Config.SHEET_NAMES.USERS_MAHASISWA);
      var candidates = students.filter(function(s) {
          // Check Mustawa match. Note: Frontend sends "Mustawa 1", DB stores "01".
          // Also check if already has cert?
          return s.Mustawa === lvlCode && s.Status_Akademik === 'Aktif'; // Or Lulus
      });

      var generatedCount = 0;

      if (typeof SlidesApp !== 'undefined' && typeof DriveApp !== 'undefined') {
          var templateId = templateUrl.match(/[-\w]{25,}/); // Extract ID
          if (templateId) templateId = templateId[0];

          if (!templateId) return { success: false, message: "Invalid Template Link" };

          var templateFile = DriveApp.getFileById(templateId);
          var folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID"));

          candidates.forEach(function(s) {
              // 1. Copy Slide
              var newFile = templateFile.makeCopy("SERTIFIKAT_" + s.Nama, folder);
              var deck = SlidesApp.openById(newFile.getId());
              var slide = deck.getSlides()[0];

              // 2. Replace Text
              // Tags: {{NOMOR}}, {{NAMA}}, {{PREDIKAT}}, {{TANGGAL}}
              var noSertif = Config.PREFIX.SERTIFIKAT + "." + lvlCode + "." + s.NIM.slice(-4); // Simple Logic
              var predikat = "Jayyid Jiddan"; // Mock, needs Grade calculation logic
              var today = new Date().toLocaleDateString('id-ID');

              slide.replaceAllText("{{NOMOR}}", noSertif);
              slide.replaceAllText("{{NAMA}}", s.Nama);
              slide.replaceAllText("{{PREDIKAT}}", predikat);
              slide.replaceAllText("{{TANGGAL}}", today);

              deck.saveAndClose();

              // 3. Export PDF (Optional, or just link Slide)
              var pdfBlob = newFile.getAs(MimeType.PDF);
              var pdfFile = folder.createFile(pdfBlob);
              pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

              // Cleanup Slide copy if only PDF needed? Let's keep PDF.
              newFile.setTrashed(true); // Delete slide source to save space

              // 4. Save to DB
              var record = {
                  No_Sertifikat: noSertif,
                  NIM: s.NIM,
                  Level: level,
                  Tanggal_Terbit: today,
                  File_URL: pdfFile.getUrl(),
                  Predikat_Lulus: predikat
              };
              Database.insert(Config.SHEET_NAMES.KESISWAAN_SERTIFIKAT, record);
              generatedCount++;
          });
      } else {
          // Local Mock
          generatedCount = candidates.length;
      }

      return { success: true, message: generatedCount + " sertifikat berhasil dibuat." };
  },

  get_certificates_list: function() {
      var certs = Database.getAll(Config.SHEET_NAMES.KESISWAAN_SERTIFIKAT);
      var students = Database.getAll(Config.SHEET_NAMES.USERS_MAHASISWA);

      var mapped = certs.map(function(c) {
          var s = students.find(function(u) { return u.NIM === c.NIM; });
          return {
              no: c.No_Sertifikat,
              nim: c.NIM,
              nama: s ? s.Nama : c.NIM,
              level: c.Level,
              tgl: c.Tanggal_Terbit,
              link: c.File_URL
          };
      });
      return { success: true, data: mapped };
  },

  // Announcements (Info)
  get_announcements_list: function() {
      var data = Database.getAll(Config.SHEET_NAMES.GENERAL_PENGUMUMAN);
      var mapped = data.map(function(d) {
          var btn = {};
          try { btn = JSON.parse(d.JSON_Tombol); } catch(e) {}
          return {
              id: d.ID,
              judul: d.Judul,
              isi: d.Isi,
              target: d.Target,
              date: d.Tanggal,
              img: d.Gambar_URL,
              btn_type: btn.type || 'NONE'
          };
      });
      return { success: true, data: mapped };
  },

  create_announcement: function(data) {
      // data: judul, isi, img, target, button (obj)
      var id = "INFO." + Date.now();
      var obj = {
          ID: id,
          Tanggal: new Date().toLocaleDateString('id-ID'),
          Judul: data.judul,
          Isi: data.isi,
          Target: data.target,
          Gambar_URL: data.img || "",
          JSON_Tombol: JSON.stringify(data.button || {})
      };

      Database.insert(Config.SHEET_NAMES.GENERAL_PENGUMUMAN, obj);
      return { success: true, message: "Pengumuman diterbitkan" };
  },

  // Public Verification
  check_certificate: function(code) {
      var cert = Database.findOne(Config.SHEET_NAMES.KESISWAAN_SERTIFIKAT, "No_Sertifikat", code);
      if (!cert) return { success: false, message: "Tidak ditemukan" };

      var student = Database.findOne(Config.SHEET_NAMES.USERS_MAHASISWA, "NIM", cert.NIM);

      return {
          success: true,
          data: {
              nama: student ? student.Nama : "Unknown",
              nim: cert.NIM,
              jenis: "Syahadah " + cert.Level,
              level: cert.Level,
              predikat: cert.Predikat_Lulus,
              tgl: cert.Tanggal_Terbit,
              link: cert.File_URL
          }
      };
  }
};

if (typeof module !== 'undefined') module.exports = Kesiswaan;
