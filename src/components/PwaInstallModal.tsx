import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Smartphone,
  CheckCircle2,
  Share,
  PlusSquare,
  Sparkles,
  Zap,
  HardDrive,
  WifiOff,
  ShieldCheck,
  ArrowRight,
  Monitor,
  ExternalLink,
  Info,
  Check
} from 'lucide-react';
import { isIOSDevice, isStandalonePWA } from '../services/deviceDetection';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'googleplay' | 'desktop'>('android');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect Platform
    const isIOSDeviceDetected = isIOSDevice();
    setIsIOS(isIOSDeviceDetected);

    if (isIOSDeviceDetected) {
      setPlatform('ios');
    } else {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAndroidDevice = /android/.test(userAgent);
      if (isAndroidDevice) {
        setPlatform('android');
      } else {
        setPlatform('desktop');
      }
    }

    // Check standalone mode
    setIsAlreadyInstalled(isStandalonePWA());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    // Never run Chrome native prompt on iOS
    if (isIOSDevice()) {
      setPlatform('ios');
      return;
    }

    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          onInstallSuccess?.();
          onClose();
        }
      } catch (err) {
        console.error('PWA prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center">
                {isIOS || platform === 'ios' ? (
                  <Share className="w-6 h-6 text-sky-400" />
                ) : (
                  <Download className="w-6 h-6 text-amber-400" />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {isIOS || platform === 'ios'
                    ? 'Installer sur iPhone / iPad'
                    : "Installer l'application"}
                </h2>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isIOS || platform === 'ios'
                    ? 'bg-sky-500 text-stone-950'
                    : 'bg-emerald-500 text-stone-950'
                }`}>
                  {isIOS || platform === 'ios' ? 'iOS Safari' : 'PWA Mobile'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {isIOS || platform === 'ios'
                  ? 'Ajoutez AfriChat Connect sur votre écran d\'accueil iOS'
                  : 'AfriChat Connect directement sur votre écran d\'accueil'}
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

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Quick 1-Click Native Install (If browser prompt available and NOT on iOS) */}
          {deferredPrompt && !isIOS && platform !== 'ios' && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-stone-900 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-300">
                    INSTALLATION 1-CLIC DISPONIBLE
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold">Instantané</span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                Votre navigateur prend en charge l'installation directe. Cliquez ci-dessous pour ajouter AfriChat Connect sur votre écran d'accueil sans passer par une boutique d'applications.
              </p>

              <button
                id="pwa-trigger-install-btn"
                onClick={handleNativeInstall}
                disabled={isInstalling}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                <span>{isInstalling ? 'Installation en cours...' : 'Installer AfriChat Connect maintenant'}</span>
              </button>
            </div>
          )}

          {/* Platform Guide Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Guide d'installation pas-à-pas
              </label>
              <div className="flex items-center space-x-1 bg-stone-950 p-1 rounded-xl border border-stone-800 flex-wrap gap-y-1">
                <button
                  type="button"
                  onClick={() => setPlatform('ios')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    platform === 'ios' ? 'bg-sky-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span>🍎 iPhone / iPad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('android')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    platform === 'android' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('googleplay')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    platform === 'googleplay' ? 'bg-emerald-500 text-stone-950' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <span>Google Play (.APK)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('desktop')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    platform === 'desktop' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  PC / Mac
                </button>
              </div>
            </div>

            {/* iOS Instructions (iPhone / iPad) */}
            {platform === 'ios' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-sky-950/20 border border-sky-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-black text-white">
                    <div className="p-1 rounded-lg bg-sky-500 text-stone-950">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="text-sky-300 font-bold">Sur iPhone & iPad (Navigateur Safari) :</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                    3 Étapes Simples
                  </span>
                </div>

                <div className="space-y-3 text-xs text-stone-300">
                  {/* Step 1 */}
                  <div className="flex items-start space-x-3 p-3 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-stone-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                      1
                    </span>
                    <div className="space-y-1">
                      <p className="text-white font-bold flex items-center space-x-1.5">
                        <span>Appuyez sur le bouton Partager</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[11px] font-mono font-black">
                          <Share className="w-3.5 h-3.5 mr-1 text-sky-400" /> Partager 📤
                        </span>
                      </p>
                      <p className="text-stone-400 text-[11px]">
                        L'icône de partage se trouve dans la barre de navigation au bas de l'écran sur iPhone (ou en haut à droite sur iPad).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start space-x-3 p-3 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                      2
                    </span>
                    <div className="space-y-1">
                      <p className="text-white font-bold flex items-center space-x-1.5">
                        <span>Sélectionnez « Sur l'écran d'accueil »</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-black">
                          <PlusSquare className="w-3.5 h-3.5 mr-1 text-amber-400" /> ➕
                        </span>
                      </p>
                      <p className="text-stone-400 text-[11px]">
                        Faites défiler la liste des options vers le bas jusqu'à voir l'option <strong>« Sur l'écran d'accueil »</strong> (ou <em>« Ajouter à l'écran d'accueil »</em>).
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start space-x-3 p-3 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-stone-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                      3
                    </span>
                    <div className="space-y-1">
                      <p className="text-white font-bold flex items-center space-x-1.5">
                        <span>Appuyez sur « Ajouter » en haut à droite</span>
                      </p>
                      <p className="text-stone-400 text-[11px]">
                        Validez : l'icône officielle <strong>AfriChat Connect</strong> apparaît immédiatement sur l'écran d'accueil de votre iPhone/iPad, accessible en plein écran sans passer par l'App Store !
                      </p>
                    </div>
                  </div>
                </div>

                {/* iOS Visual Safari Mockup */}
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-400 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    💡 <strong>Astuce :</strong> Sur iOS, Apple n'utilise pas de fichier .apk ou de téléchargement Chrome. La PWA Safari s'installe directement avec vos identifiants préservés.
                  </span>
                </div>
              </div>
            )}

            {/* Google Play Store (.APK / .AAB / TWA) Instructions */}
            {platform === 'googleplay' && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-black text-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-emerald-400">Export Google Play Store (.AAB & .APK)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Trusted Web Activity (TWA)
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Grâce à l'architecture PWA & TWA d'<strong>AfriChat Connect</strong>, vous pouvez générer directement le package officiel <strong>.aab</strong> (Android App Bundle) et <strong>.apk</strong> pour publier l'application sur le <strong>Google Play Store</strong>.
                </p>

                {/* Option 1: PWABuilder */}
                <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                      <span>⚡ Méthode 1 : PWABuilder (Recommandée - En 2 min)</span>
                    </span>
                    <span className="text-[10px] text-stone-400">Sans installer de logiciel</span>
                  </div>
                  
                  <ol className="text-xs text-stone-300 space-y-1.5 list-decimal list-inside">
                    <li>Rendez-vous sur <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-bold">PWABuilder.com</a>.</li>
                    <li>Entrez l'URL publique partagée de votre application AfriChat Connect.</li>
                    <li>Cliquez sur <strong>« Package for Stores »</strong> puis choisissez <strong>Google Play (Android)</strong>.</li>
                    <li>Téléchargez votre package contenant le fichier <strong>.aab</strong> signé et votre fichier <strong>assetlinks.json</strong>.</li>
                  </ol>
                </div>

                {/* Option 2: Google Bubblewrap CLI */}
                <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-sky-300">
                      🛠️ Méthode 2 : Google Bubblewrap CLI (Développeurs)
                    </span>
                    <span className="text-[10px] text-stone-400">Ligne de commande</span>
                  </div>
                  
                  <p className="text-[11px] text-stone-400">
                    Le fichier de configuration officiel <code className="text-amber-300 bg-stone-950 px-1 py-0.5 rounded">twa-manifest.json</code> et <code className="text-amber-300 bg-stone-950 px-1 py-0.5 rounded">assetlinks.json</code> sont déjà pré-générés dans le projet.
                  </p>

                  <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 font-mono text-[11px] text-emerald-400 overflow-x-auto select-all">
                    npm i -g @bubblewrap/cli<br />
                    bubblewrap init --manifest=twa-manifest.json<br />
                    bubblewrap build
                  </div>
                </div>

                {/* Checklist Google Play Console */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Publication sur la Google Play Console</span>
                  </div>
                  <ul className="text-[11px] text-stone-300 space-y-1 list-disc list-inside">
                    <li>Nom de l'app : <strong>AfriChat Connect</strong></li>
                    <li>ID du package : <strong>com.africhat.connect</strong></li>
                    <li>Catégorie : <strong>Réseaux sociaux / Communication / Divertissement</strong></li>
                    <li>Uploadez le fichier <strong>.aab</strong> dans l'onglet <em>Production</em> ou <em>Test interne</em>.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {platform === 'android' && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3.5">
                <div className="flex items-center space-x-2 text-xs font-black text-white">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Sur Android (Chrome, Samsung Internet, Firefox) :</span>
                </div>

                <div className="space-y-2.5 text-xs text-stone-300">
                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-stone-900 border border-stone-800/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 font-black text-[11px] flex items-center justify-center shrink-0">1</span>
                    <div>
                      Appuyez sur le menu des <strong>3 points verticaux (⋮)</strong> en haut à droite du navigateur.
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-stone-900 border border-stone-800/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 font-black text-[11px] flex items-center justify-center shrink-0">2</span>
                    <div>
                      Sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-stone-900 border border-stone-800/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 font-black text-[11px] flex items-center justify-center shrink-0">3</span>
                    <div>
                      Validez en appuyant sur <strong>« Installer »</strong>. L'application sera disponible hors-ligne et en plein écran.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {platform === 'desktop' && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3.5">
                <div className="flex items-center space-x-2 text-xs font-black text-white">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <span>Sur Ordinateur (Chrome, Edge, Brave) :</span>
                </div>

                <div className="space-y-2.5 text-xs text-stone-300">
                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-stone-900 border border-stone-800/80">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-stone-950 font-black text-[11px] flex items-center justify-center shrink-0">1</span>
                    <div>
                      Cliquez sur l'icône <strong>d'installation (<Download className="w-3.5 h-3.5 inline text-sky-400" />)</strong> située à droite de la barre d'adresse URL.
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-stone-900 border border-stone-800/80">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-stone-950 font-black text-[11px] flex items-center justify-center shrink-0">2</span>
                    <div>
                      Cliquez sur <strong>« Installer »</strong> dans la fenêtre qui s'affiche.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advantages Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Ultra Léger</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Moins de 2 Mo, n'encombre pas la mémoire du téléphone.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mode Hors-ligne</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Accès au contenu mis en cache même avec faible connexion.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-orange-400 font-bold text-xs">
                <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                <span>Expérience Plein Écran</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Comme une application native, sans barre de navigation.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-sky-400 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Mises à jour directes</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Toujours à jour automatiquement sans rien retélécharger.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <div className="text-[11px] text-stone-400">
            {isIOS || platform === 'ios' ? '📱 iOS Safari PWA • 0 Mo' : 'Gratuit • 100% Sécurisé • PWA'}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition-colors cursor-pointer"
          >
            {isIOS || platform === 'ios' ? 'J\'ai compris' : 'Fermer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

