const normalDpiZoom = 1;
const highDpiZoom = 1.25;

function zoomSettingsSet() {
  if (chrome.runtime.lastError) {
    console.log('failed to set zoom settings', chrome.runtime.lastError.message);
  }
}

function zoomLevelSet() {
  if (chrome.runtime.lastError) {
    console.log('failed to set zoom level', chrome.runtime.lastError.message);
  }
}

function updateZoomLevelsForTabTo(tabId, newZoom) {
  chrome.tabs.getZoom(tabId, currentZoom => {
    console.log('current zoom factor for tab ' + tabId + ': ' + currentZoom);
    if (currentZoom != newZoom && 
        (currentZoom == highDpiZoom || currentZoom == normalDpiZoom)) {
      console.log('updating to', newZoom);

      // This can produce errors in the console for 'chrome://' tabs,
      // but we don't want to require the permissions to see the tab URL,
      // so we can't predict this:
      chrome.tabs.setZoom(tabId, newZoom, zoomLevelSet);
      chrome.tabs.setZoomSettings(tabId, { scope: 'per-tab' }, zoomSettingsSet);
    }
  });
}

function updateZoomLevelsForWindowTo(windowId, newZoom) {
  console.log('Zooming to level', newZoom);
  chrome.tabs.getAllInWindow(windowId, tabs => {
    console.log('found ' + tabs.length + ' tabs');
    for (var i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      console.log('found tab ' + tab.id);
      if (tab.id) {
        updateZoomLevelsForTabTo(tab.id, newZoom);
      }
    }
  });
}

function findScreen(window, screens) {
  for (var i = 0; i < screens.length; i++) {
    const screen = screens[i];
    if (window.left >= screen.bounds.left
        && window.left <= screen.bounds.left + screen.bounds.width
        && window.top >= screen.bounds.top
        && window.top <= screen.bounds.top + screen.bounds.height) {
      return screen;
    }
  }
  return screens[0];
}

function updateZoomLevelsForWindow(window, screens) {
  const screen = findScreen(window, screens);
  if (screen.bounds && screen.bounds.width > 2000) {
    console.log('HiDPI');
    updateZoomLevelsForWindowTo(window.id, highDpiZoom);
  } else {
    console.log('Normal DPI');
    updateZoomLevelsForWindowTo(window.id, normalDpiZoom);
  }
}

function updateZoomLevels() {
  chrome.system.display.getInfo(screens => {
    chrome.windows.getAll(windows => {
      console.log('updating zoom levels for ' + windows.length + ' windows');
      for (var i = 0; i < windows.length; i++) {
        updateZoomLevelsForWindow(windows[i], screens)
      }
    });
  });
}

console.log('main code');
updateZoomLevels();

chrome.system.display.onDisplayChanged.addListener(() => {
  console.log('displayChanged');
  updateZoomLevels();
});
chrome.tabs.onUpdated.addListener(() => {
  console.log('tabsUpdated');
  updateZoomLevels();
});
chrome.windows.onFocusChanged.addListener(() => {
  console.log('focusChanged');
  updateZoomLevels();
});
