import { AspectRatio, AudioConfig, TextOverlay } from '../types';

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const renderAndDownloadVideo = async (
  videoUrl: string,
  aspectRatio: AspectRatio,
  textOverlay: TextOverlay,
  audioConfig: AudioConfig,
  format: 'mp4' | 'mov',
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

      // Must be in DOM on mobile for play() to work
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
        // Best supported codec — vp9 > vp8 > webm > mp4
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
          const ext = mime.includes('mp4') ? (format === 'mov' ? 'mov' : 'mp4') : 'webm';
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
            // object-fit: cover — fill canvas, crop excess from centre
            const scale = Math.max(width / vw, height / vh);
            const srcW = width  / scale;
            const srcH = height / scale;
            const srcX = (vw - srcW) / 2;
            const srcY = (vh - srcH) / 2;
            ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, width, height);
          }

          // Text overlay
          if (textOverlay.text) {
            const fontSize = Math.floor(textOverlay.size * (height / 800));
            ctx.save();
            ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
            ctx.fillStyle = textOverlay.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = Math.max(8, fontSize * 0.2);
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            let textY = height / 2;
            if (textOverlay.position === 'top')    textY = height * 0.12;
            if (textOverlay.position === 'bottom')  textY = height * 0.82;

            const lines = textOverlay.text.split('\n');
            lines.forEach((line, i) => {
              const offset = (i - (lines.length - 1) / 2) * fontSize * 1.2;
              ctx.fillText(line, width / 2, textY + offset);
            });
            ctx.restore();
          }

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
