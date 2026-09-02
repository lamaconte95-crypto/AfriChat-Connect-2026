import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Adapté pour charger l'instance Supabase de votre projet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function UserList({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Chargement initial de la liste des utilisateurs
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur de chargement des utilisateurs:', error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();

    // 2. Écoute dynamique Realtime pour les nouveaux inscrits
    const userChannel = supabase
      .channel('realtime:profiles')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          setUsers((currentUsers) => {
            const exists = currentUsers.some((u) => u.id === payload.new.id);
            if (exists) return currentUsers;
            return [payload.new, ...currentUsers];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Chargement des membres...</div>;
  }

  return (
    <div className="divide-y divide-gray-100 overflow-y-auto max-h-[80vh]">
      {users.length === 0 ? (
        <p className="p-4 text-gray-400 text-sm text-center">Aucun utilisateur inscrit pour le moment.</p>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            onClick={() => onSelectUser && onSelectUser(user)}
            className="p-3 flex items-center gap-3 hover:bg-emerald-50 cursor-pointer transition rounded-lg"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-800 truncate">
                {user.username || 'Utilisateur AfriChat'}
              </h4>
              <p className="text-xs text-emerald-600 font-medium">Nouveau membre 👋</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
