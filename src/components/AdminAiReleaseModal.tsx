import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Bot, 
  Sparkles, 
  Send, 
  Bell, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  FileText, 
  Share2, 
  Radio, 
  Zap, 
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react';
import { User, AdminAuditLog } from '../types';
import { 
  generateAdminReleaseNotes, 
  analyzeSystemHealthWithAi, 
  GeneratedReleaseNote, 
  SystemHealthDiagnosis,
  SystemHealthMetrics
} from '../services/aiService';

interface AdminAiReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onBroadcastNotification: (announcement: { title: string; body: string; version: string; markdown: string }) => void;
  onAddAuditLog: (log: AdminAuditLog) => void;
}

export const AdminAiReleaseModal: React.FC<AdminAiReleaseModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onBroadcastNotification,
  onAddAuditLog,
}) => {
  const [activeTab, setActiveTab] = useState<'release_generator' | 'system_monitoring' | 'broadcast_history'>('release_generator');
  
  // Release Notes State
  const [versionInput, setVersionInput] = useState('v3.5.0');
  const [tone, setTone] = useState<'panafrican' | 'tech_professional' | 'hype_community'>('panafrican');
  const [featuresList, setFeaturesList] = useState<string>([
    "Liaison Supabase PostgreSQL & Realtime pour l'authentification et les messages",
    "Moteur Agora RTC HD pour les diffusions Live et salons audio",
    "Assistant IA AfriChat multilingue & Panafricain pour tous les utilisateurs",
    "Gestionnaire sécurisé des clés API pour l'administrateur",
    "Portefeuille Mobile Money (Wave, Orange, MTN, Moov) & Cadeaux Virtuels"
  ].join('\n'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<GeneratedReleaseNote | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // System Health Monitoring State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [systemMetrics] = useState<SystemHealthMetrics>({
    totalUsers: 14820,
    activeLiveStreams: 18,
    mobileMoneySuccessRatePct: 99.4,
    agoraRtcLatencyMs: 24,
    supabaseSyncStatus: 'connected',
    serverCpuUsagePct: 14.2,
    reportedIncidentsCount: 0,
  });
  const [diagnosis, setDiagnosis] = useState<SystemHealthDiagnosis | null>(null);

  if (!isOpen) return null;

  const handleGenerateReleaseNotes = async () => {
    setIsGenerating(true);
    const parsedFeatures = featuresList.split('\n').filter((f) => f.trim().length > 0);
    try {
      const result = await generateAdminReleaseNotes({
        version: versionInput,
        features: parsedFeatures,
        tone,
        targetAudience: 'Utilisateurs panafricains et diaspora',
      });
      setGeneratedNote(result);
    } catch (err) {
      console.error('Error generating release notes:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBroadcastPush = () => {
    if (!generatedNote) return;

    onBroadcastNotification({
      title: generatedNote.pushNotificationPreview.title,
      body: generatedNote.pushNotificationPreview.body,
      version: generatedNote.version,
      markdown: generatedNote.markdownContent,
    });

    onAddAuditLog({
      id: `audit_${Date.now()}`,
      action: `Diffusion globale de la mise à jour ${generatedNote.version}`,
      actorName: currentUser.name,
      target: 'Tous les utilisateurs AfriChat',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      severity: 'info',
    });

    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  const handleRunHealthDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const diag = await analyzeSystemHealthWithAi(systemMetrics);
      setDiagnosis(diag);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!generatedNote) return;
    navigator.clipboard.writeText(generatedNote.markdownContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-4 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <button
              id="admin-ai-release-back-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center space-x-1 cursor-pointer group"
              title="← Retour"
            >
              <ArrowLeft className="w-4 h-4 text-amber-200 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-bold hidden sm:inline">Retour</span>
            </button>

            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <span>IA de Mise à Jour & Surveillance</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full border border-white/30 font-semibold">
                  Fondateur Lama Conte
                </span>
              </h2>
              <p className="text-xs text-amber-100">
                Génération automatique de notes de version, push broadcast et monitoring en temps réel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center space-x-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('release_generator')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'release_generator'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Rédacteur IA de Version</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('system_monitoring');
              if (!diagnosis) handleRunHealthDiagnosis();
            }}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'system_monitoring'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Surveillance & Diagnostic IA</span>
          </button>
        </div>

        {/* Tab 1: Release Notes Generator */}
        {activeTab === 'release_generator' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Numéro de Version
                </label>
                <input
                  type="text"
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  placeholder="e.g. v3.5.0"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tonalité de Communication
                </label>
                <select
                  value={tone}
                  onChange={(e: any) => setTone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="panafrican">🌍 Panafricain & Chaleureux (Recommandé)</option>
                  <option value="tech_professional">💼 Professionnel & Technique</option>
                  <option value="hype_community">🔥 Dynamique & Communauté Jeune</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Liste des Nouveautés & Correctifs (1 par ligne)
              </label>
              <textarea
                rows={4}
                value={featuresList}
                onChange={(e) => setFeaturesList(e.target.value)}
                placeholder="Insérez les fonctionnalités ajoutées..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleGenerateReleaseNotes}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-semibold hover:from-amber-700 hover:to-orange-700 transition-all flex items-center space-x-1.5 shadow-md shadow-amber-600/20 disabled:opacity-50"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Générer les Notes de Version avec l'IA</span>
              </button>
            </div>

            {/* Generated Notes Preview */}
            {generatedNote && (
              <div className="bg-amber-50/50 dark:bg-zinc-800/60 rounded-xl p-4 border border-amber-200 dark:border-zinc-700 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-zinc-700 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Aperçu Push Notification :
                    </span>
                  </div>
                  <button
                    onClick={handleCopyMarkdown}
                    className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center space-x-1"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copié !' : 'Copier le Markdown'}</span>
                  </button>
                </div>

                {/* Push Notification Card */}
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {generatedNote.pushNotificationPreview.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      {generatedNote.pushNotificationPreview.body}
                    </p>
                  </div>
                </div>

                {/* Full Markdown Preview */}
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-44 overflow-y-auto text-xs whitespace-pre-line leading-relaxed font-sans text-zinc-800 dark:text-zinc-200">
                  {generatedNote.markdownContent}
                </div>

                {/* Broadcast Action Button */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={handleBroadcastPush}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center space-x-2 shadow-md shadow-emerald-600/20"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Diffuser la Notification Push à Tous les Utilisateurs</span>
                  </button>

                  {broadcastSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Annonce diffusée en direct avec succès !</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: System Health Monitoring & AI Diagnostic */}
        {activeTab === 'system_monitoring' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-sm">
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-50 dark:bg-zinc-800/70 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Utilisateurs Actifs</span>
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {systemMetrics.totalUsers.toLocaleString()}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold">● En ligne</span>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/70 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Succès Mobile Money</span>
                <p className="text-base font-bold text-emerald-600 mt-1">
                  {systemMetrics.mobileMoneySuccessRatePct}%
                </p>
                <span className="text-[10px] text-zinc-500">Wave, Orange, MTN</span>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/70 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Latence Agora RTC</span>
                <p className="text-base font-bold text-blue-600 mt-1">
                  {systemMetrics.agoraRtcLatencyMs} ms
                </p>
                <span className="text-[10px] text-emerald-600">Ultra-faible (HD)</span>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/70 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Lives en Direct</span>
                <p className="text-base font-bold text-amber-600 mt-1">
                  {systemMetrics.activeLiveStreams} diffusions
                </p>
                <span className="text-[10px] text-zinc-500">Canaux actifs</span>
              </div>
            </div>

            {/* AI Diagnosis Card */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                    Rapport de Santé Analysé par l'IA
                  </h3>
                </div>
                <button
                  onClick={handleRunHealthDiagnosis}
                  disabled={isDiagnosing}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  {isDiagnosing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Actualiser le diagnostic</span>
                </button>
              </div>

              {diagnosis ? (
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Score Global de Stabilité :
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                        {diagnosis.healthScore}/100 — Excellent
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {diagnosis.summary}
                    </p>
                  </div>

                  {/* Key Observations */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Observations Clés :</h4>
                    {diagnosis.keyObservations.map((obs, idx) => (
                      <div key={idx} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start space-x-2">
                        <span>•</span>
                        <span>{obs}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Recommandations de l'IA pour le Fondateur :</span>
                    </h4>
                    {diagnosis.recommendedActions.map((rec, idx) => (
                      <p key={idx} className="text-xs text-emerald-800 dark:text-emerald-400 pl-5">
                        👉 {rec}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500">
                  Cliquez sur "Actualiser le diagnostic" pour lancer l'analyse complète de l'application.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
};
