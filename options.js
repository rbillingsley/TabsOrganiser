import { UserConfig } from './user-config.js'

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);

function restoreOptions() {
  let configObject = new UserConfig; 
  chrome.storage.sync.get({ userConfig: configObject }, initialiseConfig());
}

function initialiseConfig() {
  return (configObject) => {
    console.log("Initialised config:", configObject);
    let blockingCheckbox = document.getElementById("enable-blocking");
    let urlInput = document.getElementById("url");
    blockingCheckbox.checked = configObject.userConfig.enableBlocking;

    urlInput.value = configObject.userConfig.urls[0];
  };
}

function saveOptions() {
  let configObject = new UserConfig;
  configObject.enableBlocking = document.getElementById("enable-blocking").checked;
  configObject.urls.push(document.getElementById("url").value);

  console.log("Saved config:", configObject);

  chrome.storage.sync.set({ userConfig: configObject }, updateSyncStatus());
}

function updateSyncStatus() {
  return () => {
    const status = document.getElementById("status");
    status.textContent = "Options saved.";
    setTimeout(() => {
      status.textContent = "";
    }, 750);
  };
}
