type SoundEffect =
  | 'back'
  | 'choice'
  | 'defeat'
  | 'error'
  | 'flip'
  | 'match'
  | 'miss'
  | 'mystery'
  | 'reward'
  | 'select-pokemon'
  | 'success'
  | 'tab-battle'
  | 'tab-guess'
  | 'tab-logger'
  | 'tab-match'
  | 'trainer-found'
  | 'victory';

type AudioContextConstructor = typeof AudioContext;

const cryUrlCache = new Map<string, string>();
let audioContext: AudioContext | null = null;
let activeCry: HTMLAudioElement | null = null;
let activeCryResolve: (() => void) | null = null;
let activeVoiceLine: HTMLAudioElement | null = null;
let activeVoiceFrame: HTMLIFrameElement | null = null;
let backgroundMusicAudio: HTMLAudioElement | null = null;
let backgroundMusicFrame: HTMLIFrameElement | null = null;
let backgroundMusicGain: GainNode | null = null;
let backgroundMusicInterval: number | null = null;

const POKEMON_BACKGROUND_VIDEO_ID = 'YMEblRM4pGc';
const WHOS_THAT_POKEMON_VIDEO_ID = 'WIIufKSuduc';

function getAudioContext() {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    const AudioCtor =
      window.AudioContext ||
      ((window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext);

    if (!AudioCtor) return null;
    audioContext = new AudioCtor();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => undefined);
  }

  return audioContext;
}

function playTone(
  context: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playSequence(notes: Array<[number, number]>, type: OscillatorType = 'sine', volume = 0.08) {
  const context = getAudioContext();
  if (!context) return;

  let cursor = context.currentTime;
  notes.forEach(([frequency, duration]) => {
    playTone(context, frequency, cursor, duration, type, volume);
    cursor += duration * 0.85;
  });
}

function playMusicTone(
  context: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'triangle',
  volume = 0.35,
  destination: AudioNode | null = backgroundMusicGain,
) {
  if (!destination) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

function createHiddenYouTubeFrame(videoId: string, loop = false) {
  const iframe = document.createElement('iframe');
  const loopParams = loop ? `&loop=1&playlist=${videoId}` : '';

  iframe.src =
    `https://www.youtube.com/embed/${videoId}` +
    `?enablejsapi=1&autoplay=1&controls=0&playsinline=1&rel=0&modestbranding=1${loopParams}`;
  iframe.allow = 'autoplay; encrypted-media';
  iframe.title = 'Pokemon audio';
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
  iframe?.contentWindow?.postMessage(
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

  backgroundMusicFrame = createHiddenYouTubeFrame(POKEMON_BACKGROUND_VIDEO_ID, true);
  window.setTimeout(() => {
    sendYouTubeCommand(backgroundMusicFrame, 'setVolume', [18]);
    sendYouTubeCommand(backgroundMusicFrame, 'playVideo');
  }, 1000);
  return;

  if (backgroundMusicAudio) {
    backgroundMusicAudio.play().catch(() => undefined);
    return;
  }

  backgroundMusicAudio = new Audio('/sounds/pokemon-background.mp3');
  backgroundMusicAudio.loop = true;
  backgroundMusicAudio.volume = 0.16;
  backgroundMusicAudio.play().catch(() => {
    backgroundMusicAudio = null;
    startGeneratedBackgroundMusic();
  });
}

function startGeneratedBackgroundMusic() {
  const context = getAudioContext();
  if (!context || backgroundMusicInterval !== null) return;

  const lowPass = context.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 2200;

  backgroundMusicGain = context.createGain();
  backgroundMusicGain.gain.value = 0.032;
  backgroundMusicGain.connect(lowPass);
  lowPass.connect(context.destination);

  const melody = [
    523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440,
    493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 392,
    440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 587.33,
    523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 523.25, 392,
    523.25, 659.25, 783.99, 987.77, 880, 783.99, 659.25, 587.33,
    523.25, 493.88, 440, 493.88, 523.25, 587.33, 659.25, 523.25,
    440, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 440,
    392, 440, 493.88, 523.25, 587.33, 523.25, 493.88, 392,
  ];
  const bass = [130.81, 196, 220, 174.61, 146.83, 174.61, 196, 130.81];
  const arpeggios = [
    [261.63, 329.63, 392, 523.25],
    [392, 493.88, 587.33, 783.99],
    [440, 523.25, 659.25, 880],
    [349.23, 440, 523.25, 698.46],
    [293.66, 349.23, 440, 587.33],
    [349.23, 440, 523.25, 698.46],
    [392, 493.88, 587.33, 783.99],
    [261.63, 329.63, 392, 523.25],
  ];

  const schedulePhrase = () => {
    const start = context.currentTime + 0.08;

    melody.forEach((frequency, index) => {
      const duration = index % 8 === 7 ? 0.44 : 0.26;
      playMusicTone(context, frequency, start + index * 0.24, duration, 'triangle', 0.23);
    });

    bass.forEach((frequency, index) => {
      playMusicTone(context, frequency, start + index * 1.92, 1.1, 'sine', 0.16);
    });

    arpeggios.forEach((chord, chordIndex) => {
      chord.forEach((frequency, noteIndex) => {
        playMusicTone(
          context,
          frequency,
          start + chordIndex * 1.92 + noteIndex * 0.36,
          0.22,
          'sine',
          0.08,
        );
      });
    });
  };

  schedulePhrase();
  backgroundMusicInterval = window.setInterval(schedulePhrase, 15360);
}

export function speakWhosThatPokemon() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const voiceLine = new SpeechSynthesisUtterance("Who's that Pokemon?");
  voiceLine.rate = 0.95;
  voiceLine.pitch = 1.12;
  voiceLine.volume = 0.9;

  window.speechSynthesis.speak(voiceLine);
}

export async function playWhosThatPokemon() {
  if (typeof window === 'undefined') return;

  activeVoiceLine?.pause();
  activeVoiceLine = null;
  activeVoiceFrame?.remove();
  activeVoiceFrame = createHiddenYouTubeFrame(WHOS_THAT_POKEMON_VIDEO_ID);

  window.setTimeout(() => {
    sendYouTubeCommand(activeVoiceFrame, 'setVolume', [90]);
    sendYouTubeCommand(activeVoiceFrame, 'playVideo');
  }, 700);

  window.setTimeout(() => {
    activeVoiceFrame?.remove();
    activeVoiceFrame = null;
  }, 7000);
  return;

  try {
    const response = await fetch('/sounds/whos-that-pokemon.mp3', { method: 'HEAD' });

    if (!response.ok) {
      speakWhosThatPokemon();
      return;
    }

    activeVoiceLine = new Audio('/sounds/whos-that-pokemon.mp3');
    activeVoiceLine.volume = 0.9;
    await activeVoiceLine.play();
  } catch {
    speakWhosThatPokemon();
  }
}

export function playSound(effect: SoundEffect) {
  switch (effect) {
    case 'back':
      playSequence([[420, 0.08], [260, 0.12]], 'triangle', 0.06);
      break;
    case 'choice':
      playSequence([[660, 0.07]], 'square', 0.04);
      break;
    case 'defeat':
      playSequence([[330, 0.12], [240, 0.18], [180, 0.22]], 'sawtooth', 0.05);
      break;
    case 'error':
      playSequence([[180, 0.08], [140, 0.12]], 'sawtooth', 0.04);
      break;
    case 'flip':
      playSequence([[520, 0.04], [760, 0.05]], 'triangle', 0.035);
      break;
    case 'match':
      playSequence([[620, 0.08], [830, 0.1]], 'sine', 0.06);
      break;
    case 'miss':
      playSequence([[240, 0.08], [190, 0.1]], 'triangle', 0.04);
      break;
    case 'mystery':
      playSequence([[392, 0.1], [523, 0.1], [659, 0.18]], 'triangle', 0.055);
      break;
    case 'reward':
      playSequence([[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.18]], 'sine', 0.07);
      break;
    case 'select-pokemon':
      playSequence([[440, 0.08], [660, 0.12]], 'triangle', 0.055);
      break;
    case 'success':
      playSequence([[523, 0.08], [784, 0.12]], 'sine', 0.06);
      break;
    case 'tab-battle':
      playSequence([[220, 0.08], [440, 0.08], [330, 0.1]], 'sawtooth', 0.045);
      break;
    case 'tab-guess':
      playSequence([[392, 0.08], [587, 0.08], [494, 0.12]], 'triangle', 0.05);
      break;
    case 'tab-logger':
      playSequence([[330, 0.06], [330, 0.06], [440, 0.1]], 'square', 0.035);
      break;
    case 'tab-match':
      playSequence([[523, 0.05], [659, 0.05], [523, 0.08]], 'triangle', 0.045);
      break;
    case 'trainer-found':
      playSequence([[392, 0.08], [523, 0.08], [659, 0.14]], 'sine', 0.06);
      break;
    case 'victory':
      playSequence([[523, 0.08], [659, 0.08], [784, 0.1], [988, 0.2]], 'sine', 0.07);
      break;
  }
}

export function stopPokemonCry() {
  if (!activeCry) return;

  activeCry.pause();
  activeCry.currentTime = 0;
  activeCry = null;
  activeCryResolve?.();
  activeCryResolve = null;
}

async function getPokemonCryUrl(pokemonName: string) {
  const normalizedName = pokemonName.trim().toLowerCase().replace(/\s+/g, '-');
  if (!normalizedName) return null;

  let cryUrl = cryUrlCache.get(normalizedName);

  if (!cryUrl) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${normalizedName}`);
    if (!response.ok) {
      throw new Error('Pokemon cry was not found.');
    }

    const pokemon = await response.json();
    cryUrl = pokemon.cries?.latest || pokemon.cries?.legacy;

    if (!cryUrl) {
      throw new Error('Pokemon cry was not found.');
    }

    cryUrlCache.set(normalizedName, cryUrl);
  }

  return cryUrl;
}

export async function preloadPokemonCry(pokemonName: string) {
  await getPokemonCryUrl(pokemonName);
}

export async function playPokemonCry(pokemonName: string) {
  stopPokemonCry();

  const cryUrl = await getPokemonCryUrl(pokemonName);
  if (!cryUrl) return;

  activeCry = new Audio(cryUrl);
  activeCry.volume = 0.75;

  await activeCry.play();
  await new Promise<void>((resolve) => {
    if (!activeCry) {
      resolve();
      return;
    }

    activeCryResolve = resolve;
    activeCry.onended = () => {
      activeCry = null;
      activeCryResolve = null;
      resolve();
    };
    activeCry.onerror = () => {
      activeCry = null;
      activeCryResolve = null;
      resolve();
    };
  });
}
