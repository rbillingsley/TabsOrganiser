import { UserConfig } from "./user-config.js";
import { SessionConfig, maxBlockedUrls } from "./session-config.js";
import { addUrlToBlockList } from "./options.js";

const storageCache = new UserConfig();
const sessionCache = new SessionConfig();
const blockActionContextId = "BLOCK_ACTION_CONTEXT";
const blockOverrideParentActionContextId =
  "BLOCK_OVERRIDE_PARENT_ACTION_CONTEXT";
const blockOverrideChildActionContextId = "BLOCK_OVERRIDE_CHILD_ACTION_CONTEXT";
const blockPageContextId = "BLOCK_LINK_CONTEXT";
const blockLinkContextId = "BLOCK_PAGE_CONTEXT";

chrome.runtime.onInstalled.addListener(onInstalled);
chrome.tabs.onCreated.addListener(blockDuplicateTabs);
chrome.storage.onChanged.addListener(listenForUserConfigChanges);
chrome.contextMenus.onClicked.addListener(contextMenuOnClicked);

initStorageCache();

async function onInstalled() {
  // Create context menus to easily add URLs
  await chrome.contextMenus.create({
    title: "Block duplicate tabs for current page",
    contexts: ["action"],
    id: blockActionContextId,
  });

  await chrome.contextMenus.create({
    title: "Override blocked tabs for recent page",
    contexts: ["action"],
    id: blockOverrideParentActionContextId,
    enabled: false,
    visible: false,
  });

  for (let i = 0; i < maxBlockedUrls; i++) {
    const title = `Item ${i}`;
    const childId = `${blockOverrideChildActionContextId}${i}`;
    await chrome.contextMenus.create({
      title: title,
      contexts: ["action"],
      id: childId,
      parentId: blockOverrideParentActionContextId,
      enabled: false,
      visible: false,
    });
  }

  await chrome.contextMenus.create({
    title: "Block duplicate tabs for page",
    contexts: ["page"],
    id: blockPageContextId,
  });

  await chrome.contextMenus.create({
    title: "Block duplicate tabs for link",
    contexts: ["link"],
    id: blockLinkContextId,
  });
}

async function contextMenuOnClicked(info) {
  console.log("context clicked", info);

  if (info.parentMenuItemId) {
    resolveUrlForBlockOverride(info);
  } else {
    resolveUrlForBlockList(info);
  }
}

async function updateRecentlyBlockedList(url, sessionConfig) {
  if (sessionConfig.validBlockedUrl(url) === false) {
    return;
  }

  const firstUpdate = sessionConfig.blockedUrls.length === 0;
  if (firstUpdate) {
    console.log("Update Parent:", blockOverrideParentActionContextId);
    const updateProperties = {
      enabled: true,
      visible: true,
    };
    await chrome.contextMenus.update(
      blockOverrideParentActionContextId,
      updateProperties
    );
  }

  sessionConfig.addBlockedUrl(url);

  for (let i = 0; i < sessionCache.blockedUrls.length; i++) {
    const urlTitle = sessionCache.blockedUrls[i];
    const childId = `${blockOverrideChildActionContextId}${i}`;
    console.log("Update Child:", urlTitle, childId);
    const updateProperties = {
      title: urlTitle,
      enabled: true,
      visible: true,
    };
    await chrome.contextMenus.update(childId, updateProperties);
  }

  await chrome.storage.session.set({ sessionConfig: sessionConfig });
}

async function resolveUrlForBlockOverride(info) {
  const indexString = info.menuItemId.slice(
    blockOverrideChildActionContextId.length
  );

  console.log("indexString", indexString);
  const index = parseInt(indexString);
  console.log("index", index);

  if (index < 0 || index >= sessionCache.blockedUrls.length) {
    return;
  }

  sessionCache.overrideUrl = sessionCache.blockedUrls[index];
  console.log("overrideUrl", sessionCache.overrideUrl);

  chrome.tabs.create({ url: sessionCache.overrideUrl });
}

async function resolveUrlForBlockList(info) {
  let url = "";

  switch (info.menuItemId) {
    case blockActionContextId:
      const [currentTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      url = currentTab.url;
      break;
    case blockPageContextId:
      url = info.pageUrl;
      break;
    case blockLinkContextId:
      url = info.linkUrl;
      break;
  }

  addUrlToBlockList(url, storageCache);
}

async function initStorageCache() {
  chrome.storage.sync.get().then((persistentStorage) => {
    storageCache.fromStorage(persistentStorage.userConfig);
    console.log("init UserConfig", storageCache, persistentStorage.userConfig);
  });

  chrome.storage.session.get().then((sessionStorage) => {
    sessionCache.fromStorage(sessionStorage.sessionConfig);
    console.log(
      "init SessionConfig",
      sessionCache,
      sessionStorage.sessionConfig
    );
  });
}

async function listenForUserConfigChanges(configChanges, namespace) {
  if (configChanges.userConfig) {
    Object.assign(storageCache, configChanges.userConfig.newValue);
    console.log("User config changed:", storageCache, namespace);
  } else if (configChanges.userConfig) {
    Object.assign(sessionCache, configChanges.sessionConfig.newValue);
    console.log("Session config changed:", sessionCache, namespace);
  }
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

  if (sessionCache.overrideUrl === createdTabUrl) {
    sessionCache.clearOverrideUrl();
    return;
  }

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

  let currentTabs;
  try {
    currentTabs = await chrome.tabs.query(tabQueryOptions);
  } catch (error) {
    console.error(error);
    return;
  }

  console.log("Tab created:", createdTab);
  console.log("Tabs:", currentTabs);

  let existingTabs = currentTabs
    .filter((tab) => createdTabUrl === tab.url)
    .reverse();

  console.log("Existing Tabs:", existingTabs);

  if (existingTabs.length === 0) {
    return;
  }

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

  updateRecentlyBlockedList(createdTabUrl, sessionCache);
}
