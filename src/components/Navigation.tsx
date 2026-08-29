import React from 'react';
import { 
  Home, 
  Film, 
  Tv,
  Building2,
  MessageSquare, 
  Wallet, 
  User as UserIcon, 
  Crown,
  Sparkles,
  Radio
} from 'lucide-react';

export type NavTab = 'feed' | 'reels' | 'webtv' | 'pages' | 'messages' | 'wallet' | 'profile';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadMessagesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  unreadMessagesCount,
}) => {
  const tabs = [
    { id: 'feed' as NavTab, label: 'Fil d’actu', icon: Home },
    { id: 'reels' as NavTab, label: 'AfriShorts', icon: Film },
    { id: 'webtv' as NavTab, label: 'Web TV Live', icon: Tv },
    { id: 'pages' as NavTab, label: 'Pages', icon: Building2 },
    { id: 'messages' as NavTab, label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'wallet' as NavTab, label: 'AfriPay', icon: Wallet },
    { id: 'profile' as NavTab, label: 'Profil', icon: UserIcon },
  ];

  return (
    <nav
      id="app-bottom-navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-stone-950/95 backdrop-blur-xl border-t border-stone-800/90 py-1 px-1.5 max-w-4xl mx-auto shadow-2xl"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200 font-medium'
              }`}
            >
              <div className="relative">
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-amber-500/15 text-amber-400 scale-105' : ''
                }`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>

                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-[9px] shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[9.5px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
