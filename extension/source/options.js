import { UserConfig } from "./user-config.js";

export function restoreOptions(callback) {
  chrome.storage.sync.get().then((storage) => {
    let configObject = new UserConfig();
    configObject.fromStorage(storage.userConfig);
    console.log("restore UserConfig", configObject, storage.userConfig);
    callback(configObject);
  });
}

export function storeOptions(configObject,callback) {
  validateOptions(configObject, callback);
  saveOptions(configObject, callback);
}

export function resetOptions(callback) {
  let configObject = new UserConfig();
  saveOptions(configObject, callback);
}

export function addUrlToBlockList(url, configObject, callback) {
  console.log("url to block", url, configObject);

  if (url.startsWith("chrome-extension://")) {
    // ignore chrome extension popup urls
    return;
  }

  if (configObject.urls.includes(url)) {
    // ignore duplicates, basic array string check for now
    return;
  }

  configObject.urls.push(url);

  validateOptions(configObject);
  saveOptions(configObject, callback)
}

function validateOptions(configObject) {
  console.log("Validated config:", configObject);
}

function saveOptions(configObject, callback) {
  console.log("Saved config:", configObject);

  chrome.storage.sync.set({ userConfig: configObject }, callback);
}
