// Konfigurasi ID Folder Drive untuk menyimpan PDF
var FOLDER_ID = '1roUU74osA1FqMLY-On9sOfB3B6rreeXG';
// Logo URL
var LOGO_URL = 'https://drive.google.com/uc?id=1HeB6R0bRlYLSx8wijgKGtOz_tBQfRZ0p';

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Sistem Invoice')
      .addItem('Setup Awal (Buat Sheet)', 'setupSheets')
      .addItem('Buat Invoice Baru', 'showInvoiceForm')
      .addItem('Proses PDF Invoice', 'showPdfForm')
      .addToUi();
}

function showInvoiceForm() {
  var html = HtmlService.createHtmlOutputFromFile('Form')
      .setWidth(800)
      .setHeight(850);
  SpreadsheetApp.getUi().showModalDialog(html, 'Buat Invoice Baru');
}

function showPdfForm() {
  var html = HtmlService.createHtmlOutputFromFile('PdfForm')
      .setWidth(400)
      .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Proses PDF Invoice');
}

function getPendingPdfInvoices() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetData = ss.getSheetByName('Data Invoice');
  if (!sheetData) return [];

  var lastRow = sheetData.getLastRow();
  if (lastRow < 2) return [];

  var data = sheetData.getRange(2, 1, lastRow - 1, 16).getValues();
  var pending = [];

  for (var i = 0; i < data.length; i++) {
    // Index 0 adalah No Invoice, Index 2 adalah Klien, Index 15 adalah Link PDF
    var noInvoice = data[i][0];
    var klien = data[i][2];
    var linkPdf = data[i][15];

    // Jika tidak ada nomor invoice, lewati
    if (!noInvoice) continue;

    // Jika Link PDF kosong, masukkan ke daftar antrean
    if (!linkPdf || linkPdf.toString().trim() === '') {
      pending.push({
        noInvoice: noInvoice,
        klien: klien
      });
    }
  }

  return pending;
}

function processPdfGeneration(invNumber) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetData = ss.getSheetByName('Data Invoice');
    var sheetDetail = ss.getSheetByName('Detail Item');

    if (!sheetData || !sheetDetail) {
      return {success: false, message: 'Sheet belum dibuat.'};
    }

    // Cari data di Sheet 'Data Invoice'
    var lastRowData = sheetData.getLastRow();
    var dataValues = sheetData.getRange(2, 1, lastRowData - 1, 16).getValues();
    var targetRowIndex = -1;
    var invData = null;

    for (var i = 0; i < dataValues.length; i++) {
      if (dataValues[i][0] === invNumber) {
        targetRowIndex = i + 2; // +2 karena mulai baris 2
        invData = dataValues[i];
        break;
      }
    }

    if (!invData) {
      return {success: false, message: 'Data Invoice tidak ditemukan.'};
    }

    // Ekstrak data utama
    var rawTanggal = invData[1];
    var tanggal = rawTanggal;
    // Paksa format tanggal menjadi teks Indonesia jika itu adalah object Date
    if (Object.prototype.toString.call(rawTanggal) === '[object Date]') {
      var blnIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      tanggal = rawTanggal.getDate() + ' ' + blnIndo[rawTanggal.getMonth()] + ' ' + rawTanggal.getFullYear();
    }

    var klien = invData[2];
    var proyek = invData[3];
    var tipePembayaran = invData[4];
    var nilaiProyek = invData[6];
    var infoTermin = invData[7];
    var subtotal = invData[8];
    var pajakPersen = invData[9];
    var nominalPajak = invData[10];
    var diskon = invData[11];
    var totalTagihan = invData[12];
    var dibayar = invData[13];
    var sisa = invData[14];

    // Cari rincian item di Sheet 'Detail Item'
    var lastRowDetail = sheetDetail.getLastRow();
    // Ambil SEMUA data baris agar tahan terhadap pergeseran kolom (misal ada kolom kosong terselip)
    // Asumsi default struktur: A(0): No, B(1): Nama, C(2): Deskripsi, D(3): Qty, E(4): Harga, F(5): Total
    // TAPI jika pengguna menyisipkan kolom, maka index bergeser.
    // Untuk amannya, kita baca header-nya (baris 1) untuk menemukan index kolom yang benar.
    var headerDetail = sheetDetail.getRange(1, 1, 1, sheetDetail.getLastColumn()).getValues()[0];
    var colIdx = { nama: 1, deskripsi: 2, qty: 3, harga: 4 }; // Default

    for (var c = 0; c < headerDetail.length; c++) {
      var hd = headerDetail[c].toString().toLowerCase();
      if (hd.indexOf('nama') !== -1) colIdx.nama = c;
      else if (hd.indexOf('desk') !== -1) colIdx.deskripsi = c;
      else if (hd.indexOf('qty') !== -1 || hd === 'kuantitas') colIdx.qty = c;
      else if (hd.indexOf('harga satuan') !== -1) colIdx.harga = c;
    }

    var detailValues = sheetDetail.getRange(2, 1, lastRowDetail - 1, sheetDetail.getLastColumn()).getValues();
    var items = [];

    for (var j = 0; j < detailValues.length; j++) {
      if (detailValues[j][0] === invNumber) {
        var qtyVal = parseFloat(detailValues[j][colIdx.qty]);
        var hargaVal = parseFloat(detailValues[j][colIdx.harga]);

        items.push({
          nama: detailValues[j][colIdx.nama],
          deskripsi: detailValues[j][colIdx.deskripsi],
          qty: isNaN(qtyVal) ? 0 : qtyVal,
          harga: isNaN(hargaVal) ? 0 : hargaVal
        });
      }
    }

    // Buat PDF
    var pdfUrl = createPdfFromTemplate(invNumber, tanggal, klien, proyek, tipePembayaran, nilaiProyek, infoTermin, items, subtotal, pajakPersen, nominalPajak, diskon, totalTagihan, dibayar, sisa);

    if (pdfUrl.indexOf('Gagal') !== -1) {
      return {success: false, message: pdfUrl};
    }

    // Update sel 'Link PDF' di 'Data Invoice' (Kolom P = 16)
    sheetData.getRange(targetRowIndex, 16).setValue(pdfUrl);

    return {success: true, url: pdfUrl};

  } catch(e) {
    return {success: false, message: e.toString()};
  }
}

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Sheet Data Invoice
  var sheetData = ss.getSheetByName('Data Invoice');
  if (!sheetData) {
    sheetData = ss.insertSheet('Data Invoice');
    var headers = ['No Invoice', 'Tanggal', 'Klien', 'Proyek', 'Tipe Pembayaran', 'Status', 'Nilai Total Proyek', 'Keterangan/Persentase', 'Subtotal Invoice', 'Pajak (%)', 'Nominal Pajak', 'Diskon', 'Total Tagihan', 'Dibayar', 'Sisa Tagihan', 'Link PDF'];
    sheetData.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#d9ead3');
    sheetData.setFrozenRows(1);

    // Setup Data Validation Dropdown for Status column (Column F / Index 6)
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(['Belum Dibayar', 'Sebagian', 'Lunas']).setAllowInvalid(false).build();
    sheetData.getRange("F2:F1000").setDataValidation(rule);
  }

  // Sheet Detail Item
  var sheetDetail = ss.getSheetByName('Detail Item');
  if (!sheetDetail) {
    sheetDetail = ss.insertSheet('Detail Item');
    var headersDetail = ['No Invoice', 'Nama Item', 'Deskripsi', 'Qty', 'Harga Satuan', 'Total Harga'];
    sheetDetail.getRange(1, 1, 1, headersDetail.length).setValues([headersDetail]).setFontWeight('bold').setBackground('#c9daf8');
    sheetDetail.setFrozenRows(1);
  }

  // Sheet Template Invoice
  var sheetTemplate = ss.getSheetByName('Template Invoice');
  if (!sheetTemplate) {
    sheetTemplate = ss.insertSheet('Template Invoice');
    setupTemplateDesign(sheetTemplate);
  }

  SpreadsheetApp.getUi().alert('Setup Selesai! Semua sheet telah dibuat dan disiapkan. Perhatikan Kolom F pada Data Invoice sudah memiliki Dropdown Status.');
}

function setupTemplateDesign(sheet) {
  sheet.clear();

  sheet.setColumnWidth(1, 15);  // A
  sheet.setColumnWidth(2, 35);  // B (No)
  sheet.setColumnWidth(3, 280); // C (Deskripsi)
  sheet.setColumnWidth(4, 45);  // D (Qty)
  sheet.setColumnWidth(5, 110); // E (Harga)
  sheet.setColumnWidth(6, 140); // F (Total)
  sheet.setColumnWidth(7, 15);  // G

  // Header
  sheet.getRange('B2').setValue('INVOICE').setFontSize(22).setFontWeight('bold').setFontColor('#2a52be');
  sheet.getRange('F2').setFormula('=IMAGE("' + LOGO_URL + '")');
  sheet.setRowHeight(2, 50);

  sheet.getRange('B4').setValue('Kepada:').setFontWeight('bold');
  sheet.getRange('B5').setValue('{{Klien}}').setFontWeight('bold');
  sheet.getRange('B6').setValue('Proyek: {{Proyek}}');

  sheet.getRange('E4').setValue('No Invoice:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F4').setValue('{{NoInvoice}}').setFontWeight('bold');

  sheet.getRange('E5').setValue('Tanggal:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F5').setValue('{{Tanggal}}');

  sheet.getRange('E6').setValue('Nilai Proyek:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F6').setValue('{{NilaiProyek}}').setFontWeight('bold');

  sheet.getRange('E7').setValue('Tipe Pembayaran:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F7').setValue('{{TipePembayaran}}');

  // Baris Info Termin (Dinamic)
  sheet.getRange('E8').setValue('Keterangan:').setHorizontalAlignment('right');
  sheet.getRange('F8').setValue('{{KetTermin}}');

  // Items Table Header (Mulai Baris 10, Isi Item B11-B20 = 10 Baris Max)
  var itemHeaders = ['No', 'Rincian Penagihan', 'Qty', 'Harga Satuan', 'Total'];
  sheet.getRange('B10:F10').setValues([itemHeaders]).setFontWeight('bold').setBackground('#2a52be').setFontColor('white');

  sheet.getRange('B11:F20').setBorder(true, true, true, true, true, true);

  // Summary (Mulai Baris 21 agar padat)
  sheet.getRange('E21').setValue('Subtotal Invoice:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F21').setValue('{{Subtotal}}');

  sheet.getRange('E22').setValue('Pajak ({{PajakPersen}}%):').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F22').setValue('{{NominalPajak}}');

  sheet.getRange('E23').setValue('Diskon:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F23').setValue('{{Diskon}}');

  sheet.getRange('E24').setValue('Total Tagihan Ini:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F24').setValue('{{TotalTagihan}}').setFontWeight('bold').setBackground('#fff2cc');

  sheet.getRange('E25').setValue('Sudah Dibayar:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F25').setValue('{{Dibayar}}');

  sheet.getRange('E26').setValue('Sisa Tagihan Ini:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F26').setValue('{{Sisa}}').setFontWeight('bold').setFontColor('red');

  // Informasi Dana (Pas Berakhir di Baris 30)
  sheet.getRange('B27').setValue('Informasi Pembayaran / Transfer:').setFontWeight('bold');
  sheet.getRange('B28').setValue('Bank: [Nama Bank Anda]');
  sheet.getRange('B29').setValue('No. Rekening: [Nomor Rekening Anda]');
  sheet.getRange('B30').setValue('Atas Nama: [Nama Anda/Perusahaan]');

  // Formats
  sheet.getRangeList(['F6', 'E11:F20', 'F21:F26']).setNumberFormat('"Rp" #,##0');
}

function generateInvoiceNumber() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetData = ss.getSheetByName('Data Invoice');
  if (!sheetData) return 'INV-ERROR';

  var date = new Date();
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var prefix = 'INV-' + year + month + '-';

  var lastRow = sheetData.getLastRow();
  var nextNumber = 1;

  if (lastRow > 1) {
    var lastInvoiceStr = sheetData.getRange(lastRow, 1).getValue();
    if (lastInvoiceStr && lastInvoiceStr.toString().indexOf(prefix) !== -1) {
      var parts = lastInvoiceStr.toString().split('-');
      if (parts.length === 3) {
        var num = parseInt(parts[2], 10);
        if (!isNaN(num)) {
          nextNumber = num + 1;
        }
      }
    }
  }

  var numStr = ('000' + nextNumber).slice(-3);
  return prefix + numStr;
}

function submitInvoiceData(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetData = ss.getSheetByName('Data Invoice');
    var sheetDetail = ss.getSheetByName('Detail Item');

    if (!sheetData || !sheetDetail) {
      return {success: false, message: 'Sheet belum dibuat. Jalankan "Setup Awal" dari menu Sistem Invoice terlebih dahulu.'};
    }

    var invNumber = generateInvoiceNumber();

    var tglDate = new Date();
    var blnIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var tanggal = tglDate.getDate() + ' ' + blnIndo[tglDate.getMonth()] + ' ' + tglDate.getFullYear();

    var subtotal = 0;
    var items = data.items;
    var detailRows = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var qty = parseFloat(item.qty) || 0;
      var harga = parseFloat(item.harga) || 0;
      var totalItem = qty * harga;
      subtotal += totalItem;

      detailRows.push([
        invNumber,
        item.nama,
        item.deskripsi || '',
        qty,
        harga,
        totalItem
      ]);
    }

    var nilaiProyek = parseFloat(data.nilaiProyek) || 0;
    // Format KetTermin untuk Data Sheet dan PDF
    var infoTermin = "";
    if (data.tipePembayaran === 'DP' || data.tipePembayaran === 'Termin') {
      var persen = parseFloat(data.persentaseTagihan) || 0;
      infoTermin = (data.keteranganTermin ? data.keteranganTermin + ' ' : '') + '(' + persen + '%)';
    } else {
      infoTermin = "-";
    }

    var pajakPersen = parseFloat(data.pajak) || 0;
    var nominalPajak = subtotal * (pajakPersen / 100);
    var diskon = parseFloat(data.diskon) || 0;
    var totalTagihan = subtotal + nominalPajak - diskon;
    var dibayar = parseFloat(data.dibayar) || 0;
    var sisa = totalTagihan - dibayar;

    if (detailRows.length > 0) {
      sheetDetail.getRange(sheetDetail.getLastRow() + 1, 1, detailRows.length, detailRows[0].length).setValues(detailRows);
    }

    // Alur PDF dipisahkan, cukup simpan data ke tabel. Link PDF (index 15) dibiarkan kosong.
    var invoiceRow = [
      invNumber, tanggal, data.klien, data.proyek, data.tipePembayaran, 'Belum Dibayar',
      nilaiProyek, infoTermin, subtotal, pajakPersen, nominalPajak, diskon, totalTagihan, dibayar, sisa, ''
    ];
    sheetData.appendRow(invoiceRow);

    return {success: true, message: 'Data Invoice berhasil disimpan! (Tanpa membuat PDF)'};

  } catch (e) {
    return {success: false, message: 'Terjadi kesalahan: ' + e.toString()};
  }
}

function createPdfFromTemplate(invNumber, tanggal, klien, proyek, tipePembayaran, nilaiProyek, infoTermin, items, subtotal, pajakPersen, nominalPajak, diskon, totalTagihan, dibayar, sisa) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetTemplate = ss.getSheetByName('Template Invoice');
  var tempSs = null;

  if (!sheetTemplate) {
      throw new Error("Sheet Template Invoice tidak ditemukan.");
  }

  try {
    // 1. Buat Spreadsheet sementara BARU (kosong dan terpisah dari utama untuk hindari error Bandwidth)
    var folder = DriveApp.getFolderById(FOLDER_ID);
    tempSs = SpreadsheetApp.create('Temp_Invoice_' + invNumber);
    var tempFile = DriveApp.getFileById(tempSs.getId());

    // 2. Copy template dari Spreadsheet utama ke Spreadsheet sementara
    var copiedSheet = sheetTemplate.copyTo(tempSs);
    copiedSheet.setName('Invoice');

    // 3. Hapus "Sheet1" bawaan dari Spreadsheet sementara
    var defaultSheet = tempSs.getSheetByName('Sheet1');
    if (defaultSheet) {
      tempSs.deleteSheet(defaultSheet);
    }

    // 4. Masukkan data ke Spreadsheet sementara
    var dataMap = {
      '{{Klien}}': klien,
      '{{Proyek}}': proyek,
      '{{NoInvoice}}': invNumber,
      '{{Tanggal}}': tanggal,
      '{{NilaiProyek}}': nilaiProyek,
      '{{TipePembayaran}}': tipePembayaran,
      '{{KetTermin}}': infoTermin,
      '{{Subtotal}}': subtotal,
      '{{PajakPersen}}': pajakPersen,
      '{{NominalPajak}}': nominalPajak,
      '{{Diskon}}': diskon,
      '{{TotalTagihan}}': totalTagihan,
      '{{Dibayar}}': dibayar,
      '{{Sisa}}': sisa
    };

    for (var key in dataMap) {
      copiedSheet.createTextFinder(key).replaceAllWith(dataMap[key].toString());
    }

    var startRow = 11;
    // Maksimal item diset ke 10 agar format tidak melewati A1:G30
    var maxItems = Math.min(items.length, 10);

    for (var i = 0; i < maxItems; i++) {
      var itemRow = startRow + i;
      copiedSheet.getRange('B' + itemRow).setValue(i + 1);
      copiedSheet.getRange('C' + itemRow).setValue(items[i].nama + (items[i].deskripsi ? ' - ' + items[i].deskripsi : ''));
      copiedSheet.getRange('D' + itemRow).setValue(items[i].qty);
      copiedSheet.getRange('E' + itemRow).setValue(items[i].harga);
      copiedSheet.getRange('F' + itemRow).setValue(items[i].qty * items[i].harga);
    }

    // Bersihkan baris sisa jika item kurang dari 10
    for (var j = maxItems; j < 10; j++) {
       var emptyRow = startRow + j;
       copiedSheet.getRange('B' + emptyRow + ':F' + emptyRow).clearContent();
    }

    // PAKSA UKURAN A1:G30
    // Hapus baris sisa ke bawah (mulai dari baris 31)
    var maxRows = copiedSheet.getMaxRows();
    if (maxRows > 30) {
      copiedSheet.deleteRows(31, maxRows - 30);
    }

    // Hapus kolom sisa ke samping (mulai dari kolom H/Index 8)
    var maxCols = copiedSheet.getMaxColumns();
    if (maxCols > 7) {
      copiedSheet.deleteColumns(8, maxCols - 7);
    }

    SpreadsheetApp.flush();

    // 5. Buat PDF dari Spreadsheet Sementara
    var pdfName = 'Invoice_' + invNumber + '_' + klien + '.pdf';
    var url = tempSs.getUrl();

    // &scale=4 (Fit to Page) - Memaksa agar A1:G30 diprint 1 lembar utuh
    var exportUrl = url.replace(/\/edit.*$/, '') + '/export?exportFormat=pdf&format=pdf' +
      '&size=A4' +
      '&portrait=true' +
      '&fitw=true' +
      '&scale=4' +
      '&sheetnames=false&printtitle=false&pagenumbers=false' +
      '&gridlines=false' +
      '&fzr=false' +
      '&top_margin=0.5&bottom_margin=0.5&left_margin=0.5&right_margin=0.5' +
      '&gid=' + copiedSheet.getSheetId();

    var token = ScriptApp.getOAuthToken();
    var options = {
      headers: {
        'Authorization': 'Bearer ' + token
      },
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(exportUrl, options);
    var blob;

    // Cek sukses, jika limit bandwidth URLFetch kena lagi, gunakan metode Fallback 'getAs'
    if (response.getResponseCode() === 200) {
      blob = response.getBlob().setName(pdfName);
    } else {
      // Fallback: Gunakan Drive API langsung (tidak peduli ukuran file, selalu anti limit)
      // Ini akan mengambil SELURUH spreadsheet, tapi karena hanya ada 1 sheet maka hasilnya sempurna.
      blob = tempFile.getAs('application/pdf').setName(pdfName);
    }

    var file = folder.createFile(blob);
    return file.getUrl();

  } catch (e) {
    return 'Gagal_Membuat_PDF: ' + e.toString();
  } finally {
    // 6. Pastikan file Spreadsheet sementara selalu dihapus dari Drive root Anda,
    // agar Google Drive tidak penuh dengan file sampah
    if (tempSs) {
      try {
        var fileToDelete = DriveApp.getFileById(tempSs.getId());
        fileToDelete.setTrashed(true);
      } catch(delErr) {
        // Abaikan jika sudah terhapus
      }
    }
  }
}
