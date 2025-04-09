import type { RnboModule } from "./types";

class AudioStore {
  private _isAudioStarted = false;
  private _rnboDevice: RnboModule | null = null;

  get isAudioStarted() {
    return this._isAudioStarted;
  }
  get rnboDevice() {
    return this._rnboDevice;
  }

  setAudioStarted(value: boolean) {
    this._isAudioStarted = value;
  }

  setRnboDevice(device: RnboModule | null) {
    this._rnboDevice = device;
  }
}

export const audioStore = new AudioStore();
