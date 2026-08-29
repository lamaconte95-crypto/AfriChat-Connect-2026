import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  Building2, 
  X, 
  UploadCloud, 
  Check, 
  Sparkles, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Camera, 
  ShieldCheck 
} from 'lucide-react';
import { OfficialPage, PageCategory, User } from '../types';
import { AFRICAN_COUNTRIES } from '../data/mockData';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onCreatePage: (newPage: Omit<OfficialPage, 'id' | 'createdAt'>) => void;
}

const CATEGORIES: { id: PageCategory; label: string; icon: string }[] = [
  { id: 'business', label: 'Entreprise & Marque', icon: '🏢' },
  { id: 'artist', label: 'Artiste & Musique', icon: '🎤' },
  { id: 'startup', label: 'Startup & Tech', icon: '🚀' },
  { id: 'community', label: 'Communauté & Asso', icon: '🤝' },
  { id: 'media', label: 'Média & Web TV', icon: '📺' },
  { id: 'creator', label: 'Créateur de Contenu', icon: '🌟' },
];

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCreatePage,
}) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [category, setCategory] = useState<PageCategory>('business');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState(currentUser.country);
  const [countryFlag, setCountryFlag] = useState(currentUser.flag);
  const [location, setLocation] = useState('Abidjan, Côte d’Ivoire');
  const [website, setWebsite] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedHandle = handle.startsWith('@')
      ? handle.trim()
      : `@${handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || name.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

    const catObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

    const newPageData: Omit<OfficialPage, 'id' | 'createdAt'> = {
      name: name.trim(),
      handle: formattedHandle,
      category: category,
      categoryLabel: catObj.label,
      description: description.trim(),
      avatar: avatarUrl,
      coverImage: coverUrl,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      isVerified: true,
      followersCount: 1,
      isFollowing: true,
      country: country,
      countryFlag: countryFlag,
      location: location.trim(),
      website: website.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      email: email.trim() || undefined,
    };

    onCreatePage(newPageData);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        id="create-page-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl text-stone-100 flex flex-col my-4 max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white flex items-center space-x-1.5">
                  <span>Créer une Page Officielle</span>
                  <span className="text-xs text-amber-400">🌟</span>
                </h3>
                <p className="text-[11px] text-stone-400">Pour votre entreprise, marque, art ou association</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Banner & Logo Customizer */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-300">
                Image de Couverture & Logo Officiel
              </label>

              {/* Cover Preview with Avatar Overlay */}
              <div className="relative rounded-2xl overflow-hidden aspect-[3/1] bg-stone-950 border border-stone-800 group">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center text-stone-600 text-xs">
                    <span>Bannière par défaut</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-amber-300 transition-opacity cursor-pointer space-x-1"
                >
                  <Camera className="w-4 h-4" />
                  <span>Changer bannière</span>
                </button>

                {/* Avatar */}
                <div className="absolute bottom-2 left-3 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-xl bg-stone-900 group/avatar">
                  <UserAvatar name={name || 'Page Officielle'} avatar={avatarUrl} size="lg" type="page" />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-[10px] text-white font-bold cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hidden Inputs */}
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={handleCoverFile}
                className="hidden"
              />
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="py-1.5 px-3 rounded-xl bg-stone-800 border border-stone-700 text-[11px] text-amber-300 font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <UploadCloud className="w-3 h-3" />
                  <span>Importer Logo Galerie</span>
                </button>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="py-1.5 px-3 rounded-xl bg-stone-800 border border-stone-700 text-[11px] text-stone-300 font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <UploadCloud className="w-3 h-3" />
                  <span>Importer Bannière Galerie</span>
                </button>
              </div>
            </div>

            {/* Name & Handle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Nom de la Page *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Studio Wax & Couture"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!handle) {
                      setHandle(`@${e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Identifiant Unique (@) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: @studio_wax_couture"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Catégorie de la page *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      category === cat.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-800/80 border-stone-700/80 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Description & Présentation *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Présentez vos services, produits, créations ou la mission de votre organisation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Contacts (WhatsApp, Site web, Location) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-stone-400 mb-1">WhatsApp Officiel</label>
                <div className="flex items-center bg-stone-800 rounded-xl px-2.5 py-1.5 border border-stone-700">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="+225 07 00 00 00"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-transparent text-xs text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 mb-1">Site Web ou Lien</label>
                <div className="flex items-center bg-stone-800 rounded-xl px-2.5 py-1.5 border border-stone-700">
                  <Globe className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
                  <input
                    type="url"
                    placeholder="https://mon-entreprise.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-transparent text-xs text-stone-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-sm shadow-xl shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Créer et Publier la Page Officielle</span>
                <span>🌟</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
