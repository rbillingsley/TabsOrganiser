export class UserConfig {
  enableBlocking = false;
  urls = [];

  fromStorage(storage) {
    this.enableBlocking = storage?.enableBlocking ?? false;
    this.urls = storage?.urls ?? {};

    console.log("fromStorage", this, storage);
  }
}
