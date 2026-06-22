export interface VideoFile {
  link: string;
  quality: string;
}

export interface VideoInfo {
  id: string;
  source: 'pexels' | 'pixabay';
  url: string;
  image: string;
  duration: number;
  width: number;
  height: number;
  video_files: VideoFile[];
  user: {
    name: string;
    url: string;
  };
}

export type AspectRatio = '9:16' | '1:1' | '16:9' | '3:4' | '4:3';

export interface TextOverlay {
  id: string;
  text: string;
  color: string;
  size: number;
  position: 'top' | 'middle' | 'bottom';
}

export interface AudioConfig {
  file: File | null;
  url: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
}
