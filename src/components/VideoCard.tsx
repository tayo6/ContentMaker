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

  // We find a medium quality video for hover preview to save bandwidth, proxy it
  const rawPreview = video.video_files.find(f => f.quality === 'sd') || video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
  const previewVideoInfo = rawPreview
    ? { ...rawPreview, link: `/api/proxy?url=${encodeURIComponent(rawPreview.link)}` }
    : null;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="relative group cursor-pointer rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-sm transition-all aspect-video"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick(video)}
    >
      <img
        src={video.image}
        alt="Video thumbnail"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
      />
      
      {previewVideoInfo && (
        <video
          ref={videoRef}
          src={previewVideoInfo.link}
          autoPlay={false}
          loop
          muted={isMuted}
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Overlay details */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white shadow-sm truncate max-w-[150px]">
            {video.user.name}
          </span>
        </div>
        <div className="text-xs font-medium text-white px-2 py-1 bg-black/60 backdrop-blur-sm rounded-sm">
          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <button
          onClick={toggleMute}
          className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 backdrop-blur-sm transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md rounded-full p-4 text-blue-600 shadow-lg">
          <Play className="w-8 h-8 fill-current" />
        </div>
      </div>

      {/* Source Badge */}
      <div 
        className="absolute top-3 left-3 shadow-sm z-10"
        title={`Source: ${video.source}`}
      >
        <div className={`w-3.5 h-3.5 rounded-full border border-white shadow-sm ${
          video.source.toLowerCase() === 'pixabay' ? 'bg-blue-500' : 
          video.source.toLowerCase() === 'pexels' ? 'bg-green-500' : 
          'bg-gray-500'
        }`} />
      </div>
    </motion.div>
  );
}
