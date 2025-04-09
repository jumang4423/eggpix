import { audioStore } from "@/global";
import { createDevice } from "@rnbo/js";
import type { RnboModule } from "@/types";

let isElectronEnv = false;
try {
  // @ts-ignore - Dynamic import
  isElectronEnv = !!(window && window.process && window.process.type);
} catch (e) {
  isElectronEnv = false;
}

let WAContext = window.AudioContext || (window as any).webkitAudioContext;
export const context = new WAContext();

export const ensureAudioContext = async () => {
  if (isElectronEnv) {
    if (context.state !== "running") {
      await context.resume();
    }
    return true;
  } else {
    if (context.state === "suspended") {
      const overlay = document.getElementById("audio-permission-overlay");
      overlay?.classList.add("visible");
      return new Promise<boolean>((resolve) => {
        const button = document.getElementById("enable-audio-btn");
        const clickHandler = async () => {
          await context.resume();
          overlay?.classList.remove("visible");
          button?.removeEventListener("click", clickHandler);
          resolve(true);
        };
        button?.addEventListener("click", clickHandler);
      });
    }
    return context.state === "running";
  }
};

// RNBO

export async function SetupDevice(context: AudioContext): Promise<RnboModule> {
  let rawPatcher = await fetch("rnbo/granular/patch.export.json");
  let patcher = await rawPatcher.json();
  const device = await createDevice({ context, patcher });
  device.node.connect(context.destination);

  const dependencies = await (
    await fetch("rnbo/granular/dependencies.json")
  ).json();

  const results = await device.loadDataBufferDependencies(dependencies);
  const isSuccess = results.every((result) => result.type === "success");
  if (!isSuccess) throw new Error("RNBO patch failed to load sample data");
  const changeBuffer = async (arrayBuf: ArrayBuffer) => {
    const audioBuf = await context.decodeAudioData(arrayBuf);
    await device.setDataBuffer("buf_sample", audioBuf);
  };
  const changePos = (newPos: number) => {
    const pos = device.parametersById.get("pos");
    pos.value = newPos;
  };
  const changePitch = (newPitch: number) => {
    const pitch = device.parametersById.get("pitch");
    pitch.value = newPitch;
  };
  const startPlaying = () => {
    const play = device.parametersById.get("play");
    play.value = 1;
  };
  const stopPlaying = () => {
    const play = device.parametersById.get("play");
    play.value = 0;
  };
  return {
    device,
    changeBuffer,
    changePos,
    changePitch,
    startPlaying,
    stopPlaying,
  };
}

export const SetupAudio = async () => {
  await ensureAudioContext();
  const device = await SetupDevice(context);
  audioStore.setRnboDevice(device);
  audioStore.setAudioStarted(true);
  //   audioStore.rnboDevice?.startPlaying();
  return device;
};
