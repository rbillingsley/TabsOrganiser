export const maxBlockedUrls = 5;
export class SessionConfig {
  blockedUrls = [];
  overrideUrl = "";

  fromStorage(storage) {
    this.blockedUrls = storage?.blockedUrls ?? [];

    console.log("fromStorage", this, storage);
  }

  validBlockedUrl(url) {
    return this.blockedUrls.includes(url) === false;
  }

  addBlockedUrl(url) {
    this.blockedUrls.splice(0, 0, url);

    console.log("blockedUrls", this.blockedUrls);

    let urlsToDrop = this.blockedUrls.length - maxBlockedUrls;
    for (urlsToDrop; urlsToDrop > 0; urlsToDrop--) {
      const droppedUrl = this.blockedUrls.pop();
      console.log("droppedUrl", droppedUrl);
    }
  }

  setOverrideUrl(url) {
    this.overrideUrl = url;
  }

  clearOverrideUrl() {
    this.overrideUrl = "";
  }
}
