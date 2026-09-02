import React, { useState } from 'react';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  type: 'tv' | 'facebook';
}

export const AddContentModal: React.FC<AddContentModalProps> = ({ isOpen, onClose, onSubmit, type }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Général');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    onSubmit({
      id: Date.now().toString(),
      title,
      url,
      category,
      type
    });

    setTitle('');
    setUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 text-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4">
          {type === 'tv' ? '📺 Ajouter une chaîne Web TV' : '🔵 Ajouter une page Facebook'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              {type === 'tv' ? 'Nom de la chaîne' : 'Nom de la Page'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'tv' ? 'Ex: RTI Live, 2sTV...' : 'Ex: AfriChat Officiel'}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              {type === 'tv' ? 'Lien du Flux (URL HLS / Stream)' : 'Lien Facebook (URL)'}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={type === 'tv' ? 'https://.../stream.m3u8' : 'https://facebook.com/MaPage'}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Actualités">Actualités</option>
              <option value="Divertissement">Divertissement</option>
              <option value="Culture">Culture & Musique</option>
              <option value="Sports">Sports</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2.5 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2.5 rounded-xl transition"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
