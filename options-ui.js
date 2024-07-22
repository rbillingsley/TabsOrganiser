import { UserConfig } from "./user-config.js";
import { restoreOptions, storeOptions, resetOptions } from "./options.js";

const enableBlockingId = "enable-blocking";
const allWindowsId = "all-windows";
const urlId = "url";
const statusId = "status";

document.addEventListener("DOMContentLoaded", onContentLoaded);
document.getElementById("save").addEventListener("click", onSaveClicked);
document.getElementById("reset").addEventListener("click", onResetClicked);

function onContentLoaded() {
  restoreOptions(initialiseConfig());
}

function onSaveClicked() {
  gatherOptions(updateSyncStatus());
}

function onResetClicked() {
  resetOptions(updateSyncStatus());
}

function initialiseConfig() {
  return (config) => {
    console.log("Initialised config:", config);

    let blockingCheckbox = document.getElementById(enableBlockingId);
    let allWindows = document.getElementById(allWindowsId); 
    let urlInput = document.getElementById(urlId);

    blockingCheckbox.checked = config.enableBlocking;
    allWindows.checked = config.allWindows;

    if (config.urls.length > 0) {
      urlInput.value = config.urls[0];
    }
  };
}

function gatherOptions(callback) {
  let configObject = new UserConfig();
  configObject.enableBlocking =
    document.getElementById(enableBlockingId).checked;
  configObject.allWindows =
    document.getElementById(allWindowsId).checked; 
  configObject.urls.push(document.getElementById(urlId).value);

  storeOptions(configObject, callback);
}

function updateSyncStatus() {
  return () => {
    const status = document.getElementById(statusId);
    status.textContent = "Options saved.";
    setTimeout(() => {
      status.textContent = "";
    }, 750);
  };
}
