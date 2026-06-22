import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { VideoInfo } from '../types';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface VideoCardProps {
  video: VideoInfo;
  onClick: (video: VideoInfo) => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const rawPreview = video.video_files.find(f => f.quality === 'sd') || video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
  const previewVideoInfo = rawPreview
    ? { ...rawPreview, link: `/api/proxy?url=${encodeURIComponent(rawPreview.link)}` }
    : null;

  const handleMouseEnter = () => {
    setIsHovered(true);
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    videoRef.current?.pause();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const mins = Math.floor(video.duration / 60);
  const secs = (video.duration % 60).toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="relative group cursor-pointer aspect-[3/4] overflow-hidden"
      style={{
        borderRadius: '16px',
        background: '#E9E9E9',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick(video)}
    >
      <img
        src={video.image}
        alt="Video thumbnail"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 will-change-transform"
        style={{ transform: isHovered ? 'scale(1.03)' : 'scale(1)' }}
      />

      {previewVideoInfo && (
        <video
          ref={videoRef}
          src={previewVideoInfo.link}
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0 }}
        />
      )}

      {/* Hover dark gradient overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)',
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Mute toggle */}
      <div
        className="absolute top-4 right-4 transition-opacity duration-200"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <button
          onClick={toggleMute}
          className="p-2 rounded-full transition-colors bg-black/40 hover:bg-black/60 backdrop-blur-sm"
        >
          {isMuted
            ? <VolumeX className="w-4 h-4 text-white" />
            : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Detail overlay */}
      <div
        className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end transition-opacity duration-300"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <div className="flex items-center justify-between mt-auto">
          <span className="text-white font-bold truncate max-w-[140px] text-base drop-shadow-md">
            {video.user.name}
          </span>
          <span className="text-white text-xs font-bold px-2 py-1 rounded bg-black/40 backdrop-blur-md">
            {mins}:{secs}
          </span>
        </div>
        <button className="mt-3 w-full py-3 bg-[#E60023] hover:bg-[#AD081B] text-white font-bold rounded-full transition-colors text-sm">
          Save
        </button>
      </div>
    </motion.div>
  );
}
