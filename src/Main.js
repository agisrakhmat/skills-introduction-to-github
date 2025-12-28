// Main.js - Web App Entry Point

function doGet(e) {
  const page = e.parameter.page || 'login_student';

  let template;
  let title = 'Diploma Ilmi LMS';

  switch (page) {
    case 'login_student':
      template = HtmlService.createTemplateFromFile('frontend/Login_Student');
      title = 'Login Mahasiswa - Diploma Ilmi';
      break;
    case 'dashboard_student':
      template = HtmlService.createTemplateFromFile('frontend/Dashboard_Student');
      title = 'Dashboard Mahasiswa - Diploma Ilmi';
      break;
    case 'course_room':
        template = HtmlService.createTemplateFromFile('frontend/Course_Room');
        // Pass ID to template for initial render if needed, though JS fetches it too
        template.course_id = e.parameter.course_id || '';
        title = 'Kelas Online';
        break;
    default:
      return HtmlService.createHtmlOutput('Page not found');
  }

  // Helper for template to get script URL
  template.getScriptUrl = getScriptUrl;

  return template.evaluate()
      .setTitle(title)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Include external files in HTML
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
