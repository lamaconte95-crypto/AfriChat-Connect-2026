import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Key, 
  Database, 
  Video, 
  Bot, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Sparkles,
  Zap,
  Info,
  Radio,
  Share2,
  Send,
  Sliders,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { 
  getApiCredentials, 
  saveApiCredentials, 
  testSupabaseConnection, 
  testAgoraConnection, 
  testGeminiConnection, 
  testOpenAiConnection,
  ApiCredentials 
} from '../services/apiConfigService';
import { getSupabaseSchemaSql } from '../services/supabaseService';
import { 
  getWebhookConfig, 
  saveWebhookConfig, 
  testWebhookEndpoint, 
  getSupabaseWebhookSql, 
  getWebhookLogs,
  clearWebhookLogs
} from '../services/webhookService';
import { WebhookConfig } from '../types';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated?: (creds: ApiCredentials) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
}) => {
  const [creds, setCreds] = useState<ApiCredentials>(() => getApiCredentials());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { loading?: boolean; success?: boolean; message?: string }>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Webhook State (Facebook & TikTok Auto-Publishing)
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(() => getWebhookConfig());
  const [showWebhookSql, setShowWebhookSql] = useState(false);
  const [copiedWebhookSql, setCopiedWebhookSql] = useState(false);
  const [webhookTestLoading, setWebhookTestLoading] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showWebhookLogs, setShowWebhookLogs] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState(() => getWebhookLogs());

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSchemaSql());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyWebhookSql = () => {
    navigator.clipboard.writeText(getSupabaseWebhookSql(webhookConfig.targetUrl));
    setCopiedWebhookSql(true);
    setTimeout(() => setCopiedWebhookSql(false), 2500);
  };

  const handleTestWebhook = async () => {
    setWebhookTestLoading(true);
    setWebhookTestResult(null);
    const res = await testWebhookEndpoint(webhookConfig.targetUrl, webhookConfig.secretToken);
    setWebhookTestLoading(false);
    setWebhookTestResult({ success: res.success, message: res.message });
    setWebhookLogs(getWebhookLogs());
  };

  const handleClearLogs = () => {
    clearWebhookLogs();
    setWebhookLogs([]);
  };

  if (!isOpen) return null;

  const toggleShowKey = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTestSupabase = async () => {
    setTestResults((prev) => ({ ...prev, supabase: { loading: true } }));
    const res = await testSupabaseConnection(creds.supabaseUrl, creds.supabaseAnonKey);
    setTestResults((prev) => ({
      ...prev,
      supabase: { loading: false, success: res.success, message: res.message },
    }));
    if (res.success) {
      setCreds((prev) => ({ ...prev, isSupabaseConnected: true }));
    }
  };

  const handleTestAgora = async () => {
    setTestResults((prev) => ({ ...prev, agora: { loading: true } }));
    const res = await testAgoraConnection(creds.agoraAppId);
    setTestResults((prev) => ({
      ...prev,
      agora: { loading: false, success: res.success, message: res.message },
    }));
    if (res.success) {
      setCreds((prev) => ({ ...prev, isAgoraConnected: true }));
    }
  };

  const handleTestGemini = async () => {
    setTestResults((prev) => ({ ...prev, gemini: { loading: true } }));
    const res = await testGeminiConnection(creds.geminiApiKey);
    setTestResults((prev) => ({
      ...prev,
      gemini: { loading: false, success: res.success, message: res.message },
    }));
    if (res.success) {
      setCreds((prev) => ({ ...prev, isGeminiConnected: true }));
    }
  };

  const handleTestOpenAi = async () => {
    setTestResults((prev) => ({ ...prev, openai: { loading: true } }));
    const res = await testOpenAiConnection(creds.openAiApiKey);
    setTestResults((prev) => ({
      ...prev,
      openai: { loading: false, success: res.success, message: res.message },
    }));
    if (res.success) {
      setCreds((prev) => ({ ...prev, isOpenAiConnected: true }));
    }
  };

  const handleSaveAll = () => {
    const updated = saveApiCredentials({
      ...creds,
      lastTestedAt: new Date().toLocaleString('fr-FR'),
    });
    saveWebhookConfig(webhookConfig);
    setSaveSuccess(true);
    onCredentialsUpdated?.(updated);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-amber-950 to-zinc-900 text-white p-5 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <span>Passerelles & Clés API</span>
                <span className="text-xs bg-amber-500/30 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-400/30">
                  Admin & Fondateur
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Configuration de Supabase, Agora RTC et des moteurs d'IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Stockage sécurisé & Persistant :</p>
            <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              Vous pouvez insérer vos clés officielles ici. Elles sont automatiquement sauvegardées et appliquées en temps réel sur les flux Lives Agora, la base Supabase et l'Assistant IA.
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Section 1: Supabase */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Supabase (Base PostgreSQL & Auth)</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Pour la persistance des comptes, profils et messages en temps réel</p>
                </div>
              </div>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 hover:text-emerald-500 font-medium flex items-center space-x-1"
              >
                <span>Console Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  SUPABASE_URL
                </label>
                <input
                  type="text"
                  value={creds.supabaseUrl}
                  onChange={(e) => setCreds({ ...creds, supabaseUrl: e.target.value })}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  SUPABASE_ANON_KEY (Clé Publique Anonyme)
                </label>
                <div className="relative">
                  <input
                    type={showKeys.supabase ? 'text' : 'password'}
                    value={creds.supabaseAnonKey}
                    onChange={(e) => setCreds({ ...creds, supabaseAnonKey: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('supabase')}
                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showKeys.supabase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700/60 mt-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={testResults.supabase?.loading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    {testResults.supabase?.loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>Tester la connexion</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSqlSchema(!showSqlSchema)}
                    className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{showSqlSchema ? 'Masquer SQL' : 'Schéma SQL Supabase'}</span>
                  </button>
                </div>

                {testResults.supabase && !testResults.supabase.loading && (
                  <span
                    className={`text-xs font-medium flex items-center space-x-1 ${
                      testResults.supabase.success
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {testResults.supabase.success ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{testResults.supabase.message}</span>
                  </span>
                )}
              </div>

              {/* Collapsible Supabase SQL Schema Blueprint */}
              {showSqlSchema && (
                <div className="mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-emerald-400">
                      📄 Script SQL Complet (Tables profiles, posts, messages, RLS, Storage)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md flex items-center space-x-1 transition-colors"
                    >
                      {copiedSql ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSql ? 'Copié !' : 'Copier SQL'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono overflow-x-auto max-h-44 p-2 bg-zinc-900 rounded-lg text-zinc-300 border border-zinc-800">
                    {getSupabaseSchemaSql()}
                  </pre>
                  <p className="text-[10px] text-zinc-400">
                    💡 Copiez et collez ce script dans l'onglet <strong>SQL Editor</strong> de votre dashboard Supabase pour créer instantanément toutes les tables et politiques de sécurité.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Agora RTC */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Agora.io (RTC Flux Vidéo & Live HD)</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Pour le Studio Live, les appels vidéo 1-à-1 et les salons audio</p>
                </div>
              </div>
              <a
                href="https://console.agora.io/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:text-blue-500 font-medium flex items-center space-x-1"
              >
                <span>Console Agora</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  AGORA_APP_ID
                </label>
                <div className="relative">
                  <input
                    type={showKeys.agora ? 'text' : 'password'}
                    value={creds.agoraAppId}
                    onChange={(e) => setCreds({ ...creds, agoraAppId: e.target.value })}
                    placeholder="e.g. 4a8b7c9d0e1f2a3b4c5d6e7f8a9b0c1d"
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('agora')}
                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showKeys.agora ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTestAgora}
                  disabled={testResults.agora?.loading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  {testResults.agora?.loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Tester l'App ID Agora</span>
                </button>

                {testResults.agora && !testResults.agora.loading && (
                  <span
                    className={`text-xs font-medium flex items-center space-x-1 ${
                      testResults.agora.success
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {testResults.agora.success ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{testResults.agora.message}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: IA Moteurs (Gemini & OpenAI) */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Moteurs d'IA (Gemini & OpenAI)</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Pour l'Assistant Panafricain, la traduction et les notes de mise à jour</p>
                </div>
              </div>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Recommandé : Gemini</span>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  GEMINI_API_KEY (Google AI Studio)
                </label>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={creds.geminiApiKey}
                    onChange={(e) => setCreds({ ...creds, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('gemini')}
                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  OPENAI_API_KEY (Optionnel / Secondaire)
                </label>
                <div className="relative">
                  <input
                    type={showKeys.openai ? 'text' : 'password'}
                    value={creds.openAiApiKey}
                    onChange={(e) => setCreds({ ...creds, openAiApiKey: e.target.value })}
                    placeholder="sk-proj-..."
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('openai')}
                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestGemini}
                  disabled={testResults.gemini?.loading}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tester Gemini AI</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestOpenAi}
                  disabled={testResults.openai?.loading}
                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <span>Tester OpenAI</span>
                </button>
              </div>

              {(testResults.gemini?.message || testResults.openai?.message) && (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  {testResults.gemini?.message && <p>• Gemini: {testResults.gemini.message}</p>}
                  {testResults.openai?.message && <p>• OpenAI: {testResults.openai.message}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Déclencheur Webhook Supabase (Auto-Publication Facebook & TikTok) */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-pink-50/50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                    <span>Déclencheur Webhook (Facebook & TikTok)</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      webhookConfig.enabled 
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                        : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {webhookConfig.enabled ? 'Actif' : 'Désactivé'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Transmission automatique des nouveaux messages publics et vidéos courtes (Reels) avec titre, média et lien
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookConfig.enabled}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  URL de Destination Webhook (Make, Zapier, n8n, API Facebook / TikTok)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={webhookConfig.targetUrl}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, targetUrl: e.target.value })}
                    placeholder="https://hook.eu1.make.com/xxxx-votre-webhook ou https://votre-api.com/webhooks"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-indigo-200 dark:border-indigo-800/80 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                  💡 Les données envoyées incluent : <code className="text-indigo-600 dark:text-indigo-400 font-mono">title</code>, <code className="text-indigo-600 dark:text-indigo-400 font-mono">media_url</code> (image/vidéo), <code className="text-indigo-600 dark:text-indigo-400 font-mono">link</code> (lien AfriChat), et <code className="text-indigo-600 dark:text-indigo-400 font-mono">platforms: ['facebook', 'tiktok']</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Clé Secrète / Token d'Autorisation (Optionnel)
                </label>
                <input
                  type="password"
                  value={webhookConfig.secretToken || ''}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, secretToken: e.target.value })}
                  placeholder="Bearer token ou clé secrète X-Webhook-Secret..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Event & Platform Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-white/70 dark:bg-zinc-900/60 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <div>
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                    Événements Déclencheurs :
                  </span>
                  <div className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookConfig.publishPublicPosts}
                        onChange={(e) => setWebhookConfig({ ...webhookConfig, publishPublicPosts: e.target.checked })}
                        className="rounded text-indigo-600 border-zinc-400 focus:ring-indigo-500"
                      />
                      <span>📰 Messages Publics (Fil d'actu)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookConfig.publishShortVideos}
                        onChange={(e) => setWebhookConfig({ ...webhookConfig, publishShortVideos: e.target.checked })}
                        className="rounded text-indigo-600 border-zinc-400 focus:ring-indigo-500"
                      />
                      <span>🎬 Vidéos Courtes (Reels / AfriShorts)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                    Réseaux Sociaux Ciblés :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold flex items-center space-x-1 shadow-sm">
                      <span>🔵 Facebook</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-black dark:bg-zinc-800 text-white text-[11px] font-bold flex items-center space-x-1 shadow-sm border border-zinc-700">
                      <span>🎵 TikTok</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Test, Show SQL Trigger, Logs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-200/70 dark:border-indigo-900/60">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={webhookTestLoading}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {webhookTestLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Tester le Webhook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWebhookSql(!showWebhookSql)}
                    className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{showWebhookSql ? 'Masquer Déclencheur SQL' : 'Déclencheur SQL Supabase (pg_net)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWebhookLogs(getWebhookLogs());
                      setShowWebhookLogs(!showWebhookLogs);
                    }}
                    className="px-2.5 py-1.5 bg-zinc-200/80 dark:bg-zinc-800/80 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Logs ({webhookLogs.length})</span>
                  </button>
                </div>

                {webhookTestResult && (
                  <div className="w-full text-xs font-medium mt-1">
                    <p className={`p-2 rounded-lg ${
                      webhookTestResult.success 
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}>
                      {webhookTestResult.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Collapsible Supabase PostgreSQL Webhook Trigger */}
              {showWebhookSql && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-indigo-900/60 text-zinc-300 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-indigo-400">
                      ⚡ Déclencheur PostgreSQL Supabase (Extension pg_net & Trigger table public.posts)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyWebhookSql}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-md flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      {copiedWebhookSql ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWebhookSql ? 'Copié !' : 'Copier SQL Webhook'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono overflow-x-auto max-h-48 p-2 bg-zinc-900 rounded-lg text-zinc-300 border border-zinc-800">
                    {getSupabaseWebhookSql(webhookConfig.targetUrl)}
                  </pre>
                  <p className="text-[10px] text-zinc-400">
                    💡 Exécutez ce script dans l'Éditeur SQL Supabase pour que PostgreSQL envoie le webhook de manière 100% autonome dès qu'une insertion est détectée.
                  </p>
                </div>
              )}

              {/* Collapsible Webhook Logs */}
              {showWebhookLogs && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-300 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-zinc-400">
                      📜 Historique des Déclenchements Webhook
                    </span>
                    {webhookLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearLogs}
                        className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        Effacer l'historique
                      </button>
                    )}
                  </div>
                  {webhookLogs.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 italic py-2 text-center">
                      Aucun envoi webhook enregistré pour le moment. Publiez un post ou une vidéo pour tester !
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-zinc-800">
                      {webhookLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="pt-2 first:pt-0 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white flex items-center space-x-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : log.status === 'failed' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                              <span>{log.event}</span>
                            </span>
                            <span className="text-[10px] text-zinc-500">{log.timestamp}</span>
                          </div>
                          <p className="text-zinc-400 truncate">
                            <strong className="text-zinc-300">Titre :</strong> {log.payload.title}
                          </p>
                          <p className="text-[10px] text-indigo-400 truncate font-mono">
                            {log.payload.media_url ? `🎥 Média: ${log.payload.media_url}` : '📝 Texte seul'} • 🔗 {log.payload.link}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            Statut : {log.response || `Code ${log.statusCode}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Clés enregistrées avec succès !</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all flex items-center space-x-1.5 shadow-md shadow-amber-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Sauvegarder les Clés</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
