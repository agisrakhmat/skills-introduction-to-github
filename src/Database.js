// Database interactions

if (typeof require !== 'undefined') {
    var Config = require('./Config');
}

var Database = {
    /**
     * Helper to get a sheet by name.
     * @param {string} sheetName
     * @returns {GoogleAppsScript.Spreadsheet.Sheet}
     */
    getSheet: function(sheetName) {
        if (typeof SpreadsheetApp === 'undefined') {
            throw new Error('SpreadsheetApp is not defined. Ensure you are running in Google Apps Script or mocking it.');
        }

        var ss;
        if (Config.SPREADSHEET_ID) {
            try {
                ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
            } catch (e) {
                // Fallback to active spreadsheet if ID is invalid or not found
                console.warn('Could not open spreadsheet by ID, using active spreadsheet: ' + e.message);
                ss = SpreadsheetApp.getActiveSpreadsheet();
            }
        } else {
            ss = SpreadsheetApp.getActiveSpreadsheet();
        }

        if (!ss) {
            throw new Error('No active spreadsheet found and no valid ID provided.');
        }

        return ss.getSheetByName(sheetName);
    },

    /**
     * Get all data from a sheet as an array of objects.
     * Assumes the first row contains headers.
     * @param {string} sheetName
     * @returns {Array<Object>}
     */
    getTableData: function(sheetName) {
        var sheet = this.getSheet(sheetName);
        if (!sheet) return [];

        var data = sheet.getDataRange().getValues();
        if (data.length < 2) return []; // Only headers or empty

        var headers = data[0];
        var rows = data.slice(1);

        return rows.map(function(row) {
            var obj = {};
            headers.forEach(function(header, index) {
                obj[header] = row[index];
            });
            return obj;
        });
    },

    /**
     * Find a user by email or phone.
     * @param {string} identifier - Email or Phone
     * @returns {Object|null}
     */
    findUser: function(identifier) {
        var users = this.getTableData(Config.SHEET_USERS);
        for (var i = 0; i < users.length; i++) {
            var u = users[i];
            if (String(u.email) === identifier || String(u.phone) === identifier) {
                return u;
            }
        }
        return null;
    },

    /**
     * Find a user by ID.
     * @param {string} userId
     * @returns {Object|null}
     */
    findUserById: function(userId) {
        var users = this.getTableData(Config.SHEET_USERS);
        for (var i = 0; i < users.length; i++) {
            if (String(users[i].user_id) === userId) {
                return users[i];
            }
        }
        return null;
    }
};

// Export for Node.js testing
if (typeof module !== 'undefined') {
    module.exports = Database;
}
