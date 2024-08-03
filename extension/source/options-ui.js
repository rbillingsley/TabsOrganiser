import { UserConfig } from "./user-config.js";
import { restoreOptions, storeOptions, resetOptions } from "./options.js";

const enableBlockingId = "enable-blocking";
const allWindowsId = "all-windows";
const urlListId = "url-list";
const urlSlotId = "url-slot";
const urlId = "url";
const addButtonId = "add-button";
const removeButtonId = "remove-button";
const statusId = "status";
const saveId = "save";
const resetId = "reset";
const clickId = "click";

document.addEventListener("DOMContentLoaded", onContentLoaded);
document.getElementById(saveId).addEventListener(clickId, onSaveClicked);
document.getElementById(resetId).addEventListener(clickId, onResetClicked);

function onContentLoaded() {
  restoreOptions(initialiseConfig);
}

function onSaveClicked() {
  gatherOptions(updateSyncStatusSuccess, updateSyncStatusError);
}

function onResetClicked() {
  resetOptions(updateSyncStatusSuccess);
}

function onAddClicked(e) {
  let newSlot = addURLSlot(e.srcElement.parentElement);
  setURLValue("", newSlot);
  updateUrlListEntries();
}

function onRemoveClicked(e) {
  e.srcElement.parentElement.remove();
  updateUrlListEntries();
}

function initialiseConfig(config) {
  console.log("Initialised config:", config);

  document.getElementById(enableBlockingId).checked = config.enableBlocking;
  document.getElementById(allWindowsId).checked = config.allWindows;

  const originUrlSlot = document.getElementById(urlSlotId);

  let lastSlot = originUrlSlot;
  for (let i = 1; i < config.urls.length; i++) {
    lastSlot = addURLSlot(lastSlot);
  }

  updateUrlListValues(config);
  updateUrlListEntries();
}

function addURLSlot(originUrlSlot) {
  let newSlot = originUrlSlot.cloneNode(true);
  originUrlSlot.after(newSlot);
  return newSlot;
}

function updateUrlListEntries() {
  let urlListChildren = getUrlListElements();
  for (let i = 0; i < urlListChildren.length; i++) {
    updateElements(i, urlListChildren[i]);
  }
}

function updateUrlListValues(config) {
  let urlListChildren = getUrlListElements();
  for (let i = 0; i < config.urls.length; i++) {
    setURLValue(config.urls[i], urlListChildren[i]);
  }
}

function getUrlListElements() {
  const urlList = document.getElementById(urlListId);
  return urlList.getElementsByClassName("entry");
}

function setURLValue(url, element) {
  let urlInput = element.querySelector(`input[name=\"${urlId}\"`);
  urlInput.value = url;
}

function updateElements(index, element) {
  element.id = `${urlSlotId}-${index}`;
  let urlInput = element.querySelector(`input[name=\"${urlId}\"`);
  let addButton = element.querySelector(`input[name=\"${addButtonId}\"`);
  let removeButton = element.querySelector(`input[name=\"${removeButtonId}\"`);

  urlInput.id = `${urlId}-${index}`;
  addButton.id = `${addButtonId}-${index}`;
  removeButton.id = `${removeButtonId}-${index}`;

  addButton.removeEventListener(clickId, onAddClicked);
  addButton.addEventListener(clickId, onAddClicked);
  removeButton.removeEventListener(clickId, onAddClicked);
  removeButton.addEventListener(clickId, onRemoveClicked);
}

function gatherOptions(successCallback, errorCallback) {
  let configObject = new UserConfig();
  configObject.enableBlocking =
    document.getElementById(enableBlockingId).checked;
  configObject.allWindows = document.getElementById(allWindowsId).checked;

  const urlElements = document.querySelectorAll(`input[name=\"${urlId}\"`);
  for (const urlElement of urlElements) {
    configObject.urls.push(urlElement.value);
  }

  console.log("Gathered config:", configObject, successCallback, errorCallback);

  storeOptions(configObject, successCallback, errorCallback);
}

function updateSyncStatusSuccess() {
  const status = document.getElementById(statusId);
  status.textContent = "Options save success.";
  setTimeout(() => {
    status.textContent = "";
  }, 750);
}

function updateSyncStatusError(errorDetails) {
  const status = document.getElementById(statusId);
  status.textContent = "Options save failed. " + errorDetails;
  setTimeout(() => {
    status.textContent = "";
  }, 750);
}
