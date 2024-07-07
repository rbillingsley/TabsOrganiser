document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

function restoreOptions () {
    chrome.storage.sync.get(
        { urls: [] },
        initialiseConfig()
    );
}

function initialiseConfig() {
    return (config) => {
        console.log(config);
        document.getElementById('url').value = config.urls[0];
    };
}

function saveOptions () {
    const url = document.getElementById('url').value;
    const urlOptions = [];
    urlOptions.push(url)

    console.log(urlOptions);

    chrome.storage.sync.set(
      { urls: urlOptions },
      updateSyncStatus()
    );
}

function updateSyncStatus() {
    return () => {
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
            status.textContent = '';
        }, 750);
    };
}
