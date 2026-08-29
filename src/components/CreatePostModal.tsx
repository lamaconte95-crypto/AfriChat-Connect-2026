import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  X, 
  ArrowLeft,
  Image as ImageIcon, 
  Video as VideoIcon, 
  Lock, 
  Sparkles, 
  MapPin, 
  Tag, 
  Check, 
  Crown,
  Camera,
  UploadCloud,
  FileImage,
  Trash2,
  User as UserIcon,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Database,
  CloudCheck,
  Video
} from 'lucide-react';
import { Post, User, OfficialPage } from '../types';
import { supabaseUploadPostMedia, POSTS_MEDIA_BUCKET } from '../services/supabaseService';
import { getWebhookConfig } from '../services/webhookService';
import { Radio } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  currentUser: User;
  officialPages?: OfficialPage[];
  onClose: () => void;
  onSubmitPost: (newPost: Partial<Post>) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  currentUser,
  officialPages = [],
  onClose,
  onSubmitPost,
}) => {
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('image');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isVIPOnly, setIsVIPOnly] = useState(false);
  const [vipPrice, setVipPrice] = useState(1000);
  const [location, setLocation] = useState("Abidjan, Côte d'Ivoire");
  const [tags, setTags] = useState('#AfriChat #Afrique #Innovation');
  const [postAsPageId, setPostAsPageId] = useState<string>('personal');

  // Supabase Storage Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [storageStatus, setStorageStatus] = useState<'idle' | 'uploading' | 'synced' | 'local'>('idle');

  // Video preview player state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Hidden File Inputs
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
    setUploadProgress(10);
    setStorageStatus('uploading');

    // Local instant preview
    const tempUrl = URL.createObjectURL(file);
    setMediaUrl(tempUrl);

    try {
      // Connect to Supabase Storage bucket 'posts-media'
      const uploadResult = await supabaseUploadPostMedia(
        currentUser.id,
        file,
        file.name,
        (progress) => setUploadProgress(progress)
      );

      if (uploadResult.url) {
        setMediaUrl(uploadResult.url);
        setStorageStatus(uploadResult.simulated ? 'local' : 'synced');
      }
    } catch (err) {
      console.warn('Erreur lors de l\'envoi vers Supabase Storage, utilisation de la prévisualisation locale', err);
      setStorageStatus('local');
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleCameraPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleCameraVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleRemoveMedia = () => {
    setMediaUrl('');
    setUploadedFileName(null);
    setMediaType('text');
    setStorageStatus('idle');
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (photoCameraInputRef.current) photoCameraInputRef.current.value = '';
    if (videoCameraInputRef.current) videoCameraInputRef.current.value = '';
  };

  const toggleVideoPlayback = () => {
    if (!previewVideoRef.current) return;
    if (isVideoPlaying) {
      previewVideoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      previewVideoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) return;

    const parsedTags = tags
      .split(' ')
      .filter((t) => t.startsWith('#') || t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    // Determine author (personal vs page)
    const selectedPage = officialPages.find((p) => p.id === postAsPageId);

    const postData: Partial<Post> = {
      content: content.trim(),
      mediaType: mediaUrl ? mediaType : 'text',
      mediaUrl: mediaUrl || undefined,
      isVIPOnly: isVIPOnly,
      vipPrice: isVIPOnly ? Number(vipPrice) : undefined,
      isUnlocked: true,
      location: location,
      tags: parsedTags,
      author: selectedPage
        ? {
            id: selectedPage.id,
            name: selectedPage.name,
            username: selectedPage.handle,
            avatar: selectedPage.avatar,
            flag: selectedPage.countryFlag,
            country: selectedPage.country,
            isVerified: true,
            isVIPCreator: true,
          }
        : undefined,
    };

    onSubmitPost(postData);
    onClose();
  };

  const myCreatedPages = officialPages.filter(
    (p) => p.creatorId === currentUser.id || p.creatorName === currentUser.name || p.creatorId === 'user_1'
  );

  return (
    <AnimatePresence>
      <div 
        id="create-post-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl text-stone-100 flex flex-col max-h-[90vh]"
        >
          {/* Universal Navigation Header with Back Arrow ← */}
          <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/95 sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              {/* Universal Back Arrow */}
              <button
                id="create-post-back-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/80 transition-all flex items-center space-x-1.5 cursor-pointer group"
                title="Retour au fil d'actualité"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-bold hidden xs:inline">Retour</span>
              </button>

              <div className="flex items-center space-x-2.5">
                <UserAvatar
                  name={currentUser.name}
                  avatar={currentUser.avatar}
                  size="sm"
                />
                <div>
                  <h3 className="font-bold text-sm text-stone-100 leading-tight">Créer une Publication</h3>
                  <span className="text-[10px] text-amber-400 font-medium">Supabase Storage : bucket posts-media</span>
                </div>
              </div>
            </div>

            <button
              id="create-post-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Identity Switcher (Personal vs Official Page) */}
            {myCreatedPages.length > 0 && (
              <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-2">
                <label className="block text-[11px] font-bold text-stone-400">
                  Publier en tant que :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPostAsPageId('personal')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all cursor-pointer ${
                      postAsPageId === 'personal'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span className="truncate">Moi ({currentUser.name})</span>
                  </button>

                  <select
                    value={postAsPageId === 'personal' ? '' : postAsPageId}
                    onChange={(e) => setPostAsPageId(e.target.value || 'personal')}
                    className="p-2 rounded-xl bg-stone-800 border border-stone-700 text-xs font-bold text-stone-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">👤 Profil Personnel</option>
                    {myCreatedPages.map((p) => (
                      <option key={p.id} value={p.id}>
                        📄 {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Post Text Description */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Exprimez-vous, partagez une actualité, une photo ou une vidéo de votre galerie..."
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-stone-800 border border-stone-700/80 text-stone-100 text-sm placeholder:text-stone-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                required
              />
            </div>

            {/* Multimedia Upload Hub: Galerie Téléphone + Prise Photo Caméra + Enregistrement Vidéo */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-stone-200">
                    Multimédia & Caméra (Galerie Téléphone)
                  </span>
                </div>
                {mediaUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer font-semibold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>

              {/* Hidden Native File and Camera Inputs */}
              {/* 1. Phone Gallery (Images & Videos) */}
              <input
                type="file"
                ref={galleryInputRef}
                accept="image/*,video/*"
                onChange={handleGallerySelect}
                className="hidden"
                id="gallery-file-picker"
              />
              {/* 2. Direct Camera Photo Capture */}
              <input
                type="file"
                ref={photoCameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleCameraPhoto}
                className="hidden"
                id="camera-photo-capture"
              />
              {/* 3. Direct Camera Video Recording */}
              <input
                type="file"
                ref={videoCameraInputRef}
                accept="video/*"
                capture="environment"
                onChange={handleCameraVideo}
                className="hidden"
                id="camera-video-capture"
              />

              {/* 3 Dedicated Fast Action Buttons for Mobile & Desktop */}
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Galerie Téléphone */}
                <button
                  type="button"
                  id="btn-upload-gallery"
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer text-center"
                >
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] leading-tight">Galerie Téléphone</span>
                </button>

                {/* 2. Prendre une Photo */}
                <button
                  type="button"
                  id="btn-take-photo"
                  onClick={() => photoCameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer text-center"
                >
                  <Camera className="w-4 h-4 text-orange-400" />
                  <span className="text-[11px] leading-tight">Prendre Photo</span>
                </button>

                {/* 3. Enregistrer Vidéo */}
                <button
                  type="button"
                  id="btn-record-video"
                  onClick={() => videoCameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer text-center"
                >
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] leading-tight">Enregistrer Vidéo</span>
                </button>
              </div>

              {/* Upload Progress & Supabase Storage Bucket Badge */}
              {isUploading && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span className="flex items-center space-x-1.5">
                      <Database className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                      <span>Téléversement vers Supabase (bucket: {POSTS_MEDIA_BUCKET})...</span>
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Storage Confirmation Badge */}
              {!isUploading && storageStatus === 'synced' && (
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-xl">
                  <Check className="w-3.5 h-3.5" />
                  <span>Synchronisé avec succès sur Supabase Storage (bucket: {POSTS_MEDIA_BUCKET})</span>
                </div>
              )}

              {/* Media Preview Player & Visualizer */}
              {mediaUrl && (
                <div className="relative rounded-2xl overflow-hidden bg-stone-950 border border-amber-500/30 max-h-56 flex items-center justify-center group">
                  {mediaType === 'video' ? (
                    <div className="relative w-full h-full">
                      <video
                        ref={previewVideoRef}
                        src={mediaUrl}
                        controls
                        muted={isVideoMuted}
                        className="w-full max-h-56 object-cover rounded-xl"
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                      />
                      {/* Overlay audio & play controllers */}
                      <div className="absolute top-2 right-2 flex items-center space-x-1.5 z-10">
                        <button
                          type="button"
                          onClick={() => {
                            setIsVideoMuted(!isVideoMuted);
                            if (previewVideoRef.current) previewVideoRef.current.muted = !isVideoMuted;
                          }}
                          className="p-1.5 rounded-lg bg-black/70 backdrop-blur text-white hover:text-amber-400 text-xs transition-colors"
                          title={isVideoMuted ? 'Activer le son' : 'Couper le son'}
                        >
                          {isVideoMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Aperçu du média"
                      className="w-full max-h-56 object-cover rounded-xl"
                    />
                  )}

                  {uploadedFileName && (
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur text-[10px] font-bold text-amber-300 flex items-center space-x-1 border border-amber-500/30">
                      <FileImage className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{uploadedFileName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* VIP Monetization Option */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-800 to-stone-800 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-amber-300 flex items-center space-x-1">
                      <span>Monétisation Mobile Money</span>
                      <Sparkles className="w-3 h-3" />
                    </span>
                    <p className="text-[11px] text-stone-400">Verrouiller ce post pour les abonnés payants</p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isVIPOnly}
                  onChange={(e) => setIsVIPOnly(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {isVIPOnly && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2 border-t border-stone-700/60 flex items-center space-x-3"
                >
                  <label className="text-xs text-stone-300 shrink-0 font-medium">Prix d'accès :</label>
                  <select
                    value={vipPrice}
                    onChange={(e) => setVipPrice(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-900 border border-amber-500/50 text-amber-300 font-bold text-xs focus:outline-none"
                  >
                    <option value={500}>500 FCFA (~0.75 €) 🍊 🌊</option>
                    <option value={1000}>1.000 FCFA (~1.50 €) 🍊 🌊</option>
                    <option value={2500}>2.500 FCFA (~3.80 €) 👑</option>
                    <option value={5000}>5.000 FCFA (~7.60 €) 💎</option>
                  </select>
                </motion.div>
              )}
            </div>

            {/* Location & Hashtags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Localisation</label>
                <div className="flex items-center bg-stone-800 rounded-xl px-3 py-2 border border-stone-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent text-xs text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Hashtags</label>
                <div className="flex items-center bg-stone-800 rounded-xl px-3 py-2 border border-stone-700">
                  <Tag className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-transparent text-xs text-stone-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Webhook Syndication Badge (Facebook & TikTok) */}
            {!isVIPOnly && getWebhookConfig().enabled && (
              <div className="px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-[11px] text-indigo-300">
                <div className="flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>Publication synchronisée vers <strong>Facebook</strong> & <strong>TikTok</strong> (Webhook)</span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                  Auto-Publish
                </span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                id="submit-post-btn"
                disabled={isUploading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-stone-950 font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 cursor-pointer hover:scale-101 active:scale-98 transition-all"
              >
                <span>{isUploading ? 'Téléversement en cours...' : 'Publier sur AfriChat'}</span>
                <span>🚀</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
