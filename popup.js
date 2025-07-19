document.addEventListener('DOMContentLoaded', function() {
  // State management
  const state = {
    backupRootPath: 'brave-backups',
    lastUsedDirectory: null,
    isExporting: false,
    isImporting: false,
    driveConnected: false,
    driveAccessToken: null,
    driveClientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    gapiLoaded: false
  };

  // Google Drive API configuration
  const driveConfig = {
    apiKey: 'YOUR_API_KEY',
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    scopes: "https://www.googleapis.com/auth/drive.file"
  };

  // UI Elements
  const ui = {
    settingsToggle: document.getElementById('settingsToggle'),
    settingsPanel: document.getElementById('settingsPanel'),
    backupPathInput: document.getElementById('backupPath'),
    changeDirectoryBtn: document.getElementById('changeDirectoryBtn'),
    directorySupportText: document.getElementById('directorySupportText'),
    statusDiv: document.getElementById('status'),
    exportButton: document.getElementById('exportButton'),
    exportButtonText: document.getElementById('exportButtonText'),
    exportProgressBar: document.getElementById('exportProgressBar'),
    exportProgressText: document.getElementById('exportProgressText'),
    importButton: document.getElementById('importButton'),
    importButtonText: document.getElementById('importButtonText'),
    importProgressBar: document.getElementById('importProgressBar'),
    importProgressText: document.getElementById('importProgressText'),
    importFileInput: document.getElementById('importFile'),
    driveStatusIcon: document.getElementById('driveStatusIcon'),
    driveStatusText: document.getElementById('driveStatusText'),
    connectDriveBtn: document.getElementById('connectDriveBtn'),
    disconnectDriveBtn: document.getElementById('disconnectDriveBtn')
  };

  // Initialize the extension
  function init() {
    loadSettings();
    setupEventListeners();
    checkDirectoryAccessSupport();
    
    // Load Google API client
    if (!state.gapiLoaded) {
      gapi.load('client:auth2', () => {
        state.gapiLoaded = true;
        initGoogleClient();
      });
    }
  }

  // Get OS timestamp (more accurate than browser time)
  async function getOSTimestamp() {
    try {
      // First try to get timezone-adjusted time
      const now = new Date();
      
      // Get platform info which helps get closer to OS time
      const platformInfo = await new Promise(resolve => {
        chrome.runtime.getPlatformInfo(resolve);
      });
      
      // Calculate timezone offset in minutes
      const timezoneOffset = now.getTimezoneOffset();
      
      // Create new date adjusted by timezone offset
      const osTime = new Date(now.getTime() - (timezoneOffset * 60000));
      
      // Format: YYYY-MM-DD_HH-MM-SS
      return osTime.toISOString()
        .replace(/T/, '_')         // Replace T with underscore
        .replace(/\..+/, '')       // Remove milliseconds
        .replace(/:/g, '-');       // Replace colons with hyphens
        
    } catch (error) {
      console.error("Error getting OS time, falling back to browser time:", error);
      // Fallback to browser time if OS time fails
      return new Date().toISOString()
        .replace(/T/, '_')
        .replace(/\..+/, '')
        .replace(/:/g, '-');
    }
  }

  // Initialize Google API client
  function initGoogleClient() {
    gapi.client.init({
      apiKey: driveConfig.apiKey,
      clientId: state.driveClientId,
      discoveryDocs: driveConfig.discoveryDocs,
      scope: driveConfig.scopes
    }).then(() => {
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateDriveStatus);
      updateDriveStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }).catch(err => {
      console.error("Error initializing Google client:", err);
      updateStatus("Error initializing Google Drive connection", true);
    });
  }

  // Update Drive connection status
  function updateDriveStatus(isConnected) {
    state.driveConnected = isConnected;
    
    if (isConnected) {
      ui.driveStatusIcon.innerHTML = '<path fill="#0F9D58" d="M7.71,3.5L1.15,15L4.58,21L11.13,9.5M9.73,15L6.3,21H19.42L22.85,15M22.28,14L15.42,2H8.58L8.57,2L15.43,14H22.28Z" />';
      ui.driveStatusText.textContent = 'Google Drive: Connected';
      ui.driveStatusText.style.color = '#0F9D58';
      ui.connectDriveBtn.disabled = true;
      ui.disconnectDriveBtn.disabled = false;
      state.driveAccessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
    } else {
      ui.driveStatusIcon.innerHTML = '<path fill="#757575" d="M7.71,3.5L1.15,15L4.58,21L11.13,9.5M9.73,15L6.3,21H19.42L22.85,15M22.28,14L15.42,2H8.58L8.57,2L15.43,14H22.28Z" />';
      ui.driveStatusText.textContent = 'Google Drive: Not connected';
      ui.driveStatusText.style.color = '#757575';
      ui.connectDriveBtn.disabled = false;
      ui.disconnectDriveBtn.disabled = true;
      state.driveAccessToken = null;
    }
  }

  // Connect to Google Drive
  function connectToDrive() {
    gapi.auth2.getAuthInstance().signIn().then(() => {
      updateDriveStatus(true);
      updateStatus("Successfully connected to Google Drive", false, true);
    }).catch(err => {
      console.error("Error signing in:", err);
      updateStatus("Error connecting to Google Drive: " + err.error, true);
    });
  }

  // Disconnect from Google Drive
  function disconnectFromDrive() {
    gapi.auth2.getAuthInstance().signOut().then(() => {
      updateDriveStatus(false);
      updateStatus("Disconnected from Google Drive");
    });
  }

  // Load saved settings
  function loadSettings() {
    chrome.storage.local.get(['backupRootPath', 'lastUsedDirectory'], function(result) {
      if (result.backupRootPath) {
        state.backupRootPath = result.backupRootPath;
      }
      if (result.lastUsedDirectory) {
        state.lastUsedDirectory = result.lastUsedDirectory;
        ui.backupPathInput.value = state.lastUsedDirectory;
      } else {
        ui.backupPathInput.value = 'Downloads/brave-backups';
      }
    });
  }

  // Save settings
  async function saveSettings() {
    await chrome.storage.local.set({ 
      backupRootPath: state.backupRootPath,
      lastUsedDirectory: state.lastUsedDirectory
    });
  }

  // Setup all event listeners
  function setupEventListeners() {
    // Settings toggle
    ui.settingsToggle.addEventListener('click', function() {
      ui.settingsPanel.style.display = ui.settingsPanel.style.display === 'none' ? 'block' : 'none';
    });

    // Directory selection
    ui.changeDirectoryBtn.addEventListener('click', function() {
      if (state.isExporting || state.isImporting) return;
      selectBackupDirectory();
    });

    // Export button
    ui.exportButton.addEventListener('click', async function() {
      if (state.isExporting || state.isImporting) return;
      await executeExport();
    });

    // Import button
    ui.importButton.addEventListener('click', async function() {
      if (state.isExporting || state.isImporting) return;
      await executeImport();
    });

    // File input change
    ui.importFileInput.addEventListener('change', function() {
      const files = Array.from(this.files);
      updateStatus(`Selected ${files.length} files for import`);
    });

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', function() {
        if (state.isExporting || state.isImporting) return;
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        this.classList.add('active');
        document.getElementById(`${this.dataset.tab}Tab`).classList.add('active');
      });
    });

    // Drive connection buttons
    ui.connectDriveBtn.addEventListener('click', connectToDrive);
    ui.disconnectDriveBtn.addEventListener('click', disconnectFromDrive);
  }

  // Check for File System Access API support
  function checkDirectoryAccessSupport() {
    const hasDirectoryAccess = 'showDirectoryPicker' in window;
    ui.directorySupportText.textContent = hasDirectoryAccess
      ? "Your browser supports advanced directory selection"
      : "Your browser uses the Downloads folder for backups";
    ui.directorySupportText.className = hasDirectoryAccess ? "info-text success" : "info-text";
  }

  // Select backup directory
  async function selectBackupDirectory() {
    try {
      // Create hidden file input for directory selection
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.webkitdirectory = true;
      fileInput.style.display = 'none';
      
      fileInput.addEventListener('change', async function(event) {
        if (event.target.files.length > 0) {
          // Extract directory path from the first file
          const fullPath = event.target.files[0].webkitRelativePath;
          const directoryPath = fullPath.split('/').slice(0, -1).join('/') || 
                               event.target.files[0].name;
          
          state.backupRootPath = directoryPath;
          state.lastUsedDirectory = directoryPath;
          
          await saveSettings();
          ui.backupPathInput.value = state.lastUsedDirectory;
          updateStatus("Backup location updated successfully", false, true);
        }
      });
      
      // Trigger the file dialog
      document.body.appendChild(fileInput);
      fileInput.click();
      setTimeout(() => {
        document.body.removeChild(fileInput);
      }, 1000);
      
    } catch (error) {
      console.error("Directory selection error:", error);
      updateStatus("Error selecting directory: " + error.message, true);
    }
  }

  // Update status message
  function updateStatus(message, isError = false, isSuccess = false) {
    ui.statusDiv.textContent = message;
    ui.statusDiv.style.color = isError ? '#d32f2f' : isSuccess ? '#388e3c' : '#666';
  }

  // Update progress
  function updateProgress(type, percent) {
    const progressBar = type === 'export' ? ui.exportProgressBar : ui.importProgressBar;
    const progressText = type === 'export' ? ui.exportProgressText : ui.importProgressText;
    
    const roundedPercent = Math.min(100, Math.max(0, Math.round(percent)));
    progressBar.style.width = `${roundedPercent}%`;
    progressText.textContent = `${roundedPercent}%`;
  }

  // Reset progress
  function resetProgress(type) {
    updateProgress(type, 0);
  }

  // Execute export with OS timestamp
  async function executeExport() {
    state.isExporting = true;
    ui.exportButton.disabled = true;
    ui.exportButtonText.textContent = "Exporting...";
    updateStatus("Preparing export...");
    resetProgress('export');
    
    try {
      // Get OS-based timestamp
      const timestamp = await getOSTimestamp();
      const backupFolderName = `brave-backup-${timestamp}`;
      
      const exportData = {
        metadata: {
          browser: "Brave",
          version: navigator.userAgent,
          created: new Date().toISOString()
        },
        options: {
          bookmarks: document.getElementById('saveBookmarks').checked,
          history: document.getElementById('saveHistory').checked,
          cookies: document.getElementById('saveCookies').checked,
          extensions: document.getElementById('saveExtensions').checked
        }
      };
      
      let progress = 0;
      const totalSteps = Object.values(exportData.options).filter(v => v).length;
      const progressIncrement = totalSteps > 0 ? 100 / totalSteps : 100;
      
      // Export bookmarks if selected
      if (exportData.options.bookmarks) {
        updateStatus("Exporting bookmarks...");
        await exportBookmarks(backupFolderName, timestamp);
        progress += progressIncrement;
        updateProgress('export', progress);
      }
      
      // Export extensions if selected
      if (exportData.options.extensions) {
        updateStatus("Exporting extensions list...");
        await exportExtensionsList(backupFolderName, timestamp);
        progress += progressIncrement;
        updateProgress('export', progress);
      }
      
      // Export other data if selected
      if (exportData.options.history || exportData.options.cookies) {
        updateStatus("Exporting browser data...");
        await exportBrowserData(backupFolderName, timestamp, exportData.options);
        progress += progressIncrement;
        updateProgress('export', progress);
      }
      
      // Save metadata file
      updateStatus("Finalizing export...");
      await exportMetadata(backupFolderName, timestamp, exportData);
      updateProgress('export', 100);
      
      updateStatus(`Export complete! Saved to ${state.driveConnected ? 'Google Drive' : state.lastUsedDirectory}/${backupFolderName}`, false, true);
    } catch (error) {
      console.error("Export error:", error);
      updateStatus("Error: " + error.message, true);
    } finally {
      ui.exportButton.disabled = false;
      ui.exportButtonText.textContent = "Export Data";
      state.isExporting = false;
    }
  }

  // Export bookmarks
  async function exportBookmarks(folderName, timestamp) {
    const bookmarks = await chrome.bookmarks.getTree();
    const htmlContent = generateBookmarksHTML(bookmarks);
    
    if (state.driveConnected) {
      try {
        // Find or create backup folder
        let backupFolder = await findDriveFolder('BraveBackups');
        if (!backupFolder) {
          backupFolder = await createDriveFolder('BraveBackups');
        }
        
        // Create timestamped subfolder
        const subfolder = await createDriveFolder(folderName, backupFolder.id);
        
        // Upload bookmarks file
        await uploadToDrive(
          `bookmarks-${timestamp}.html`,
          htmlContent,
          'text/html',
          subfolder.id
        );
        
        return;
      } catch (error) {
        console.error("Google Drive export error:", error);
        updateStatus("Error exporting to Google Drive. Falling back to local export.", true);
        // Fall through to local export
      }
    }
    
    // Local export fallback
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    await chrome.downloads.download({
      url: url,
      filename: `${state.backupRootPath}/${folderName}/bookmarks-${timestamp}.html`,
      conflictAction: 'uniquify',
      saveAs: false
    });
  }

  // Export extensions list
  async function exportExtensionsList(folderName, timestamp) {
    const extensions = await chrome.management.getAll();
    const filteredExtensions = extensions.filter(ext => 
      ext.id !== chrome.runtime.id && ext.type === 'extension');
    
    const extensionsData = {
      generated: new Date().toISOString(),
      count: filteredExtensions.length,
      extensions: filteredExtensions.map(ext => ({
        name: ext.name,
        id: ext.id,
        version: ext.version,
        enabled: ext.enabled,
        installType: ext.installType,
        homepageUrl: ext.homepageUrl,
        storeUrl: `https://chrome.google.com/webstore/detail/${ext.id}`
      }))
    };
    
    const jsonContent = JSON.stringify(extensionsData, null, 2);
    
    if (state.driveConnected) {
      try {
        const backupFolder = await findDriveFolder('BraveBackups');
        if (!backupFolder) throw new Error("Backup folder not found");
        
        const subfolder = await findDriveFolder(folderName, backupFolder.id);
        if (!subfolder) throw new Error("Backup subfolder not found");
        
        await uploadToDrive(
          `extensions-${timestamp}.json`,
          jsonContent,
          'application/json',
          subfolder.id
        );
        return;
      } catch (error) {
        console.error("Google Drive export error:", error);
        updateStatus("Error exporting to Google Drive. Falling back to local export.", true);
      }
    }
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    await chrome.downloads.download({
      url: url,
      filename: `${state.backupRootPath}/${folderName}/extensions-${timestamp}.json`,
      conflictAction: 'uniquify',
      saveAs: false
    });
  }

  // Export browser data
  async function exportBrowserData(folderName, timestamp, options) {
    const config = {
      history: options.history,
      cookies: options.cookies,
      savedAt: new Date().toISOString()
    };
    
    const jsonContent = JSON.stringify(config, null, 2);
    
    if (state.driveConnected) {
      try {
        const backupFolder = await findDriveFolder('BraveBackups');
        if (!backupFolder) throw new Error("Backup folder not found");
        
        const subfolder = await findDriveFolder(folderName, backupFolder.id);
        if (!subfolder) throw new Error("Backup subfolder not found");
        
        await uploadToDrive(
          `browser-config-${timestamp}.json`,
          jsonContent,
          'application/json',
          subfolder.id
        );
        return;
      } catch (error) {
        console.error("Google Drive export error:", error);
        updateStatus("Error exporting to Google Drive. Falling back to local export.", true);
      }
    }
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    await chrome.downloads.download({
      url: url,
      filename: `${state.backupRootPath}/${folderName}/browser-config-${timestamp}.json`,
      conflictAction: 'uniquify',
      saveAs: false
    });
  }

  // Export metadata
  async function exportMetadata(folderName, timestamp, exportData) {
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    if (state.driveConnected) {
      try {
        const backupFolder = await findDriveFolder('BraveBackups');
        if (!backupFolder) throw new Error("Backup folder not found");
        
        const subfolder = await findDriveFolder(folderName, backupFolder.id);
        if (!subfolder) throw new Error("Backup subfolder not found");
        
        await uploadToDrive(
          `export-metadata-${timestamp}.json`,
          jsonContent,
          'application/json',
          subfolder.id
        );
        return;
      } catch (error) {
        console.error("Google Drive export error:", error);
        updateStatus("Error exporting to Google Drive. Falling back to local export.", true);
      }
    }
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    await chrome.downloads.download({
      url: url,
      filename: `${state.backupRootPath}/${folderName}/export-metadata-${timestamp}.json`,
      conflictAction: 'uniquify',
      saveAs: false
    });
  }

  // Generate bookmarks HTML
  function generateBookmarksHTML(bookmarks) {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>\n`;
    
    function processNode(node, depth = 1) {
      if (node.children) {
        const indent = '    '.repeat(depth);
        html += `${indent}<DT><H3>${node.title || 'Folder'}</H3>\n${indent}<DL><p>\n`;
        node.children.forEach(child => processNode(child, depth + 1));
        html += `${indent}</DL><p>\n`;
      } else if (node.url) {
        const indent = '    '.repeat(depth);
        html += `${indent}<DT><A HREF="${node.url}">${node.title || node.url}</A>\n`;
      }
    }
    
    bookmarks.forEach(bookmark => processNode(bookmark));
    html += '</DL><p>\n';
    return html;
  }

  // Upload file to Google Drive
  async function uploadToDrive(filename, content, mimeType, folderId = null) {
    const file = new Blob([content], { type: mimeType });
    const metadata = {
      name: filename,
      mimeType: mimeType,
      parents: folderId ? [folderId] : []
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({
          'Authorization': 'Bearer ' + state.driveAccessToken
        }),
        body: form
      });
      
      if (!response.ok) {
        throw new Error(`Google Drive upload failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  // Create folder in Google Drive
  async function createDriveFolder(folderName, parentId = null) {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    };

    try {
      const response = await gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id,name'
      });
      
      return response.result;
    } catch (error) {
      console.error("Folder creation error:", error);
      throw error;
    }
  }

  // Find folder in Google Drive
  async function findDriveFolder(folderName, parentId = null) {
    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    try {
      const response = await gapi.client.drive.files.list({
        q: query,
        fields: 'files(id,name)',
        spaces: 'drive'
      });
      
      return response.result.files.length > 0 ? response.result.files[0] : null;
    } catch (error) {
      console.error("Folder search error:", error);
      throw error;
    }
  }

  // Execute import
  async function executeImport() {
    const files = Array.from(ui.importFileInput.files);
    if (files.length === 0) {
      updateStatus("Please select backup files first", true);
      return;
    }
    
    state.isImporting = true;
    ui.importButton.disabled = true;
    ui.importButtonText.textContent = "Importing...";
    updateStatus("Starting import...");
    resetProgress('import');
    
    try {
      const importOptions = {
        bookmarks: document.getElementById('importBookmarks').checked,
        history: document.getElementById('importHistory').checked,
        cookies: document.getElementById('importCookies').checked,
        extensions: document.getElementById('importExtensions').checked
      };
      
      let progress = 0;
      const totalSteps = Object.values(importOptions).filter(v => v).length;
      const progressIncrement = totalSteps > 0 ? 100 / totalSteps : 100;
      
      // Find metadata file
      const metadataFile = files.find(f => f.name.includes('metadata'));
      let metadata = {};
      
      if (metadataFile) {
        metadata = await readFileAsJSON(metadataFile);
        updateStatus("Found backup metadata");
      }
      
      // Import bookmarks if selected
      if (importOptions.bookmarks) {
        const bookmarksFile = files.find(f => f.name.includes('bookmarks'));
        if (bookmarksFile) {
          updateStatus("Importing bookmarks...");
          await importBookmarks(bookmarksFile);
          progress += progressIncrement;
          updateProgress('import', progress);
        } else {
          updateStatus("No bookmarks file found in backup", true);
        }
      }
      
      // Install extensions if selected
      if (importOptions.extensions) {
        const extensionsFile = files.find(f => f.name.includes('extensions'));
        if (extensionsFile) {
          updateStatus("Installing extensions...");
          await installExtensions(extensionsFile);
          progress += progressIncrement;
          updateProgress('import', progress);
        } else {
          updateStatus("No extensions file found in backup", true);
        }
      }
      
      // Note: History and cookies can't be directly imported via extensions API
      if (importOptions.history || importOptions.cookies) {
        updateStatus("Note: History and cookies import not supported in extensions", true);
      }
      
      updateProgress('import', 100);
      updateStatus("Import process completed!", false, true);
    } catch (error) {
      console.error("Import error:", error);
      updateStatus("Error: " + error.message, true);
    } finally {
      ui.importButton.disabled = false;
      ui.importButtonText.textContent = "Import Data";
      state.isImporting = false;
    }
  }

  // Import bookmarks
  async function importBookmarks(bookmarksFile) {
    let content;
    
    if (bookmarksFile.id) {
      // Google Drive file
      content = await downloadFromDrive(bookmarksFile.id);
    } else {
      // Local file
      content = await readFileAsText(bookmarksFile);
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    const folders = doc.querySelectorAll('h3');
    const bookmarks = doc.querySelectorAll('a');
    
    // Create folders first
    for (const folder of folders) {
      const folderName = folder.textContent;
      await chrome.bookmarks.create({
        title: folderName,
        parentId: '1' // Bookmarks bar
      });
    }
    
    // Create bookmarks
    for (const bookmark of bookmarks) {
      const title = bookmark.textContent;
      const url = bookmark.getAttribute('href');
      
      let parentId = '1'; // Default to bookmarks bar
      let currentNode = bookmark.parentElement;
      
      while (currentNode) {
        if (currentNode.tagName === 'DL') {
          const h3 = currentNode.previousElementSibling;
          if (h3 && h3.tagName === 'H3') {
            const folderName = h3.textContent;
            const folders = await chrome.bookmarks.search({ title: folderName });
            if (folders.length > 0) {
              parentId = folders[0].id;
            }
            break;
          }
        }
        currentNode = currentNode.parentElement;
      }
      
      await chrome.bookmarks.create({
        parentId: parentId,
        title: title,
        url: url
      });
    }
    
    updateStatus(`Imported ${bookmarks.length} bookmarks`);
  }

  // Download file from Google Drive
  async function downloadFromDrive(fileId) {
    try {
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });
      
      return response.body;
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    }
  }

  // Install extensions
  async function installExtensions(extensionsFile) {
    let extensionsData;
    
    if (extensionsFile.id) {
      // Google Drive file
      const content = await downloadFromDrive(extensionsFile.id);
      extensionsData = JSON.parse(content);
    } else {
      // Local file
      extensionsData = await readFileAsJSON(extensionsFile);
    }
    
    let installedCount = 0;
    
    for (const ext of extensionsData.extensions.filter(e => e.enabled)) {
      try {
        const existing = await chrome.management.get(ext.id).catch(() => null);
        
        if (!existing) {
          await chrome.tabs.create({ url: ext.storeUrl });
          installedCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          updateStatus(`${ext.name} is already installed`);
        }
      } catch (error) {
        console.error(`Failed to install ${ext.name}:`, error);
        updateStatus(`Failed to install ${ext.name}`, true);
      }
    }
    
    updateStatus(`Opened store pages for ${installedCount} extensions`);
  }

  // Read file as text
  async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  // Read file as JSON
  async function readFileAsJSON(file) {
    const text = await readFileAsText(file);
    return JSON.parse(text);
  }

  // Initialize the extension
  init();
});