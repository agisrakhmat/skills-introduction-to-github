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
    var tanggal = invData[1];
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
    var detailValues = sheetDetail.getRange(2, 1, lastRowDetail - 1, 6).getValues();
    var items = [];

    for (var j = 0; j < detailValues.length; j++) {
      if (detailValues[j][0] === invNumber) {
        items.push({
          nama: detailValues[j][1],
          deskripsi: detailValues[j][2],
          qty: detailValues[j][3],
          harga: detailValues[j][4]
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

  sheet.setColumnWidth(1, 30);
  sheet.setColumnWidth(2, 50);  // No
  sheet.setColumnWidth(3, 300); // Deskripsi
  sheet.setColumnWidth(4, 50);  // Qty
  sheet.setColumnWidth(5, 120); // Harga
  sheet.setColumnWidth(6, 150); // Total

  // Header
  sheet.getRange('B2').setValue('INVOICE').setFontSize(24).setFontWeight('bold').setFontColor('#2a52be');
  sheet.getRange('F2').setFormula('=IMAGE("' + LOGO_URL + '")');
  sheet.setRowHeight(2, 60);

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

  // Items Table Header
  var itemHeaders = ['No', 'Rincian Penagihan', 'Qty', 'Harga Satuan', 'Total'];
  sheet.getRange('B10:F10').setValues([itemHeaders]).setFontWeight('bold').setBackground('#2a52be').setFontColor('white');

  sheet.getRange('B11:F21').setBorder(true, true, true, true, true, true);

  // Summary
  sheet.getRange('E23').setValue('Subtotal Invoice:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F23').setValue('{{Subtotal}}');

  sheet.getRange('E24').setValue('Pajak ({{PajakPersen}}%):').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F24').setValue('{{NominalPajak}}');

  sheet.getRange('E25').setValue('Diskon:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F25').setValue('{{Diskon}}');

  sheet.getRange('E26').setValue('Total Tagihan Ini:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F26').setValue('{{TotalTagihan}}').setFontWeight('bold').setBackground('#fff2cc');

  sheet.getRange('E27').setValue('Sudah Dibayar:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F27').setValue('{{Dibayar}}');

  sheet.getRange('E28').setValue('Sisa Tagihan Ini:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F28').setValue('{{Sisa}}').setFontWeight('bold').setFontColor('red');

  // Informasi Dana
  sheet.getRange('B30').setValue('Informasi Pembayaran / Transfer:').setFontWeight('bold');
  sheet.getRange('B31').setValue('Bank: [Nama Bank Anda]');
  sheet.getRange('B32').setValue('No. Rekening: [Nomor Rekening Anda]');
  sheet.getRange('B33').setValue('Atas Nama: [Nama Anda/Perusahaan]');

  // Formats
  sheet.getRangeList(['F6', 'E11:F21', 'F23:F28']).setNumberFormat('"Rp" #,##0');
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
    var tanggal = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

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
    for (var i = 0; i < items.length; i++) {
      var itemRow = startRow + i;
      if (itemRow <= 21) {
        copiedSheet.getRange('B' + itemRow).setValue(i + 1);
        copiedSheet.getRange('C' + itemRow).setValue(items[i].nama + (items[i].deskripsi ? ' - ' + items[i].deskripsi : ''));
        copiedSheet.getRange('D' + itemRow).setValue(items[i].qty);
        copiedSheet.getRange('E' + itemRow).setValue(items[i].harga);
        copiedSheet.getRange('F' + itemRow).setValue(items[i].qty * items[i].harga);
      } else {
        copiedSheet.insertRowBefore(itemRow);
        copiedSheet.getRange('B' + itemRow).setValue(i + 1);
        copiedSheet.getRange('C' + itemRow).setValue(items[i].nama + (items[i].deskripsi ? ' - ' + items[i].deskripsi : ''));
        copiedSheet.getRange('D' + itemRow).setValue(items[i].qty);
        copiedSheet.getRange('E' + itemRow).setValue(items[i].harga);
        copiedSheet.getRange('F' + itemRow).setValue(items[i].qty * items[i].harga);
      }
    }

    for (var j = items.length; j < 11; j++) {
       var emptyRow = startRow + j;
       copiedSheet.getRange('B' + emptyRow + ':F' + emptyRow).clearContent();
    }

    SpreadsheetApp.flush();

    // 5. Buat PDF dari Spreadsheet Sementara
    var pdfName = 'Invoice_' + invNumber + '_' + klien + '.pdf';
    var url = tempSs.getUrl();
    var exportUrl = url.replace(/\/edit.*$/, '') + '/export?exportFormat=pdf&format=pdf' +
      '&size=A4' +
      '&portrait=true' +
      '&fitw=true' +
      '&sheetnames=false&printtitle=false&pagenumbers=false' +
      '&gridlines=false' +
      '&fzr=false' +
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
