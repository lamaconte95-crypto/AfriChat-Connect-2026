import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  X, 
  ArrowLeft, 
  Camera, 
  Video, 
  UploadCloud, 
  Sparkles, 
  Lock, 
  Crown, 
  Image as ImageIcon,
  CheckCircle,
  Play,
  Trash2
} from 'lucide-react';
import { Story, User } from '../types';
import { supabaseUploadStoryMedia, supabaseCreateStory } from '../services/supabaseService';

interface CreateStoryModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onSubmitStory: (newStory: Story) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSubmitStory,
}) => {
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isVIPLocked, setIsVIPLocked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const photoCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoCameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi)$/i.test(file.name);
    setMediaType(isVideo ? 'video' : 'image');
    setUploadedFileName(file.name);
    setIsUploading(true);
    setUploadProgress(15);

    const tempUrl = URL.createObjectURL(file);
    setMediaUrl(tempUrl);

    try {
      const uploadRes = await supabaseUploadStoryMedia(
        currentUser.id,
        file,
        `story_${Date.now()}_${file.name}`,
        (progress) => setUploadProgress(progress)
      );

      if (uploadRes.url) {
        setMediaUrl(uploadRes.url);
      }
    } catch (err) {
      console.warn('Story upload to Supabase warning:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return;

    const now = Date.now();
    const newStory: Story = {
      id: `story_${now}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userFlag: currentUser.flag || '🇨🇮',
      mediaUrl: mediaUrl,
      type: mediaType,
      caption: caption.trim() || 'Mon statut AfriChat ✨',
      timestamp: 'À l’instant',
      hasUnseen: true,
      vipLocked: isVIPLocked,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
    };

    supabaseCreateStory(newStory).catch((err) => {
      console.warn('Supabase create story error:', err);
    });

    onSubmitStory(newStory);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        id="create-story-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl text-stone-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/95 sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <button
                id="create-story-back-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Retour</span>
              </button>

              <div className="flex items-center space-x-2">
                <UserAvatar
                  name={currentUser.name}
                  avatar={currentUser.avatar}
                  size="sm"
                />
                <div>
                  <h3 className="font-bold text-sm text-stone-100 leading-tight">Publier une Story</h3>
                  <span className="text-[10px] text-amber-400 font-medium">Visible 24 heures par vos amis</span>
                </div>
              </div>
            </div>

            <button
              id="create-story-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Media Upload Buttons */}
            <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-200 flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Importer votre photo ou vidéo</span>
                </span>
                {isUploading && (
                  <span className="text-[10px] text-amber-400 animate-pulse font-medium">
                    Upload Supabase... {uploadProgress}%
                  </span>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleGallerySelect}
              />
              <input
                ref={photoCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleGallerySelect}
              />
              <input
                ref={videoCameraInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={handleGallerySelect}
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-stone-200 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5 text-amber-400" />
                  <span className="text-[11px] font-bold">Galerie</span>
                </button>

                <button
                  type="button"
                  onClick={() => photoCameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-stone-200 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span className="text-[11px] font-bold">Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => videoCameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-stone-200 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                >
                  <Video className="w-5 h-5 text-orange-400" />
                  <span className="text-[11px] font-bold">Vidéo</span>
                </button>
              </div>
            </div>

            {/* Media Preview Box */}
            <div className="relative rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 h-64 flex items-center justify-center">
              {mediaUrl && mediaUrl.trim() ? (
                mediaType === 'video' ? (
                  <video
                    src={mediaUrl.trim()}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaUrl.trim()}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-stone-500 p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Sélectionnez une photo ou vidéo ci-dessus</span>
                </div>
              )}

              {uploadedFileName && (
                <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-lg bg-black/75 backdrop-blur-md text-[10px] text-stone-300 truncate flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{uploadedFileName}</span>
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div>
              <label className="block text-[11px] font-bold text-stone-400 mb-1">
                Légende de votre Story (optionnel) :
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ajoutez un message court, un statut, des émojis..."
                className="w-full p-3 rounded-2xl bg-stone-800 border border-stone-700 text-stone-100 text-xs placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* VIP Story Option */}
            <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-200">Story Exclusive VIP</p>
                  <p className="text-[10px] text-stone-400">Réservée aux abonnés VIP ou déblocable</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVIPLocked}
                  onChange={(e) => setIsVIPLocked(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="publish-story-submit-btn"
              type="submit"
              disabled={isUploading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-stone-950 font-bold text-sm shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Publier mon statut maintenant</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
