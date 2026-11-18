'use client';

/**
 * Records microphone audio and encodes it as 16-bit mono WAV.
 *
 * The HELPY API only accepts m4a/mp4/aac/mp3/wav containers and caps a single
 * upload chunk at 10 MB, so browser WebM/Opus output cannot be used. We capture
 * raw PCM through the Web Audio API and encode WAV client-side at 8 kHz, which
 * keeps a 10-minute voice note inside the upload limit.
 */

const TARGET_SAMPLE_RATE = 8000;
const MAX_SECONDS = 600;

function encodeWav(floatChunks, inputSampleRate) {
  const totalSamples = floatChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputSamples = Math.max(1, Math.floor(totalSamples / ratio));
  const buffer = new ArrayBuffer(44 + outputSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + outputSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_SAMPLE_RATE, true);
  view.setUint32(28, TARGET_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, outputSamples * 2, true);

  let writeOffset = 44;
  let absoluteIndex = 0;
  let chunkIndex = 0;
  let chunkStart = 0;

  for (let i = 0; i < outputSamples; i += 1) {
    const sourcePosition = i * ratio;
    const target = Math.floor(sourcePosition);

    while (
      chunkIndex < floatChunks.length - 1 &&
      target >= chunkStart + floatChunks[chunkIndex].length
    ) {
      chunkStart += floatChunks[chunkIndex].length;
      chunkIndex += 1;
    }

    const localIndex = Math.max(0, Math.min(floatChunks[chunkIndex].length - 1, target - chunkStart));
    let sample = floatChunks[chunkIndex][localIndex] ?? 0;
    sample = Math.max(-1, Math.min(1, sample));
    view.setInt16(writeOffset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    writeOffset += 2;
    absoluteIndex += 1;
  }

  return { blob: new Blob([buffer], { type: 'audio/wav' }), samples: outputSamples };
}

export async function startWavRecording() {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser does not support microphone recording.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('This browser does not support audio recording.');
  }

  const context = new AudioContextClass();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const chunks = [];
  let startedAt = performance.now();
  let stopped = false;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(context.destination);

  const cleanup = () => {
    stopped = true;
    try {
      processor.disconnect();
      source.disconnect();
    } catch {
      /* already disconnected */
    }
    stream.getTracks().forEach((track) => track.stop());
    context.close().catch(() => {});
  };

  return {
    get elapsedSeconds() {
      return (performance.now() - startedAt) / 1000;
    },
    async stop() {
      if (stopped) {
        return { blob: new Blob([], { type: 'audio/wav' }), durationSeconds: 0 };
      }
      const durationSeconds = Math.min(MAX_SECONDS, (performance.now() - startedAt) / 1000);
      cleanup();
      const { blob, samples } = encodeWav(chunks, context.sampleRate);
      return { blob, durationSeconds: Math.min(durationSeconds, samples / TARGET_SAMPLE_RATE) };
    },
    cancel() {
      if (!stopped) cleanup();
    },
  };
}

export async function sha256Hex(arrayBuffer) {
  if (!window.crypto?.subtle) {
    throw new Error('Secure hashing is unavailable. Use a modern browser over HTTPS.');
  }
  const digest = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export { MAX_SECONDS };
