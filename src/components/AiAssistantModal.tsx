import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Bot, 
  Send, 
  Sparkles, 
  Languages, 
  Briefcase, 
  HelpCircle, 
  Globe, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { User } from '../types';
import { generateAiAssistantResponse, AiChatMessage } from '../services/aiService';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenDeposit?: () => void;
  onOpenPayout?: () => void;
  onOpenLiveStudio?: () => void;
}

const QUICK_PROMPTS = [
  { icon: '💰', label: 'Consulter mon Solde', query: 'Quel est mon solde actuel et comment retirer mes gains Mobile Money ?' },
  { icon: '⭐', label: 'Comment devenir VIP Star ?', query: 'Explique-moi comment fonctionne le statut VIP Star et comment monétiser mes messages et appels' },
  { icon: '💳', label: 'Recharger Mobile Money', query: 'Comment recharger mon portefeuille avec Wave ou Orange Money et quels sont les délais ?' },
  { icon: '🎥', label: 'Lancer un Live Agora', query: 'Comment lancer un live vidéo avec Agora et recevoir des cadeaux virtuels en FCFA ?' },
  { icon: '🌍', label: 'Traduire en Wolof / Lingala', query: 'Comment dit-on "Bienvenue dans notre communauté panafricaine" en Wolof et en Lingala ?' },
  { icon: '🚀', label: 'Conseils Créateurs Afrique', query: 'Donne-moi 4 conseils pratiques pour développer mon audience et mes ventes sur AfriChat' },
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenDeposit,
  onOpenPayout,
  onOpenLiveStudio,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `👋 Bonjour **${currentUser.name}** ! Je suis l'**Assistant IA AfriChat**, propulsé par l'intelligence artificielle pour vous accompagner dans votre expérience panafricaine.\n\n💰 *Votre solde actuel : **${currentUser.walletBalance.toLocaleString()} FCFA** (Statut : ${currentUser.isVIP ? 'VIP Star ⭐' : 'Standard'}).*\n\nPosez-moi vos questions sur le fonctionnement d'AfriChat Connect, la traduction en langues africaines, les paiements Mobile Money ou le développement de votre audience !`,
      timestamp: 'À l’instant',
      category: 'general',
      suggestedFollowUps: [
        'Consulter mon solde et mes gains',
        'Comment fonctionne le statut VIP Star ?',
        'Comment recharger mon portefeuille Mobile Money ?',
        'Traduire des expressions en Wolof, Bambara, Swahili',
        'Lancer un Live HD avec Agora',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<'all' | 'guide' | 'languages' | 'business'>('all');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || isTyping) return;

    const userMsgId = `user_${Date.now()}`;
    const userMsg: AiChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      // Generate intelligent response with user context & fallback
      const response = await generateAiAssistantResponse(text, messages, {
        name: currentUser.name,
        walletBalance: currentUser.walletBalance,
        isVIP: currentUser.isVIP,
        country: currentUser.country,
        flag: currentUser.flag,
      });
      
      const assistantMsg: AiChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        category: response.category,
        suggestedFollowUps: response.followUps,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: AiChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: "Désolé, une micro-interruption réseau est survenue. Veuillez reformuler votre question.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: `Conversation réinitialisée. Comment puis-je vous aider, **${currentUser.name}** ?`,
        timestamp: 'À l’instant',
        category: 'general',
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[88vh] max-h-[750px] overflow-hidden border border-zinc-200 dark:border-zinc-800"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg leading-tight">Assistant IA AfriChat</h3>
                <span className="bg-white/20 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-white/30">
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>Gemini Flash</span>
                </span>
              </div>
              <p className="text-xs text-amber-100 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>IA Panafricaine & Multilingue disponible 24h/24</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearChat}
              title="Effacer la discussion"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-xs flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Topic Chips */}
        <div className="px-4 py-2 bg-amber-50/50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
              selectedTopic === 'all'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            🔥 Tout
          </button>
          <button
            onClick={() => setSelectedTopic('guide')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all flex items-center space-x-1 ${
              selectedTopic === 'guide'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide AfriChat & VIP</span>
          </button>
          <button
            onClick={() => setSelectedTopic('languages')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all flex items-center space-x-1 ${
              selectedTopic === 'languages'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Traduction Langues Locales</span>
          </button>
          <button
            onClick={() => setSelectedTopic('business')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all flex items-center space-x-1 ${
              selectedTopic === 'business'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Business & Créateurs</span>
          </button>
        </div>

        {/* Live Wallet & Fast Actions Bar */}
        <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Solde : <strong className="text-amber-600 dark:text-amber-400 font-black">{currentUser.walletBalance.toLocaleString()} FCFA</strong>
            </span>
            <span>{currentUser.flag}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {onOpenDeposit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-sm"
              >
                <span>💳 Recharger</span>
              </button>
            )}
            {onOpenPayout && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayout();
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-sm"
              >
                <span>💸 Retrait</span>
              </button>
            )}
            {onOpenLiveStudio && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLiveStudio();
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-sm"
              >
                <span>🎥 Live Agora</span>
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 shadow-sm text-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-none'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-zinc-100 dark:border-zinc-700/60 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Assistant IA</span>
                    </span>
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                      title="Copier le texte"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>

                <div
                  className={`text-[10px] mt-2 text-right ${
                    msg.sender === 'user'
                      ? 'text-amber-200'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* Follow-up suggestions */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[85%]">
                  {msg.suggestedFollowUps.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-xs bg-amber-50 dark:bg-zinc-800/80 hover:bg-amber-100 dark:hover:bg-zinc-700 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-zinc-700 px-2.5 py-1 rounded-full text-left transition-colors flex items-center space-x-1"
                    >
                      <span>💬</span>
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start space-x-2">
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">L'IA rédige une réponse...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        {messages.length < 3 && (
          <div className="px-4 py-2 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Suggestions rapides :
            </p>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p.query)}
                  className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1 border border-zinc-200 dark:border-zinc-700"
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Input */}
        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Posez votre question (ex: Comment monétiser mes Lives ?)..."
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 border border-zinc-200 dark:border-zinc-700"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium text-sm hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 shadow-md shadow-amber-600/20"
            >
              <span>Envoyer</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
