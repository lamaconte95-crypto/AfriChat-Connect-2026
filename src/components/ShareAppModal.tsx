import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import {
  X,
  Share2,
  QrCode,
  Copy,
  Check,
  Download,
  Smartphone,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Phone,
  Send,
  Globe
} from 'lucide-react';
import { User } from '../types';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://africhat-connect.firebaseapp.com';
  const shareUrl = currentUser
    ? `${appUrl}?ref=${encodeURIComponent(currentUser.username.replace('@', ''))}`
    : appUrl;

  const defaultShareText = `🌍 Rejoins-moi sur AfriChat Connect ! Le réseau social & messagerie 100% conçu pour l'Afrique et le monde : Fil d'actu, AfriShorts, Web TV live, salons VIP et paiement Mobile Money instantané. Clique ici : ${shareUrl}`;

  // Generate QR Code on Mount or URL change
  useEffect(() => {
    if (!isOpen) return;

    setIsGeneratingQr(true);
    QRCode.toDataURL(
      shareUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#0c0a09',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        setIsGeneratingQr(false);
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(defaultShareText);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const handleShareSMS = () => {
    const encodedText = encodeURIComponent(defaultShareText);
    // Support Android and iOS sms protocol
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsUrl = isIOS ? `sms:&body=${encodedText}` : `sms:?body=${encodedText}`;
    window.location.href = smsUrl;
  };

  const handleShareTelegram = () => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent("Rejoins-moi sur AfriChat Connect ! 🌍");
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AfriChat Connect',
          text: defaultShareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = 'africhat-connect-qrcode.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center">
                <QrCode className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-1.5">
                <span>Partager l'application</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black">
                  QR Code
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Invitez vos amis et votre communauté sur AfriChat Connect
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white bg-stone-800/80 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* QR Code Container */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 flex flex-col items-center justify-center text-center relative group">
            <div className="relative p-3 bg-white rounded-2xl shadow-xl shadow-amber-500/10 border-4 border-amber-400">
              {isGeneratingQr ? (
                <div className="w-52 h-52 flex items-center justify-center text-stone-900 font-bold text-xs">
                  Génération du QR Code...
                </div>
              ) : qrCodeDataUrl ? (
                <div className="relative">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code AfriChat Connect"
                    className="w-52 h-52 object-contain rounded-lg"
                  />
                  {/* Center Badge in QR Code */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-stone-950 border-2 border-amber-400 flex items-center justify-center shadow-lg">
                      <span className="text-amber-400 font-black text-xs">AC</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <p className="text-xs text-stone-300 font-semibold mt-3 flex items-center space-x-1">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Scannez avec l'appareil photo du téléphone</span>
            </p>

            <button
              onClick={handleDownloadQR}
              className="mt-2 text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le QR Code (Image PNG)</span>
            </button>
          </div>

          {/* Direct 1-Click Share Actions: WhatsApp & SMS */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
              Partage direct en 1 clic
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* WhatsApp Share Button */}
              <button
                id="share-whatsapp-btn"
                onClick={handleShareWhatsApp}
                className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              {/* SMS Share Button */}
              <button
                id="share-sms-btn"
                onClick={handleShareSMS}
                className="p-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-orange-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Phone className="w-4 h-4 text-white" />
                <span>SMS Téléphone</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Telegram */}
              <button
                id="share-telegram-btn"
                onClick={handleShareTelegram}
                className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 hover:text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>Telegram</span>
              </button>

              {/* Native System Share */}
              <button
                id="share-system-btn"
                onClick={handleShareNative}
                className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 hover:text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Plus d'options...</span>
              </button>
            </div>
          </div>

          {/* Copy Link Input Box */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-stone-300 block">
              Lien direct à copier
            </label>
            <div className="flex items-center space-x-2 p-1.5 bg-stone-950 border border-stone-800 rounded-2xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-stone-300 text-xs px-2.5 py-1.5 flex-1 focus:outline-none truncate font-mono select-all"
              />
              <button
                id="share-copy-link-btn"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
};
