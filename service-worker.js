import { UserConfig } from "./user-config.js";
import { addUrlToBlockList } from "./options.js";

const storageCache = new UserConfig();
const actionContextId = "ACTION_CONTEXT";
const pageContextId = "LINK_CONTEXT";
const linkContextId = "PAGE_CONTEXT";

chrome.runtime.onInstalled.addListener(onInstalled);
chrome.tabs.onCreated.addListener(blockDuplicateTabs);
chrome.storage.onChanged.addListener(listenForUserConfigChanges);
chrome.contextMenus.onClicked.addListener(contextMenuOnClicked);

initStorageCache();

async function onInstalled() {
  // Create context menus to easily add URLs
  chrome.contextMenus.create({
    title: "Block duplicate tabs for current page",
    contexts: ["action"],
    id: actionContextId,
  });

  chrome.contextMenus.create({
    title: "Block duplicate tabs for page",
    contexts: ["page"],
    id: pageContextId,
  });

  chrome.contextMenus.create({
    title: "Block duplicate tabs for link",
    contexts: ["link"],
    id: linkContextId,
  });
}

async function contextMenuOnClicked(info) {
  console.log("context clicked", info);

  let url = "";

  switch (info.menuItemId) {
    case actionContextId:
      const [currentTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      url = currentTab.url;
      break;
    case pageContextId:
      url = info.pageUrl;
      break;
    case linkContextId:
      url = info.linkUrl;
      break;
  }

  addUrlToBlockList(url, storageCache);
}

async function initStorageCache() {
  chrome.storage.sync.get().then((storage) => {
    storageCache.fromStorage(storage.userConfig);
    console.log("init UserConfig", storageCache, storage.userConfig);
  });
}

async function blockDuplicateTabs(createdTab) {
  try {
    await initStorageCache();
  } catch (error) {
    console.log(error);
  }

  if (storageCache.enableBlocking === false) {
    return;
  }

  const createdTabWindowId = createdTab.windowId;
  const createdTabUrl = createdTab.pendingUrl;
  const createdTabId = createdTab.id;
  let tabQueryOptions;
  if (storageCache.allWindows) {
    tabQueryOptions = {
      url: storageCache.urls,
    };
  } else {
    tabQueryOptions = {
      url: storageCache.urls,
      active: false,
    };
  }

  let currentTabs = await chrome.tabs.query(tabQueryOptions);

  console.log("Tab created:", createdTab);
  console.log("Tabs:", currentTabs);

  let existingTabs = currentTabs
    .filter((tab) => createdTabUrl === tab.url)
    .reverse();

  console.log("Existing Tabs:", existingTabs);

  if (existingTabs.length > 0) {
    const tabsByWindow = Map.groupBy(existingTabs, ({ windowId }) => windowId);

    console.log("Tabs by Window:", tabsByWindow);

    // map tabs by window id, so we highlight existing tab(s) in the appropriate window
    let windowId;
    if (tabsByWindow.has(createdTabWindowId)) {
      windowId = createdTabWindowId;
    } else {
      // if tab isn't open in the window the tab was automatically added to, fallback to the first other tab
      const keys = tabsByWindow.keys();
      if (keys.length < 1) {
        console.error(
          "Unable to resolve source window for existing tab:",
          createdTabUrl
        );
        return;
      }

      windowId = keys.next().value;
    }

    // close the new tab as we already have one open
    await chrome.tabs.remove(createdTabId);
    console.log("Removed Tab:", createdTabId, createdTab);

    existingTabs = tabsByWindow.get(windowId);
    console.log("Existing Tabs In Window:", existingTabs);

    // if we're searching all windows, the newly created tab is in the collection but we just removed the actual tab
    existingTabs = existingTabs.filter((tab) => tab.id != createdTabId);

    let existingTabIndices = existingTabs.map((tab) => tab.index);
    console.log("Existing Tabs Indices In Window:", existingTabIndices);

    const tabsToHighlight = {
      tabs: existingTabIndices,
      windowId: windowId,
    };
    console.log("Tabs to highlight:", tabsToHighlight);
    // highlight and focus the existing tab(s)
    await chrome.tabs.highlight(tabsToHighlight);
  }
}

async function listenForUserConfigChanges(configChanges, namespace) {
  Object.assign(storageCache, configChanges.userConfig.newValue);
  console.log("User config changed:", configChanges, namespace);
}
