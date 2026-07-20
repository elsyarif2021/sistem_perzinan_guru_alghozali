export interface GASFile {
  name: string;
  description: string;
  type: "gs" | "html";
  content: string;
}

export const GAS_SOURCES: GASFile[] = [
  {
    name: "Code.gs",
    description: "Main Entry Point for Google Apps Script Web App. Handles routing, template inclusion, and user sessions.",
    type: "gs",
    content: `/**
 * SISTEM INFORMASI PERIZINAN GURU (SIPEG)
 * YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL GHOZALI
 * 
 * Entry Point Web App (Code.gs)
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('Dashboard')
    .evaluate()
    .setTitle('SIPEG - Pondok Modern Al Ghozali')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Helper to include files in HTML template
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Session login handler
function checkLogin(username, password, role) {
  try {
    var users = getTableData("DATA_USER");
    var foundUser = null;
    
    for (var i = 0; i < users.length; i++) {
      if (users[i].Username.toLowerCase() === username.toLowerCase() && 
          users[i].PasswordRaw === password && 
          users[i].Role === role) {
        foundUser = users[i];
        break;
      }
    }
    
    if (foundUser) {
      var teacherInfo = null;
      if (foundUser.NIP !== "-") {
        var teachers = getTableData("DATA_GURU");
        for (var j = 0; j < teachers.length; j++) {
          if (teachers[j].NIP === foundUser.NIP) {
            teacherInfo = teachers[j];
            break;
          }
        }
      }
      
      writeLog(username, "Login", "Berhasil masuk dengan peran " + role);
      
      return {
        success: true,
        user: {
          username: foundUser.Username,
          role: foundUser.Role,
          nip: foundUser.NIP,
          email: foundUser.Email,
          teacher: teacherInfo
        }
      };
    } else {
      return { success: false, message: "Username, password, atau peran salah." };
    }
  } catch (error) {
    return { success: false, message: "Kesalahan server: " + error.toString() };
  }
}`
  },
  {
    name: "Database.gs",
    description: "Database Engine linking Google Sheets tables. Implements CRUD operations, schema setups, and transactions.",
    type: "gs",
    content: `/**
 * Database Engine - Google Sheets Integration
 */

var SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_ANDA_DISINI";

function getSpreadsheet() {
  if (SPREADSHEET_ID === "MASUKKAN_ID_SPREADSHEET_ANDA_DISINI") {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Get all data from a table (Sheet) as JSON objects
function getTableData(tableName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    throw new Error("Sheet " + tableName + " tidak ditemukan.");
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only headers
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    var emptyRow = true;
    
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val !== "") emptyRow = false;
      obj[headers[j]] = val;
    }
    
    if (!emptyRow) {
      result.push(obj);
    }
  }
  
  return result;
}

// Add a new row to a Sheet
function addTableRow(tableName, record) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) throw new Error("Sheet tidak ditemukan.");
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = [];
  
  for (var i = 0; i < headers.length; i++) {
    newRow.push(record[headers[i]] !== undefined ? record[headers[i]] : "");
  }
  
  sheet.appendRow(newRow);
  return true;
}

// Update a row in a Sheet by key
function updateTableRow(tableName, keyName, keyValue, record) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) throw new Error("Sheet tidak ditemukan.");
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyColIndex = headers.indexOf(keyName);
  
  if (keyColIndex === -1) throw new Error("Key " + keyName + " tidak ditemukan.");
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyColIndex]) === String(keyValue)) {
      var rowNum = i + 1;
      for (var k = 0; k < headers.length; k++) {
        var header = headers[k];
        if (record[header] !== undefined) {
          sheet.getRange(rowNum, k + 1).setValue(record[header]);
        }
      }
      return true;
    }
  }
  return false;
}

// Delete a row in a Sheet by key
function deleteTableRow(tableName, keyName, keyValue) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) throw new Error("Sheet tidak ditemukan.");
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyColIndex = headers.indexOf(keyName);
  
  if (keyColIndex === -1) throw new Error("Key tidak ditemukan.");
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyColIndex]) === String(keyValue)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// Get available substitutes during specific teaching periods
function getAvailableSubstitutesGAS(hari, jamKeList, excludeNIP) {
  var allGuru = getTableData("DATA_GURU");
  var allJadwal = getTableData("DATA_JADWAL");
  var allIzin = getTableData("DATA_IZIN");
  var allPengganti = getTableData("DATA_GURU_PENGGANTI");
  
  var jamNums = jamKeList.map(Number);
  var available = [];
  
  for (var i = 0; i < allGuru.length; i++) {
    var guru = allGuru[i];
    if (guru.NIP === excludeNIP) continue;
    
    // Check if scheduled
    var hasClass = false;
    for (var j = 0; j < allJadwal.length; j++) {
      var sch = allJadwal[j];
      if (sch.NIP === guru.NIP && sch.Hari === hari && jamNums.indexOf(Number(sch.JamKe)) !== -1) {
        hasClass = true;
        break;
      }
    }
    if (hasClass) continue;
    
    // Check if already substituting
    var isBusy = false;
    for (var k = 0; k < allPengganti.length; k++) {
      var sub = allPengganti[k];
      if (sub.NIPPengganti === guru.NIP && jamNums.indexOf(Number(sub.JamKe)) !== -1) {
        // Only busy if related permit is active (pending/approved)
        for (var m = 0; m < allIzin.length; m++) {
          if (allIzin[m].IdIzin === sub.IdIzin && (allIzin[m].Status === "Menunggu Persetujuan" || allIzin[m].Status === "Disetujui")) {
            isBusy = true;
            break;
          }
        }
      }
      if (isBusy) break;
    }
    
    if (!isBusy) {
      available.push(guru);
    }
  }
  
  return available;
}`
  },
  {
    name: "Drive.gs",
    description: "Handles integration with Google Drive. Saves file uploads, creates directories, and handles backups.",
    type: "gs",
    content: `/**
 * Google Drive Storage Integration
 */

var ROOT_FOLDER_NAME = "SIPEG_AlGhozali_Database";

function getOrCreateFolder(folderName, parentFolder) {
  var folders;
  if (parentFolder) {
    folders = parentFolder.getFoldersByName(folderName);
  } else {
    folders = DriveApp.getFoldersByName(folderName);
  }
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    if (parentFolder) {
      return parentFolder.createFolder(folderName);
    } else {
      return DriveApp.createFolder(folderName);
    }
  }
}

// Upload file to Google Drive and return URL
function uploadFileToDrive(base64Data, originalFileName, folderSubName) {
  try {
    var rootFolder = getOrCreateFolder(ROOT_FOLDER_NAME);
    var subFolder = getOrCreateFolder(folderSubName, rootFolder);
    
    var splitData = base64Data.split(',');
    var contentType = splitData[0].match(/:(.*?);/)[1];
    var rawData = splitData[1];
    
    var decoded = Utilities.base64Decode(rawData);
    var blob = Utilities.newBlob(decoded, contentType, originalFileName);
    
    var file = subFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      url: file.getUrl(),
      name: file.getName(),
      id: file.getId()
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Generate Database Backup JSON
function backupDatabaseToDrive() {
  try {
    var tables = [
      "DATA_GURU", "DATA_MAPEL", "DATA_KELAS", "DATA_JADWAL", 
      "DATA_IZIN", "DATA_GURU_PENGGANTI", "DATA_LOG", "DATA_USER", "DATA_APPROVAL"
    ];
    var backupObj = {};
    
    tables.forEach(function(t) {
      backupObj[t] = getTableData(t);
    });
    
    var rootFolder = getOrCreateFolder(ROOT_FOLDER_NAME);
    var backupFolder = getOrCreateFolder("Backup", rootFolder);
    
    var fileName = "Backup_SIPEG_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".json";
    var blob = Utilities.newBlob(JSON.stringify(backupObj, null, 2), "application/json", fileName);
    
    var file = backupFolder.createFile(blob);
    writeLog("SYSTEM", "Backup", "Database dicadangkan otomatis ke Drive: " + fileName);
    
    return { success: true, fileName: fileName, url: file.getUrl() };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}`
  },
  {
    name: "Email.gs",
    description: "Notification System utilizing GmailApp. Sends transactional notification emails to teachers and administrators.",
    type: "gs",
    content: `/**
 * Gmail Notification Engine
 */

function sendNotificationEmail(toEmail, subject, htmlBody) {
  try {
    // Only send if email is valid and not empty
    if (!toEmail || toEmail.indexOf('@') === -1) return false;
    
    MailApp.sendEmail({
      to: toEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: "SIPEG Pondok Modern Al Ghozali"
    });
    return true;
  } catch (error) {
    console.error("Gagal mengirim email ke " + toEmail + ": " + error.toString());
    return false;
  }
}

// Generate HTML Email Layout
function buildEmailTemplate(title, preheader, contentHtml) {
  return '<div style="font-family: sans-serif; background-color: #f6f9fc; padding: 30px; font-size: 14px; color: #333333;">' +
         '  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e1e8ed; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">' +
         '    <div style="background-color: #0f172a; padding: 25px; text-align: center; color: #ffffff;">' +
         '      <h2 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">SIPEG AL GHOZALI</h2>' +
         '      <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Pondok Modern Al Ghozali</p>' +
         '    </div>' +
         '    <div style="padding: 30px; line-height: 1.6;">' +
         '      <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">' + title + '</h3>' +
         '      <p style="font-size: 12px; color: #64748b; font-style: italic; margin-bottom: 20px;">' + preheader + '</p>' +
         '      ' + contentHtml + '' +
         '    </div>' +
         '    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">' +
         '      <p style="margin: 0;">Sistem Informasi Perizinan Guru (SIPEG) &copy; 2026</p>' +
         '      <p style="margin: 5px 0 0 0;">YPI Pondok Modern Al Ghozali, Bogor, Jawa Barat</p>' +
         '    </div>' +
         '  </div>' +
         '</div>';
}`
  },
  {
    name: "Utils.gs",
    description: "General utility functions like audit logging, auto-number generation, and date format handlers.",
    type: "gs",
    content: `/**
 * Helper and Utility functions
 */

// Format ISO date to Indonesian readable format
function formatIndoDate(dateStr) {
  if (!dateStr) return "-";
  var d = new Date(dateStr);
  var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  
  return days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

// Write Audit Log to DATA_LOG Sheet
function writeLog(username, activity, details) {
  try {
    var idLog = "L-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMddHHmmss") + Math.floor(Math.random()*1000);
    var timestamp = new Date().toISOString();
    
    addTableRow("DATA_LOG", {
      "IdLog": idLog,
      "Timestamp": timestamp,
      "User": username,
      "Activity": activity,
      "Details": details
    });
  } catch (error) {
    console.error("Gagal mencatat log: " + error.toString());
  }
}

// Check role privilege
function verifyUserRole(user, allowedRoles) {
  if (!user) return false;
  return allowedRoles.indexOf(user.role) !== -1;
}`
  },
  {
    name: "Login.html",
    description: "Responsive, modern login view built with Tailwind CSS, supporting fast simulation presets.",
    type: "html",
    content: `<!-- VIEW LOGIN TEMPLATE (Login.html) -->
<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
  <div class="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
    <div class="text-center">
      <div class="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
        G
      </div>
      <h2 class="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        SIPEG AL GHOZALI
      </h2>
      <p class="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Sistem Perizinan Guru Pondok Modern Al Ghozali
      </p>
    </div>
    
    <form class="mt-8 space-y-4" id="loginForm" onsubmit="handleFormLogin(event)">
      <div>
        <label for="username" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
        <input id="username" name="username" type="text" required class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm">
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
        <input id="password" name="password" type="password" required class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm">
      </div>
      <div>
        <label for="role" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Peran Akun</label>
        <select id="role" name="role" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
          <option value="Guru">Guru</option>
          <option value="Guru Piket">Guru Piket</option>
          <option value="Waka Kurikulum">Waka Kurikulum</option>
          <option value="Kepala Bidang Pendidikan">Kepala Bidang Pendidikan</option>
          <option value="Administrator">Administrator</option>
        </select>
      </div>

      <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Masuk Aplikasi
      </button>
    </form>
  </div>
</div>`
  },
  {
    name: "Dashboard.html",
    description: "Main Shell and Layout HTML template. Dynamically pulls Style, Script, Login, and Tab views.",
    type: "html",
    content: `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <!-- Load Bootstrap 5 & Tailwind Play for prototyping -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class'
      }
    </script>
    <?!= include('Style'); ?>
  </head>
  <body class="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
    <div id="loading-screen" class="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white">
      <div class="spinner-border text-light mb-3" role="status"></div>
      <p class="font-medium tracking-wide">Memuat SIPEG Al Ghozali...</p>
    </div>

    <!-- MAIN SHELL -->
    <div id="app" class="hidden min-h-screen flex flex-col">
      <!-- Navbar, sidebar and dynamic layout handled in scripts -->
    </div>

    <?!= include('Script'); ?>
  </body>
</html>`
  }
];
