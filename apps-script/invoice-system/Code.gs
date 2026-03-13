// Konfigurasi ID Folder Drive untuk menyimpan PDF
var FOLDER_ID = '1roUU74osA1FqMLY-On9sOfB3B6rreeXG';
// Logo URL
var LOGO_URL = 'https://drive.google.com/uc?id=1HeB6R0bRlYLSx8wijgKGtOz_tBQfRZ0p';

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Sistem Invoice')
      .addItem('Setup Awal (Buat Sheet)', 'setupSheets')
      .addItem('Buat Invoice Baru', 'showInvoiceForm')
      .addToUi();
}

function showInvoiceForm() {
  var html = HtmlService.createHtmlOutputFromFile('Form')
      .setWidth(800)
      .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Buat Invoice Baru');
}

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Sheet Data Invoice
  var sheetData = ss.getSheetByName('Data Invoice');
  if (!sheetData) {
    sheetData = ss.insertSheet('Data Invoice');
    var headers = ['No Invoice', 'Tanggal', 'Klien', 'Proyek', 'Tipe Pembayaran', 'Status', 'Subtotal', 'Pajak (%)', 'Nominal Pajak', 'Diskon', 'Total Tagihan', 'Dibayar', 'Sisa Tagihan', 'Link PDF'];
    sheetData.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#d9ead3');
    sheetData.setFrozenRows(1);
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

  SpreadsheetApp.getUi().alert('Setup Selesai! Semua sheet telah dibuat dan disiapkan.');
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

  sheet.getRange('E6').setValue('Status:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F6').setValue('{{Status}}');

  sheet.getRange('E7').setValue('Tipe Pembayaran:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F7').setValue('{{TipePembayaran}}');

  // Items Table Header
  var itemHeaders = ['No', 'Deskripsi Item', 'Qty', 'Harga Satuan', 'Total'];
  sheet.getRange('B9:F9').setValues([itemHeaders]).setFontWeight('bold').setBackground('#2a52be').setFontColor('white');

  sheet.getRange('B10:F20').setBorder(true, true, true, true, true, true);

  // Summary
  sheet.getRange('E22').setValue('Subtotal:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F22').setValue('{{Subtotal}}');

  sheet.getRange('E23').setValue('Pajak ({{PajakPersen}}%):').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F23').setValue('{{NominalPajak}}');

  sheet.getRange('E24').setValue('Diskon:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F24').setValue('{{Diskon}}');

  sheet.getRange('E25').setValue('Total Tagihan:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F25').setValue('{{TotalTagihan}}').setFontWeight('bold').setBackground('#fff2cc');

  sheet.getRange('E26').setValue('Sudah Dibayar:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F26').setValue('{{Dibayar}}');

  sheet.getRange('E27').setValue('Sisa Tagihan:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange('F27').setValue('{{Sisa}}').setFontWeight('bold');

  // Informasi Dana
  sheet.getRange('B29').setValue('Informasi Pembayaran / Transfer:').setFontWeight('bold');
  sheet.getRange('B30').setValue('Bank: [Nama Bank Anda]');
  sheet.getRange('B31').setValue('No. Rekening: [Nomor Rekening Anda]');
  sheet.getRange('B32').setValue('Atas Nama: [Nama Anda/Perusahaan]');

  // Formats
  sheet.getRangeList(['E10:F20', 'F22:F27']).setNumberFormat('"Rp" #,##0');
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

    var pajakPersen = parseFloat(data.pajak) || 0;
    var nominalPajak = subtotal * (pajakPersen / 100);
    var diskon = parseFloat(data.diskon) || 0;
    var totalTagihan = subtotal + nominalPajak - diskon;
    var dibayar = parseFloat(data.dibayar) || 0;
    var sisa = totalTagihan - dibayar;

    if (detailRows.length > 0) {
      sheetDetail.getRange(sheetDetail.getLastRow() + 1, 1, detailRows.length, detailRows[0].length).setValues(detailRows);
    }

    var pdfUrl = createPdfFromTemplate(invNumber, tanggal, data.klien, data.proyek, data.tipePembayaran, data.status, items, subtotal, pajakPersen, nominalPajak, diskon, totalTagihan, dibayar, sisa);

    var invoiceRow = [
      invNumber, tanggal, data.klien, data.proyek, data.tipePembayaran, data.status,
      subtotal, pajakPersen, nominalPajak, diskon, totalTagihan, dibayar, sisa, pdfUrl
    ];
    sheetData.appendRow(invoiceRow);

    return {success: true, message: 'Invoice berhasil dibuat!', url: pdfUrl};

  } catch (e) {
    return {success: false, message: 'Terjadi kesalahan: ' + e.toString()};
  }
}

function createPdfFromTemplate(invNumber, tanggal, klien, proyek, tipePembayaran, status, items, subtotal, pajakPersen, nominalPajak, diskon, totalTagihan, dibayar, sisa) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetTemplate = ss.getSheetByName('Template Invoice');

  if (!sheetTemplate) {
      throw new Error("Sheet Template Invoice tidak ditemukan.");
  }

  var tempSheet = sheetTemplate.copyTo(ss);
  tempSheet.setName('Temp_' + invNumber);

  var dataMap = {
    '{{Klien}}': klien,
    '{{Proyek}}': proyek,
    '{{NoInvoice}}': invNumber,
    '{{Tanggal}}': tanggal,
    '{{Status}}': status,
    '{{TipePembayaran}}': tipePembayaran,
    '{{Subtotal}}': subtotal,
    '{{PajakPersen}}': pajakPersen,
    '{{NominalPajak}}': nominalPajak,
    '{{Diskon}}': diskon,
    '{{TotalTagihan}}': totalTagihan,
    '{{Dibayar}}': dibayar,
    '{{Sisa}}': sisa
  };

  for (var key in dataMap) {
    tempSheet.createTextFinder(key).replaceAllWith(dataMap[key].toString());
  }

  var startRow = 10;
  for (var i = 0; i < items.length; i++) {
    var itemRow = startRow + i;
    if (itemRow <= 20) {
      tempSheet.getRange('B' + itemRow).setValue(i + 1);
      tempSheet.getRange('C' + itemRow).setValue(items[i].nama + (items[i].deskripsi ? ' - ' + items[i].deskripsi : ''));
      tempSheet.getRange('D' + itemRow).setValue(items[i].qty);
      tempSheet.getRange('E' + itemRow).setValue(items[i].harga);
      tempSheet.getRange('F' + itemRow).setValue(items[i].qty * items[i].harga);
    } else {
      tempSheet.insertRowBefore(itemRow);
      tempSheet.getRange('B' + itemRow).setValue(i + 1);
      tempSheet.getRange('C' + itemRow).setValue(items[i].nama + (items[i].deskripsi ? ' - ' + items[i].deskripsi : ''));
      tempSheet.getRange('D' + itemRow).setValue(items[i].qty);
      tempSheet.getRange('E' + itemRow).setValue(items[i].harga);
      tempSheet.getRange('F' + itemRow).setValue(items[i].qty * items[i].harga);
    }
  }

  for (var j = items.length; j < 11; j++) {
     var emptyRow = startRow + j;
     tempSheet.getRange('B' + emptyRow + ':F' + emptyRow).clearContent();
  }

  SpreadsheetApp.flush();

  var folder = DriveApp.getFolderById(FOLDER_ID);
  var pdfName = 'Invoice_' + invNumber + '_' + klien + '.pdf';

  var url = ss.getUrl();
  var exportUrl = url.replace(/\/edit.*$/, '') + '/export?exportFormat=pdf&format=pdf' +
    '&size=A4' +
    '&portrait=true' +
    '&fitw=true' +
    '&sheetnames=false&printtitle=false&pagenumbers=false' +
    '&gridlines=false' +
    '&fzr=false' +
    '&gid=' + tempSheet.getSheetId();

  var token = ScriptApp.getOAuthToken();
  var options = {
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(exportUrl, options);
    if (response.getResponseCode() === 200) {
      var blob = response.getBlob().setName(pdfName);
      var file = folder.createFile(blob);
      return file.getUrl();
    } else {
      return 'Gagal_Membuat_PDF';
    }
  } catch (e) {
    return 'Gagal_Membuat_PDF: ' + e.toString();
  } finally {
    // Pastikan sheet temporary selalu dihapus, bahkan jika terjadi error
    if (tempSheet) {
      ss.deleteSheet(tempSheet);
    }
  }
}
