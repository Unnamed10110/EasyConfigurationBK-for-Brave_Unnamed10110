// Background service worker (required for Manifest v3)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Brave Data Saver extension installed');
});