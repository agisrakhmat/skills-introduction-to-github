// Entry point for Google Apps Script

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : "login";
  // Security check: only allow known pages or simple alphanumeric
  if (!/^[a-z0-9_]+$/i.test(page)) page = "login";

  try {
    var output = HtmlService.createTemplateFromFile('frontend/' + page);
    return output.evaluate()
        .setTitle(Config.APP_NAME)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    return HtmlService.createHtmlOutput("Page not found: " + err.toString());
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return createJSONOutput({status: "error", error: "Server Busy, please try again."});
  }

  var result = { status: "success" };

  try {
    if (!e || !e.parameter) throw new Error("No parameters");
    var action = e.parameter.action;

    if (action === "register") {
       var email = e.parameter.email;
       var fullName = e.parameter.full_name;
       var phone = e.parameter.phone;

       // Check if user exists
       var existing = Database.findOne("USERS", "phone", Utils.normalizePhone(phone));
       if (existing) throw new Error("User already exists with this phone.");

       var newUser = Auth.registerStudent(email, fullName, phone);
       Database.insert("USERS", newUser);

       result.data = {
         user_id: newUser.user_id,
         default_password: Auth.generateDefaultPassword(newUser.phone) // Return for demo/testing, usually send via WA
       };

    } else if (action === "login") {
       var phone = Utils.normalizePhone(e.parameter.phone);
       var password = e.parameter.password;

       var user = Database.findOne("USERS", "phone", phone);
       if (!user) throw new Error("User not found");

       var isValid = Auth.login(null, password, user);
       if (!isValid) throw new Error("Invalid password");

       result.data = {
         user_id: user.user_id,
         full_name: user.full_name,
         role: user.role
       };

    } else {
       throw new Error("Unknown action: " + action);
    }

  } catch (err) {
    result.status = "error";
    result.error = err.toString();
  } finally {
    lock.releaseLock();
  }

  return createJSONOutput(result);
}

function createJSONOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
