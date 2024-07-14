import { UserConfig } from "./user-config.js";
import { restoreOptions, gatherOptions, resetOptions } from "./options.js";

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

    let blockingCheckbox = document.getElementById("enable-blocking");
    let urlInput = document.getElementById("url");

    blockingCheckbox.checked = config.enableBlocking;

    if (config.urls.length > 0) {
      urlInput.value = config.urls[0];
    }
  };
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
