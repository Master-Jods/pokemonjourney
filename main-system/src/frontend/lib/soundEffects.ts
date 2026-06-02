import { Platform } from 'react-native';
import { Audio } from 'expo-av';

let webBackgroundMusic: HTMLAudioElement | null = null;
let nativeBackgroundMusic: Audio.Sound | null = null;

export function startBackgroundMusic() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    try {
      if (!webBackgroundMusic) {
        webBackgroundMusic = new window.Audio('/bgmusic.mp3');
        webBackgroundMusic.loop = true;
        webBackgroundMusic.volume = 0.22;
      }
      webBackgroundMusic.play().catch((err) => {
        console.log('Autoplay prevented on web, waiting for interaction:', err);
        const playOnInteraction = () => {
          webBackgroundMusic?.play().catch(() => {});
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('touchstart', playOnInteraction);
      });
    } catch (err) {
      console.log('Failed to start web background music:', err);
    }
  } else {
    try {
      if (!nativeBackgroundMusic) {
        Audio.Sound.createAsync(
          require('../../../assets/bgmusic.mp3'),
          { shouldPlay: true, isLooping: true, volume: 0.22 }
        ).then(({ sound }) => {
          nativeBackgroundMusic = sound;
        }).catch((err) => {
          console.error('Failed to load native background music:', err);
        });
      } else {
        nativeBackgroundMusic.playAsync().catch(() => {});
      }
    } catch (err) {
      // Silent catch
    }
  }
}

// Custom UI Sound Effects using Web Audio API (for Web) and expo-av (for Native Mobile)
let audioCtx: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;
let evolutionBuffer: AudioBuffer | null = null;


let nativeClickSound: Audio.Sound | null = null;
let nativeEvolutionSound: Audio.Sound | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
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

// 1. Web Initialization
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const ctx = getAudioContext();
  if (ctx) {
    // Load and decode Click Sound Effect
    fetch('/click.m4a')
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

// 2. Native Mobile Initialization
if (Platform.OS !== 'web') {
  // Ensure audio plays even in Silent/Vibrate mode on iOS!
  Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
    playThroughEarpieceAndroid: false,
  }).catch((err) => console.warn('Failed to configure audio mode:', err));

  // Pre-load sounds into memory for native mobile
  Audio.Sound.createAsync(
    require('../../../assets/click.m4a'),
    { shouldPlay: false, volume: 0.55 }
  ).then(({ sound }) => {
    nativeClickSound = sound;
  }).catch((err) => console.error('Failed to load native click sound:', err));

  Audio.Sound.createAsync(
    require('../../../assets/evolution.mp3'),
    { shouldPlay: false, volume: 1.0 }
  ).then(({ sound }) => {
    nativeEvolutionSound = sound;
  }).catch((err) => console.error('Failed to load native evolution sound:', err));
}

export function playClickSound() {
  if (Platform.OS === 'web') {
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
  } else {
    // Native Mobile Sound Effect Trigger
    try {
      if (nativeClickSound) {
        nativeClickSound.replayAsync().catch(() => {});
      }
    } catch (err) {
      // Silent catch
    }
  }
}

export function playEvolutionSound() {
  if (Platform.OS === 'web') {
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
  } else {
    // Native Mobile Sound Effect Trigger
    try {
      if (nativeEvolutionSound) {
        nativeEvolutionSound.replayAsync().catch(() => {});
      }
    } catch (err) {
      // Silent catch
    }
  }
}
