import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Music, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface FeedVideoPlayerProps {
  src: string;
  poster?: string;
  musicTrack?: string;
  isVipUnlocked?: boolean;
}

export const FeedVideoPlayer: React.FC<FeedVideoPlayerProps> = ({
  src,
  poster,
  musicTrack,
  isVipUnlocked,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black overflow-hidden select-none group"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        className="w-full h-full object-cover cursor-pointer"
        onClick={togglePlay}
      />

      {/* VIP Badge */}
      {isVipUnlocked && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500/90 text-stone-950 text-[10px] font-black backdrop-blur-md flex items-center space-x-1 shadow-lg z-10">
          <Sparkles className="w-3 h-3" />
          <span>VIDÉO VIP DÉBLOQUÉE</span>
        </div>
      )}

      {/* Center Big Play Button when paused */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity"
        >
          <button
            type="button"
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-2xl border-2 border-white/40 cursor-pointer"
          >
            <Play className="w-8 h-8 ml-1 fill-stone-950" />
          </button>
        </div>
      )}

      {/* Music Track Badge */}
      {musicTrack && (
        <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 max-w-[65%] truncate text-white text-xs">
          <Music className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
          <span className="truncate">{musicTrack}</span>
        </div>
      )}

      {/* Sleek Bottom Control Bar */}
      <div 
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-stone-700/80 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex items-center justify-between text-[11px] text-stone-300 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-3">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="text-white hover:text-amber-400 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Replay / Reset to start */}
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play().catch(() => {});
                  setIsPlaying(true);
                }
              }}
              className="text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Recommencer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Sound & Volume Control */}
            <div className="flex items-center space-x-1.5 group/vol">
              <button
                type="button"
                onClick={toggleMute}
                className="text-white hover:text-amber-400 transition-colors cursor-pointer"
                title={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400 hidden sm:inline-block"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-stone-300 hover:text-white transition-colors p-1 rounded-lg cursor-pointer"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
