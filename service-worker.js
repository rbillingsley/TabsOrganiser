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

  const createdTabUrl = createdTab.pendingUrl;
  if (doesCreatedTabMatchSettingsFilter(createdTabUrl))
  {
    return;
  }

  const createdTabId = createdTab.id;
  const currentTabs = await chrome.tabs.query({
    active: false,
    lastFocusedWindow: true,
  });

  console.log("Tab created:", createdTab);
  console.log("Tabs:", currentTabs);

  const existingTabIndices = currentTabs
    .filter(findDuplicateTabs(createdTabUrl))
    .map((tab) => tab.index)
    .reverse();

  console.log("Existing Tabs:", existingTabIndices);

  if (existingTabIndices.length > 0) {
    // close the new tab as we already have one open
    await chrome.tabs.remove(createdTabId);
    console.log("Removed Tab:", createdTabId, createdTab);

    const tabsToHighlight = {
      tabs: existingTabIndices,
    };

    console.log("Tabs to highlight:", tabsToHighlight);

    // highlight and focus the existing tab(s)
    await chrome.tabs.highlight(tabsToHighlight);
  }
}

function doesCreatedTabMatchSettingsFilter(createdTabUrl) {
  // basic comparison for now
  return !storageCache.urls.includes(createdTabUrl);
}

function findDuplicateTabs(createdTabUrl) {
  return (tab) => {
    let currentTabUrl = tab.url;
    console.log(createdTabUrl, "===", currentTabUrl);
    return createdTabUrl === tab.url;
  };
}

async function listenForUserConfigChanges(configChanges, namespace) {
  Object.assign(storageCache, configChanges.userConfig.newValue);
  console.log("User config changed:", configChanges, namespace);
}
