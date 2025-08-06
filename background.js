// 1Password Extension - Manifest V3 Service Worker
// This service worker handles the core background functionality

// Variables to track the current fill operation
let currentTabId = null;

// Initialize the extension when the service worker starts
chrome.runtime.onStartup.addListener(() => {
  console.log('1Password extension starting up...');
  initializeExtension();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('1Password extension installed...');
  initializeExtension();
});

// Initialize extension functionality
function initializeExtension() {
  // Set up action click handler
  chrome.action.onClicked.addListener((tab) => {
    console.log('Action button clicked for tab:', tab.id);
    handleActionClick(tab);
  });

  // Set up context menu
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'legacy1PasswordMenu',
      title: '1Password',
      contexts: ['all']
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('Context menu item clicked:', info.menuItemId, 'for tab:', tab.id);
    if (info.menuItemId === 'legacy1PasswordMenu') {
      handleContextMenuClick(info);
    }
  });

  // Set up tab update listener
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      handleTabComplete(tab);
    }
  });

  // Set up message handling
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);
    if (message && message.command) {
      handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async response
    }
  });
}

// Handle declarativeNetRequest events for onepasswdfill URLs
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
  function(info) {
    console.log('Rule matched for URL:', info.request.url);
    if (info.request.url.includes('onepasswdfill')) {
      handleOnePasswordFill(info);
    }
  }
);

// Handle webRequest onCompleted for tracking fill completion
chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (currentTabId && currentTabId === details.tabId) {
      console.log('Fill completion detected for tab:', details.tabId);
      handleFillCompletion(details);
    }
  },
  {types: ['main_frame'], urls: ['<all_urls>']}
);

// Handle onepasswdfill URL processing
function handleOnePasswordFill(info) {
  console.log('Processing onepasswdfill URL:', info.request.url);
  
  // Extract parameters from URL
  const url = new URL(info.request.url);
  const onepasswdfill = url.searchParams.get('onepasswdfill');
  const onepasswdvault = url.searchParams.get('onepasswdvault');
  
  if (onepasswdfill) {
    currentTabId = info.request.tabId;
    
    // Send message to content script to handle the fill
    chrome.tabs.sendMessage(info.request.tabId, {
      name: 'handleOnePasswordFill',
      message: {
        onepasswdfill: onepasswdfill,
        onepasswdvault: onepasswdvault,
        url: info.request.url
      }
    }).catch(error => {
      console.log('Could not send message to tab:', error);
    });
  }
}

// Handle fill completion
function handleFillCompletion(details) {
  console.log('Fill completion for tab:', details.tabId);
  currentTabId = null;
}

// Handle action click
function handleActionClick(tab) {
  console.log('Action button clicked for URL:', tab.url);
  if (tab && tab.url) {
    chrome.tabs.sendMessage(tab.id, {
      name: 'toolbarButtonClicked',
      message: { url: tab.url }
    }).catch(error => {
      console.log('Could not send message to tab:', error);
    });
  }
}

// Handle context menu click
function handleContextMenuClick(info) {
  console.log('Context menu clicked for URL:', info.pageUrl);
  if (info.pageUrl) {
    chrome.tabs.sendMessage(info.tabId, {
      name: 'contextMenuClicked',
      message: { url: info.pageUrl }
    }).catch(error => {
      console.log('Could not send message to tab:', error);
    });
  }
}

// Handle tab complete
function handleTabComplete(tab) {
  console.log('Tab completed loading:', tab.url);
  if (tab.url === 'https://agilebits.com/browsers/welcome.html') {
    chrome.tabs.sendMessage(tab.id, {
      name: 'welcomePageLoaded',
      message: {}
    }).catch(error => {
      console.log('Could not send message to tab:', error);
    });
  } else if (tab.url === 'https://agilebits.com/browsers/auth.html') {
    chrome.tabs.sendMessage(tab.id, {
      name: 'authPageLoaded',
      message: {}
    }).catch(error => {
      console.log('Could not send message to tab:', error);
    });
  }
}

// Handle messages from content scripts
function handleMessage(message, sender, sendResponse) {
  console.log('Handling message:', message.command);
  
  // Route messages to appropriate handlers
  switch (message.command) {
    case 'getPageDetails':
      handleGetPageDetails(message.params, sender, sendResponse);
      break;
    case 'autosave':
      handleAutosave(message.params, sender, sendResponse);
      break;
    case 'fillItem':
      handleFillItem(message.params, sender, sendResponse);
      break;
    case 'hello':
      handleHello(message.params, sender, sendResponse);
      break;
    default:
      console.warn('Unknown command:', message.command);
      sendResponse({ error: 'Unknown command' });
  }
}

// Message handlers
function handleGetPageDetails(params, sender, sendResponse) {
  console.log('Getting page details');
  // This would typically involve page analysis
  sendResponse({ success: true, pageDetails: {} });
}

function handleAutosave(params, sender, sendResponse) {
  console.log('Handling autosave');
  // This would typically involve saving login data
  sendResponse({ success: true });
}

function handleFillItem(params, sender, sendResponse) {
  console.log('Handling fill item');
  // This would typically involve filling form fields
  sendResponse({ success: true });
}

function handleHello(params, sender, sendResponse) {
  console.log('Handling hello message');
  sendResponse({ 
    success: true, 
    version: '4.7.5.90',
    capabilities: {
      declarativeNetRequest: true,
      serviceWorker: true
    }
  });
}

// Initialize when the service worker loads
console.log('1Password service worker loading...');
initializeExtension(); 
