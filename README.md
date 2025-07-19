# Brave Backup Manager - Browser Extension

![Extension Screenshot](https://via.placeholder.com/400x250?text=Brave+Backup+Manager+Screenshot)

## 📌 Overview

The Brave Backup Manager is a comprehensive browser extension that allows users to easily export and import their Brave browser data, including bookmarks, extensions list, and browser configuration. This extension provides a simple, user-friendly interface to manage your browser data backups.

## ✨ Features

### 🔹 Export Functionality
- **Bookmarks Export**: Save all bookmarks as an HTML file (Netscape format)
- **Extensions List**: Export a complete list of installed extensions with details
- **Browser Configuration**: Save browser settings and preferences
- **Custom Backup Location**: Choose where to save your backup files
- **Organized Backups**: Automatic timestamped folder creation

### 🔹 Import Functionality
- **Bookmarks Import**: Restore bookmarks from previously exported HTML files
- **Extensions Installation**: Open store pages for all extensions from backup
- **Multi-file Import**: Select multiple backup files at once

### 🔹 User Experience
- Progress tracking for all operations
- Visual feedback with progress bars
- Status messages with success/error indicators
- Remembered preferences between sessions

## 🛠️ Installation

### Method 1: Load Unpacked (Development)
1. Clone this repository or download the source code
2. Open Brave/Chrome and navigate to `brave://extensions` or `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension directory

### Method 2: Install from Chrome Web Store
*(Coming soon - when published to the store)*

## 🖥️ Usage Guide

### Exporting Your Data
1. Click the extension icon in your toolbar
2. Navigate to the "Export" tab
3. Select which data you want to export:
   - ☑ Bookmarks
   - ☑ Extensions List
   - ☐ Browser Configuration
4. Click "Export Data"
5. Your files will be saved to your chosen backup location

### Importing Your Data
1. Click the extension icon in your toolbar
2. Navigate to the "Import" tab
3. Select which data you want to import:
   - ☑ Bookmarks
   - ☑ Extensions
4. Click "Choose Backup File or Folder" and select your backup files
5. Click "Import Data"

### Changing Backup Location
1. Click the ⚙️ "Backup Settings" button
2. Click "Select Backup Folder"
3. Choose your preferred directory
4. The extension will remember this location for future backups

## 🔧 Technical Specifications

### Supported Data Types
| Data Type       | Export Format | Import Support | Notes                     |
|-----------------|---------------|----------------|---------------------------|
| Bookmarks       | HTML          | ✅ Yes         | Netscape Bookmark format  |
| Extensions List | JSON          | ⚠️ Limited    | Opens store pages         |
| Browser Config  | JSON          | ❌ No          | For reference only        |

### System Requirements
- Brave Browser (Recommended) or Google Chrome
- Version 88 or higher
- 10MB free disk space

## 📂 Project Structure

```text
brave-backup-manager/
├── icons/               # Extension icons
│   ├── icon48.png       # 48x48 icon
│   ├── icon96.png       # 96x96 icon
│   └── icon128.png      # 128x128 icon
├── popup.html          # Main extension interface
├── popup.js            # Extension logic (25KB)
├── background.js       # Background service worker (2KB)
├── manifest.json       # Extension configuration
└── README.md           # This documentation
```


## ⚠️ Known Limitations

1. **Directory Access**: 
   - Cannot directly write to system folders
   - Uses Downloads folder as default base

2. **Extension Installation**: 
   - Requires manual confirmation for each extension
   - Opens Chrome Web Store pages for installation

3. **Data Limits**:
   - May timeout with very large bookmark collections
   - Limited to ~1000 extensions for reliable export

## 🚀 Roadmap

- [ ] Add encrypted backup option
- [ ] Implement scheduled automatic backups
- [ ] Add cloud storage integration (Google Drive/Dropbox)
- [ ] Develop Firefox version

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -am 'Add NewFeature'`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

## 📜 License

MIT License

## 📧 Support

For help or questions:
- Open a Github Issue
- Email: trojan.v6@gmail.com

---


