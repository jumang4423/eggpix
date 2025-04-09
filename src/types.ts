import type { Device } from "@rnbo/js";

export type RnboModule = {
  device: Device;
  changeBuffer: (arrayBuf: ArrayBuffer) => Promise<void>;
  changePos: (newPos: number) => void;
  changePitch: (newPitch: number) => void;
  startPlaying: () => void;
  stopPlaying: () => void;
};
