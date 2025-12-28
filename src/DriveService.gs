// src/DriveService.gs

/**
 * Saves a base64 encoded file to a specific Google Drive folder.
 *
 * @param {string} base64Data - The raw base64 string (without data:image/png;base64, prefix if possible, or strip it)
 * @param {string} mimeType - The mime type of the file (e.g., 'image/jpeg', 'application/pdf')
 * @param {string} fileName - The desired name for the file
 * @param {string} folderId - The ID of the folder to save to
 * @returns {string} The URL of the uploaded file
 */
function saveFileToDrive(base64Data, mimeType, fileName, folderId) {
  try {
    // Handle data URI scheme if present
    var data = base64Data;
    if (data.indexOf('base64,') > -1) {
      data = data.split('base64,')[1];
    }

    var blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, fileName);
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);

    // Make sure it's accessible (depending on privacy needs, usually users need to see their own files)
    // For now, we return the URL. Permissions might need to be "Anyone with link" or kept private if using a service account logic,
    // but GAS runs as the owner (Me), so I can see it. Users might need permission to view if they click the link.
    // For this simple LMS, we assume the Admin/Staff view it.
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file.getUrl();
  } catch (e) {
    Logger.log("Error saving file to drive: " + e.toString());
    throw new Error("Failed to save file: " + e.toString());
  }
}
