export const POKEMON_BACKGROUND_VIDEO_ID = 'YMEblRM4pGc';

let backgroundMusicFrame: HTMLIFrameElement | null = null;

function createHiddenYouTubeFrame(videoId: string, loop = false) {
  if (typeof document === 'undefined') return null;

  const iframe = document.createElement('iframe');
  const loopParams = loop ? `&loop=1&playlist=${videoId}` : '';

  iframe.src =
    `https://www.youtube.com/embed/${videoId}` +
    `?enablejsapi=1&autoplay=1&controls=0&playsinline=1&rel=0&modestbranding=1${loopParams}`;
  iframe.allow = 'autoplay; encrypted-media';
  iframe.title = 'Pokemon background music';
  iframe.style.position = 'fixed';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';

  document.body.appendChild(iframe);
  return iframe;
}

function sendYouTubeCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  if (!iframe) return;
  iframe.contentWindow?.postMessage(
    JSON.stringify({
      event: 'command',
      func,
      args,
    }),
    '*',
  );
}

export function startBackgroundMusic() {
  if (typeof window === 'undefined') return;

  if (backgroundMusicFrame) {
    sendYouTubeCommand(backgroundMusicFrame, 'setVolume', [18]);
    sendYouTubeCommand(backgroundMusicFrame, 'playVideo');
    return;
  }

  const frame = createHiddenYouTubeFrame(POKEMON_BACKGROUND_VIDEO_ID, true);
  if (!frame) return;

  backgroundMusicFrame = frame;
  window.setTimeout(() => {
    sendYouTubeCommand(backgroundMusicFrame, 'setVolume', [18]);
    sendYouTubeCommand(backgroundMusicFrame, 'playVideo');
  }, 1000);
}

// Custom UI Sound Effects using Web Audio API (Zero Latency & Auto-Trimming)
let audioCtx: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;
let evolutionBuffer: AudioBuffer | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Programmatically trims silence from the beginning of an AudioBuffer in memory.
 * This physically cuts the leading quiet space for instant snappy sound effects!
 */
function trimAudioBufferSilence(buffer: AudioBuffer, threshold = 0.005): AudioBuffer {
  const ctx = getAudioContext();
  if (!ctx) return buffer;

  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  let firstSoundIndex = buffer.length;

  // Scan samples to find the first peak exceeding the noise threshold
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > threshold) {
        if (i < firstSoundIndex) {
          firstSoundIndex = i;
        }
        break;
      }
    }
  }

  // If no silent gap is found or is negligible, return original buffer
  if (firstSoundIndex >= buffer.length || firstSoundIndex < 10) {
    return buffer;
  }

  // Create a new trimmed buffer in memory (cutting the starting silent bytes)
  const trimmedLength = buffer.length - firstSoundIndex;
  const trimmedBuffer = ctx.createBuffer(channels, trimmedLength, sampleRate);

  for (let c = 0; c < channels; c++) {
    const originalData = buffer.getChannelData(c);
    const trimmedData = trimmedBuffer.getChannelData(c);
    trimmedData.set(originalData.subarray(firstSoundIndex));
  }

  return trimmedBuffer;
}

// Fetch and pre-decode sounds in the background
if (typeof window !== 'undefined') {
  const ctx = getAudioContext();
  if (ctx) {
    // Load and decode Click Sound Effect
    fetch('/click.mp3')
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        // Trim silence to cut out the initial delay completely
        clickBuffer = trimAudioBufferSilence(audioBuffer, 0.008);
      })
      .catch((err) => console.error('Failed to load click sound:', err));

    // Load and decode Evolution Sound Effect
    fetch('/evolution.mp3')
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        evolutionBuffer = audioBuffer;
      })
      .catch((err) => console.error('Failed to load evolution sound:', err));
  }
}

export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx || !clickBuffer) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Web Audio API buffer source node for sub-millisecond instant playback latency
    const source = ctx.createBufferSource();
    source.buffer = clickBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.55;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  } catch (err) {
    // Silent catch
  }
}

export function playEvolutionSound() {
  const ctx = getAudioContext();
  if (!ctx || !evolutionBuffer) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const source = ctx.createBufferSource();
    source.buffer = evolutionBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.4;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  } catch (err) {
    // Silent catch
  }
}
