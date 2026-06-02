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
