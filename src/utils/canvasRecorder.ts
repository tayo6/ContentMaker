import { AspectRatio, AudioConfig, TextOverlay } from '../types';

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** Wrap a string into lines that fit within maxWidth on the given canvas context */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      // If a single word is too long, force it on its own line
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export const renderAndDownloadVideo = async (
  videoUrl: string,
  aspectRatio: AspectRatio,
  textOverlays: TextOverlay[],
  audioConfig: AudioConfig,
  _format: 'mp4' | 'webm',
  onProgress: (progress: number) => void
): Promise<{ url: string; ext: string }> => {
  return new Promise((resolve, reject) => {
    try {
      const mobile = isMobile();

      const dims: Record<AspectRatio, { width: number; height: number }> = mobile
        ? {
            '9:16': { width: 360,  height: 640  },
            '1:1':  { width: 480,  height: 480  },
            '16:9': { width: 640,  height: 360  },
            '3:4':  { width: 480,  height: 640  },
            '4:3':  { width: 640,  height: 480  },
          }
        : {
            '9:16': { width: 720,  height: 1280 },
            '1:1':  { width: 1080, height: 1080 },
            '16:9': { width: 1280, height: 720  },
            '3:4':  { width: 1080, height: 1440 },
            '4:3':  { width: 1440, height: 1080 },
          };

      const { width, height } = dims[aspectRatio];
      const fps = mobile ? 15 : 30;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = `/api/proxy?url=${encodeURIComponent(videoUrl)}`;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;';
      document.body.appendChild(video);

      let customAudioElement: HTMLAudioElement | null = null;
      let audioCtx: AudioContext | null = null;

      if (audioConfig.url) {
        customAudioElement = new Audio();
        customAudioElement.crossOrigin = 'anonymous';
        customAudioElement.src = audioConfig.url;
        customAudioElement.currentTime = audioConfig.trimStart;
      }

      const cleanup = () => {
        try { if (document.body.contains(video)) document.body.removeChild(video); } catch (_) {}
        try { audioCtx?.close(); } catch (_) {}
      };

      video.onloadedmetadata = () => {
        const options: MediaRecorderOptions = {};
        const codecs = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4',
        ];
        for (const c of codecs) {
          if (MediaRecorder.isTypeSupported(c)) { options.mimeType = c; break; }
        }
        options.videoBitsPerSecond = mobile ? 3_000_000 : 8_000_000;

        // @ts-ignore
        const canvasStream: MediaStream = canvas.captureStream(fps);
        let finalStream = canvasStream;

        if (customAudioElement) {
          try {
            audioCtx = new AudioContext();
            const dest = audioCtx.createMediaStreamDestination();
            audioCtx.createMediaElementSource(customAudioElement).connect(dest);
            const audioTracks = dest.stream.getAudioTracks();
            if (audioTracks.length > 0) {
              finalStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
            }
          } catch (e) { console.error('Audio init failed', e); }
        }

        const recorder = new MediaRecorder(finalStream, options);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };

        recorder.onstop = () => {
          cleanup();
          if (chunks.length === 0) { reject(new Error('No video data captured.')); return; }
          const mime = recorder.mimeType || options.mimeType || 'video/webm';
          const blob = new Blob(chunks, { type: mime });
          const url = URL.createObjectURL(blob);
          const ext = mime.includes('mp4') ? 'mp4' : 'webm';
          resolve({ url, ext });
        };

        let animId = 0;
        let recording = false;

        const drawFrame = () => {
          if (video.ended || video.paused) return;
          ctx.clearRect(0, 0, width, height);

          const vw = video.videoWidth;
          const vh = video.videoHeight;

          if (vw > 0 && vh > 0) {
            // object-fit: cover
            const scale = Math.max(width / vw, height / vh);
            const srcW = width  / scale;
            const srcH = height / scale;
            const srcX = (vw - srcW) / 2;
            const srcY = (vh - srcH) / 2;
            ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, width, height);
          }

          // ── Text overlay with word-wrap ──
          textOverlays.forEach((overlay) => {
            if (!overlay.text) return;
            const fontSize = Math.floor(overlay.size * (height / 800));
            ctx.save();
            ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
            ctx.fillStyle = overlay.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = Math.max(8, fontSize * 0.2);
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // 88% of canvas width as the wrap boundary (leaves 6% margin each side)
            const maxTextWidth = width * 0.88;

            // Each \n in the textarea is an explicit line break;
            // within each segment, auto-wrap long words
            const inputLines = overlay.text.split('\n');
            const allLines: string[] = [];
            for (const seg of inputLines) {
              const wrapped = wrapText(ctx, seg, maxTextWidth);
              allLines.push(...wrapped);
            }

            let baseY = height / 2;
            if (overlay.position === 'top')    baseY = height * 0.12;
            if (overlay.position === 'bottom')  baseY = height * 0.82;

            const lineH = fontSize * 1.25;
            const totalH = lineH * allLines.length;
            // Shift block up so it's centred on baseY
            const startY = baseY - totalH / 2 + lineH / 2;

            allLines.forEach((line, i) => {
              ctx.fillText(line, width / 2, startY + i * lineH, maxTextWidth);
            });

            ctx.restore();
          });

          onProgress(Math.min((video.currentTime / video.duration) * 100, 100));
          animId = requestAnimationFrame(drawFrame);
        };

        video.onplay = () => {
          if (!recording) { recorder.start(500); recording = true; }
          if (customAudioElement?.paused) {
            audioCtx?.resume();
            customAudioElement.play().catch(console.error);
          }
          drawFrame();
        };

        video.onended = () => {
          cancelAnimationFrame(animId);
          customAudioElement?.pause();
          if (recording) recorder.stop();
        };

        video.onerror = () => { cleanup(); reject(new Error('Failed to load video.')); };

        const tryPlay = async () => {
          try {
            if (customAudioElement) {
              await new Promise<void>((r) => {
                customAudioElement!.oncanplay = () => r();
                if (customAudioElement!.readyState >= 3) r();
              });
            }
            await video.play();
          } catch (e) { cleanup(); reject(e); }
        };

        tryPlay();
      };

      video.load();
    } catch (e) {
      reject(e);
    }
  });
};
