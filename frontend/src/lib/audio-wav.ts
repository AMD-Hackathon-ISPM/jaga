/**
 * Client-side conversion of a recorded audio Blob (WebM/Opus from
 * MediaRecorder) into a 16 kHz mono 16-bit PCM WAV File — the only format
 * the backend and model services can decode.
 */

/** Target sample rate expected by the server-side cough models. */
export const WAV_SAMPLE_RATE = 16_000;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor {
  const ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!ctor) throw new Error("Web Audio is unavailable.");
  return ctor;
}

/** Decode arbitrary compressed audio bytes into an AudioBuffer. */
async function decode(bytes: ArrayBuffer): Promise<AudioBuffer> {
  const Ctx = getAudioContextCtor();
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(bytes);
  } finally {
    void ctx.close().catch(() => {});
  }
}

/** Downmix to mono and resample to `WAV_SAMPLE_RATE` via offline rendering. */
async function toMono16k(buffer: AudioBuffer): Promise<AudioBuffer> {
  const length = Math.max(1, Math.ceil(buffer.duration * WAV_SAMPLE_RATE));
  const offline = new OfflineAudioContext(1, length, WAV_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start();
  return offline.startRendering();
}

/** Encode a mono AudioBuffer as a 16-bit PCM RIFF/WAV Blob. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const samples = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const out = new DataView(new ArrayBuffer(44 + dataSize));

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) out.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, "RIFF");
  out.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  out.setUint32(16, 16, true); // PCM chunk size
  out.setUint16(20, 1, true); // PCM format
  out.setUint16(22, 1, true); // mono
  out.setUint32(24, sampleRate, true);
  out.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  out.setUint16(32, bytesPerSample, true); // block align
  out.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  out.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out.setInt16(44 + i * bytesPerSample, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([out.buffer], { type: "audio/wav" });
}

/**
 * Convert a recorded audio Blob/File into a mono 16 kHz 16-bit PCM WAV File.
 * Throws if the browser cannot decode the input; callers should fall back to
 * uploading the original file.
 */
export async function convertToWavFile(blob: Blob): Promise<File> {
  const decoded = await decode(await blob.arrayBuffer());
  const mono = await toMono16k(decoded);
  return new File([encodeWav(mono)], `cough-${Date.now()}.wav`, {
    type: "audio/wav",
    lastModified: Date.now(),
  });
}
