import { AspectRatio, AudioConfig, TextOverlay, VideoInfo } from '../types';

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
      const dimensions = {
        '9:16': { width: 720, height: 1280 },
        '1:1': { width: 1080, height: 1080 },
        '16:9': { width: 1280, height: 720 },
        '3:4': { width: 1080, height: 1440 },
        '4:3': { width: 1440, height: 1080 }
      }[aspectRatio];

      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2d context');

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = `/api/proxy?url=${encodeURIComponent(videoUrl)}`;
      video.muted = true; // Video track itself is muted
      video.playsInline = true;

      // Handle custom audio if provided
      let customAudioElement: HTMLAudioElement | null = null;
      let audioCtx: AudioContext | null = null;
      let dest: MediaStreamAudioDestinationNode | null = null;

      if (audioConfig.url) {
        customAudioElement = new Audio();
        customAudioElement.crossOrigin = 'anonymous';
        customAudioElement.src = audioConfig.url;
        customAudioElement.currentTime = audioConfig.trimStart;
      }

      video.onloadedmetadata = () => {
        let mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported('video/mp4')) {
           console.warn('MP4 is not directly supported by MediaRecorder in this browser. Wrapping available stream in MP4/MOV structure.');
           mimeType = '';
        }

        const options: any = {};
        if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
           options.mimeType = mimeType;
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
           options.mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
           options.mimeType = 'video/webm';
        }

        // @ts-ignore
        const canvasStream = canvas.captureStream(30);
        let finalStream = canvasStream;
        
        if (customAudioElement) {
          try {
            audioCtx = new AudioContext();
            dest = audioCtx.createMediaStreamDestination();
            const sourceNode = audioCtx.createMediaElementSource(customAudioElement);
            sourceNode.connect(dest);
            const audioTracks = dest.stream.getAudioTracks();
            if (audioTracks.length > 0) {
               finalStream = new MediaStream([
                 ...canvasStream.getVideoTracks(),
                 ...audioTracks
               ]);
            }
          } catch(e) {
             console.error("Failed to initialize custom audio for recording", e);
          }
        }

        const recorder = new MediaRecorder(finalStream, Object.keys(options).length > 0 ? options : undefined);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          if (chunks.length === 0) {
            reject(new Error("Recording failed: No video data was captured."));
            return;
          }
          const actualMime = recorder.mimeType || options.mimeType || 'video/mp4';
          const blob = new Blob(chunks, { type: actualMime });
          const url = URL.createObjectURL(blob);
          const ext = actualMime.includes('webm') ? 'webm' : (format === 'mov' ? 'mov' : 'mp4');
          resolve({ url, ext });
        };

        let isRecording = false;
        let animationId = 0;

        const drawFrame = () => {
          if (video.ended || video.paused) return;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Render video with object-fit: cover
          const w = canvas.width;
          const h = canvas.height;
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const r = Math.min(w / vw, h / vh);
          let nw = vw * r;
          let nh = vh * r;
          let Math_abs = Math.abs;
          let ar = 1;

          if (nw < w) ar = w / nw;
          if (Math_abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
          nw *= ar;
          nh *= ar;

          const cw = vw / (nw / w);
          const ch = vh / (nh / h);
          let cx = (vw - cw) * 0.5;
          let cy = (vh - ch) * 0.5;

          if (cx < 0) { cx = 0; }
          if (cy < 0) { cy = 0; }

          ctx.drawImage(video, cx, cy, Math.min(cw, vw), Math.min(ch, vh), 0, 0, w, h);

          // Draw Text
          if (textOverlay.text) {
             const fontSize = Math.floor(textOverlay.size * (canvas.height / 800));
             ctx.font = `bold ${fontSize}px Inter, sans-serif`;
             ctx.fillStyle = textOverlay.color;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             
             ctx.shadowColor = 'rgba(0,0,0,0.8)';
             ctx.shadowBlur = Math.max(10, fontSize * 0.15);
             ctx.shadowOffsetX = 2;
             ctx.shadowOffsetY = 2;

             let textY = canvas.height / 2;
             if (textOverlay.position === 'top') textY = canvas.height * 0.15;
             if (textOverlay.position === 'bottom') textY = canvas.height * 0.85;

             const lines = textOverlay.text.split('\n');
             lines.forEach((line, i) => {
               const offset = (i - (lines.length - 1) / 2) * fontSize * 1.2;
               ctx.fillText(line, canvas.width / 2, textY + offset);
             });
          }

          onProgress(Math.min((video.currentTime / video.duration) * 100, 100));
          animationId = requestAnimationFrame(drawFrame);
        };

        const onBothStarted = () => {
          if (!isRecording) {
            recorder.start(100);
            isRecording = true;
          }
           requestAnimationFrame(() => {
                drawFrame();
            });
        };

        video.onplay = () => {
           if (customAudioElement && customAudioElement.paused) {
              if (audioCtx?.state === 'suspended') audioCtx.resume();
              customAudioElement.play().catch(e => console.error("Audio play failed", e));
           }
           onBothStarted();
        };

        video.onended = () => {
          cancelAnimationFrame(animationId);
          recorder.stop();
          if (customAudioElement) {
             customAudioElement.pause();
          }
        };

        video.onerror = (e) => {
           reject(new Error("Failed to load video for recording"));
        };

        const tryPlay = async () => {
           try {
              if (customAudioElement) {
                // Ensure audio is ready before video starts.
                 await new Promise<void>((res) => {
                    customAudioElement!.oncanplay = () => res();
                    if (customAudioElement!.readyState >= 3) res();
                 });
                 // We will trim end roughly by just stopping recording if it goes past, but let's keep it simple for now.
              }
              await video.play();
           } catch(e) { reject(e); }
        };

        tryPlay();
      };

      video.load();
    } catch (e) {
      reject(e);
    }
  });
};
