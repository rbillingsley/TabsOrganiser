import { UserConfig } from "./user-config.js";

export function restoreOptions(callback) {
  chrome.storage.sync.get().then((storage) => {
    let configObject = new UserConfig();
    configObject.fromStorage(storage.userConfig);

    callback(configObject);
  });
}

export function storeOptions(configObject, successCallback, errorCallback) {
  validateOptions(configObject, successCallback, errorCallback);
}

export function resetOptions(callback) {
  let configObject = new UserConfig();
  saveOptions(configObject, callback);
}

export function addUrlToBlockList(url, configObject) {
  if (url.startsWith("chrome-extension://")) {
    // ignore chrome extension popup urls
    return;
  }

  if (configObject.urls.includes(url)) {
    // ignore duplicates, basic array string check for now
    return;
  }

  configObject.urls.push(url);

  validateOptions(
    configObject,
    () => {},
    () => {}
  );
}

function validateOptions(configObject, successCallback, errorCallback) {
  saveOptions(configObject, successCallback, errorCallback);
}

function saveOptions(configObject, successCallback, errorCallback) {
  chrome.storage.sync.set({ userConfig: configObject }, successCallback);
}
