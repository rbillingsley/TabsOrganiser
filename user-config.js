export class UserConfig {
  enableBlocking = false;
  allWindows = false;
  urls = [];

  fromStorage(storage) {
    this.enableBlocking = storage?.enableBlocking ?? false;
    this.allWindows = storage?.allWindows ?? false; 
    this.urls = storage?.urls ?? {};

    console.log("fromStorage", this, storage);
  }
}
