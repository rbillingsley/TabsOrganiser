export const maxBlockedUrls = 5;
export class SessionConfig {
  blockedUrls = [];
  overrideUrl = "";

  fromStorage(storage) {
    this.blockedUrls = storage?.blockedUrls ?? [];
  }

  validBlockedUrl(url) {
    return this.blockedUrls.includes(url) === false;
  }

  addBlockedUrl(url) {
    this.blockedUrls.splice(0, 0, url);

    let urlsToDrop = this.blockedUrls.length - maxBlockedUrls;
    for (urlsToDrop; urlsToDrop > 0; urlsToDrop--) {
      const droppedUrl = this.blockedUrls.pop();
    }
  }

  setOverrideUrl(url) {
    this.overrideUrl = url;
  }

  clearOverrideUrl() {
    this.overrideUrl = "";
  }
}
