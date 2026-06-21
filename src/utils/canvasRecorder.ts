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

      // Lower resolution on mobile to prevent tab crash
      const dims: Record<AspectRatio, { width: number; height: number }> = mobile
        ? { '9:16': { width: 360, height: 640 }, '1:1': { width: 480, height: 480 },
            '16:9': { width: 640, height: 360 }, '3:4': { width: 480, height: 640 },
            '4:3': { width: 640, height: 480 } }
        : { '9:16': { width: 720, height: 1280 }, '1:1': { width: 1080, height: 1080 },
            '16:9': { width: 1280, height: 720 }, '3:4': { width: 1080, height: 1440 },
            '4:3': { width: 1440, height: 1080 } };

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
      // Required on mobile — must be attached to DOM to play
      video.style.position = 'fixed';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      video.style.width = '1px';
      video.style.height = '1px';
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
        if (document.body.contains(video)) document.body.removeChild(video);
        audioCtx?.close();
      };

      video.onloadedmetadata = () => {
        // Pick best supported codec
        const options: MediaRecorderOptions = {};
        const codecs = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
        for (const c of codecs) {
          if (MediaRecorder.isTypeSupported(c)) { options.mimeType = c; break; }
        }
        options.videoBitsPerSecond = mobile ? 1_500_000 : 5_000_000;

        // @ts-ignore
        const canvasStream = canvas.captureStream(fps);
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
          const ext = mime.includes('webm') ? 'webm' : (format === 'mov' ? 'mov' : 'mp4');
          resolve({ url, ext });
        };

        let animId = 0;
        let recording = false;

        const drawFrame = () => {
          if (video.ended || video.paused) return;
          ctx.clearRect(0, 0, width, height);

          // object-fit: cover
          const vw = video.videoWidth, vh = video.videoHeight;
          if (vw && vh) {
            const scale = Math.max(width / vw, height / vh);
            const nw = vw * scale, nh = vh * scale;
            const ox = (nw - width) / 2, oy = (nh - height) / 2;
            ctx.drawImage(video, -ox / scale * (1 / 1), -oy / scale * (1 / 1),
              vw - (ox / scale) * 2, vh - (oy / scale) * 2,
              0, 0, width, height);
          }

          if (textOverlay.text) {
            const fontSize = Math.floor(textOverlay.size * (height / 800));
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = textOverlay.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = Math.max(10, fontSize * 0.15);
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            let textY = height / 2;
            if (textOverlay.position === 'top') textY = height * 0.15;
            if (textOverlay.position === 'bottom') textY = height * 0.85;
            textOverlay.text.split('\n').forEach((line, i, arr) => {
              ctx.fillText(line, width / 2, textY + (i - (arr.length - 1) / 2) * fontSize * 1.2);
            });
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
