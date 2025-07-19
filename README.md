# Brave Backup Manager - Browser Extension By Unnamed10110

## 📌 Overview

The Brave Backup Manager is a comprehensive browser extension that allows users to easily export and import their Brave browser data, including bookmarks, extensions list, and browser configuration. Now with Google Drive integration for cloud backups!

<img width="446" height="476" alt="image" src="https://github.com/user-attachments/assets/5a4cd7ae-d1d4-42f4-8a2d-8154eef7c834" />
<br>

<img width="446" height="524" alt="image" src="https://github.com/user-attachments/assets/a73ca6b0-32f2-4c89-9553-02c873764fca" />
<br>

<img width="461" height="827" alt="image" src="https://github.com/user-attachments/assets/9f309038-5ff9-4a54-8625-2621964fdf73" />



## ✨ Features

### 🔹 Export Functionality
- **Bookmarks Export**: Save all bookmarks as an HTML file (Netscape format)
- **Extensions List**: Export a complete list of installed extensions with details
- **Browser Configuration**: Save browser settings and preferences
- **Multiple Backup Locations**: Choose local folder or Google Drive
- **Organized Backups**: Automatic timestamped folder creation

### 🔹 Import Functionality
- **Bookmarks Import**: Restore bookmarks from previously exported HTML files
- **Extensions Installation**: Open store pages for all extensions from backup
- **Multi-source Import**: Import from local files or Google Drive

### 🔹 Google Drive Integration
- Secure OAuth2 authentication
- Direct upload/download to/from Google Drive
- Automatic folder management in Drive
- Seamless switching between local and cloud backups

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

## 🔌 Google Drive Setup

### Step-by-Step Configuration
1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Create Project" and name it (e.g., "Brave Backup Extension")

2. **Enable APIs**:
   - Navigate to "APIs & Services" > "Library"
   - Search for and enable:
     - Google Drive API
     - Google Picker API

3. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type
   - Fill in required app information:
     - App name: "Brave Backup Manager"
     - User support email: (your email)
     - Developer contact email: (your email)
   - Add scope: `.../auth/drive.file`
   - Add your email as a test user

4. **Create Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `chrome-extension://YOUR_EXTENSION_ID`
     - `https://YOUR_EXTENSION_ID.chromiumapp.org`
   - Add authorized redirect URIs:
     - `https://YOUR_EXTENSION_ID.chromiumapp.org/google`
     - `https://YOUR_EXTENSION_ID.chromiumapp.org/oauth2`

5. **Get API Keys**:
   - In Credentials section, click "Create Credentials" > "API key"
   - Restrict the key to only work with Drive API

6. **Update Extension Configuration**:
   - In `manifest.json`:
     - Replace `YOUR_CLIENT_ID` with your OAuth client ID
     - Replace `YOUR_EXTENSION_ID` with your actual extension ID
   - In `popup.js`:
     - Replace `YOUR_CLIENT_ID` with your client ID
     - Replace `YOUR_API_KEY` with your API key

## 🖥️ Usage Guide

### Exporting Your Data
1. Click the extension icon in your toolbar
2. Navigate to the "Export" tab
3. Select which data you want to export:
   - ☑ Bookmarks
   - ☑ Extensions List
   - ☐ Browser Configuration
4. Choose destination:
   - Local folder (select via file picker)
   - Google Drive (requires sign-in)
5. Click "Export Data"
6. View progress in status bar

### Importing Your Data
1. Click the extension icon in your toolbar
2. Navigate to the "Import" tab
3. Select source:
   - Local files (select via file picker)
   - Google Drive (browse your backups)
4. Select which data you want to import:
   - ☑ Bookmarks
   - ☑ Extensions
5. Click "Import Data"

### Managing Google Drive Connection
1. Click the ⚙️ "Backup Settings" button
2. In Google Drive section:
   - Click "Connect to Google Drive" to sign in
   - Click "Disconnect" to sign out
3. Connection status is shown in real-time

## 🔧 Technical Specifications

### Supported Data Types
| Data Type       | Export Format | Import Support | Notes                     |
|-----------------|---------------|----------------|---------------------------|
| Bookmarks       | HTML          | ✅ Yes         | Netscape Bookmark format  |
| Extensions List | JSON          | ⚠️ Limited    | Opens store pages         |
| Browser Config  | JSON          | ❌ No          | For reference only        |

### Google Drive API Usage
- **Scope**: `https://www.googleapis.com/auth/drive.file`
- **Storage**: ~100MB free space needed for backups
- **Rate Limits**: 100 requests per 100 seconds per user

### System Requirements
- Brave Browser (Recommended) or Google Chrome
- Version 88 or higher
- Google account for Drive functionality
- 10MB free disk space for local backups

## 📂 Project Structure
```text
brave-backup-manager/
├── icons/ # Extension icons
│ ├── icon48.png # 48x48 icon
│ ├── icon96.png # 96x96 icon
│ └── icon128.png # 128x128 icon
├── popup.html # Main extension interface
├── popup.js # Extension logic (35KB with Drive support)
├── background.js # Background service worker (5KB)
├── manifest.json # Extension configuration
└── README.md # This documentation
```



## ⚠️ Known Limitations

1. **Google Drive Quotas**:
   - Limited to 750 GB/day upload
   - 10TB/day download limit

2. **Authentication**:
   - Requires re-authentication when token expires (typically 1 hour)
   - Unverified app warning for testers

3. **Data Limits**:
   - May timeout with very large bookmark collections (>10,000 items)
   - Limited to ~1000 extensions for reliable export

## 🚀 Roadmap

- [x] Google Drive integration
- [ ] Add encrypted backup option
- [ ] Implement scheduled automatic backups
- [ ] Add Dropbox integration
- [ ] Develop Firefox version

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -am 'Add NewFeature'`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

For Google Drive-related contributions:
- Include API quota considerations
- Maintain OAuth security best practices
- Handle token refresh scenarios

## 📜 License

MIT License

## 📧 Support

For help or questions:
- Open a Github Issue
- Email: trojan.v6@gmail.com / sergiobritos10110@gmail.com
- Google API questions: https://developers.google.com/drive/api/guides/about-sdk
