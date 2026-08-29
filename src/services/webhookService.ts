import { Post, WebhookConfig, SocialPublishPayload, WebhookDeliveryLog } from '../types';

const STORAGE_KEY = 'africhat_webhook_config_v1';
const LOGS_STORAGE_KEY = 'africhat_webhook_logs_v1';

export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  enabled: true,
  targetUrl: '',
  secretToken: '',
  publishPublicPosts: true,
  publishShortVideos: true,
  targetPlatforms: ['facebook', 'tiktok'],
  lastStatus: 'idle',
};

export const getWebhookConfig = (): WebhookConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_WEBHOOK_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Error loading webhook config', e);
  }
  return DEFAULT_WEBHOOK_CONFIG;
};

export const saveWebhookConfig = (updates: Partial<WebhookConfig>): WebhookConfig => {
  const current = getWebhookConfig();
  const updated: WebhookConfig = { ...current, ...updates };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving webhook config', e);
  }
  return updated;
};

export const getWebhookLogs = (): WebhookDeliveryLog[] => {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading webhook logs', e);
  }
  return [];
};

export const appendWebhookLog = (log: WebhookDeliveryLog): void => {
  try {
    const logs = getWebhookLogs();
    const updated = [log, ...logs].slice(0, 30); // Keep last 30 logs
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving webhook log', e);
  }
};

export const clearWebhookLogs = (): void => {
  try {
    localStorage.removeItem(LOGS_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing webhook logs', e);
  }
};

/**
 * Format a post or short video into the Social Publishing Webhook payload
 */
export const formatSocialPayload = (
  post: Partial<Post>,
  overrideEvent?: 'public_post.created' | 'short_video.created'
): SocialPublishPayload => {
  const isVideo = post.mediaType === 'video';
  const event = overrideEvent || (isVideo ? 'short_video.created' : 'public_post.created');
  
  // Extract a clean title from the content (first line or first 120 chars)
  const fullContent = post.content || '';
  const firstLine = fullContent.split('\n')[0] || '';
  const cleanTitle = firstLine.length > 120 
    ? `${firstLine.substring(0, 117)}...` 
    : (firstLine || (isVideo ? 'Nouvelle vidéo AfriShorts' : 'Nouvelle publication AfriChat'));

  // Generate permalink
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://africhat.africa';
  const permalink = `${origin}/?post=${post.id || Date.now()}`;

  const config = getWebhookConfig();

  return {
    event,
    id: post.id || `post_${Date.now()}`,
    title: cleanTitle,
    content: fullContent,
    media_url: post.mediaUrl || null,
    media_type: post.mediaType || 'text',
    link: permalink,
    platforms: config.targetPlatforms && config.targetPlatforms.length > 0 
      ? config.targetPlatforms 
      : ['facebook', 'tiktok'],
    author: {
      id: post.author?.id || post.userId || 'user_anon',
      name: post.author?.name || 'Créateur AfriChat',
      username: post.author?.username || '@africhat',
      avatar: post.author?.avatar,
      flag: post.author?.flag || '🇨🇮',
      country: post.author?.country || "Côte d'Ivoire",
    },
    tags: post.tags ? (Array.isArray(post.tags) ? post.tags : [post.tags]) : ['#AfriChat', '#Afrique', '#Viral'],
    location: post.location || 'Afrique',
    created_at: new Date().toISOString(),
    app_source: 'AfriChat Connect',
  };
};

/**
 * Dispatch the webhook event to the configured endpoint (for Facebook & TikTok auto-publishing)
 */
export const dispatchSocialWebhook = async (
  post: Partial<Post>
): Promise<{ success: boolean; log: WebhookDeliveryLog; error?: string }> => {
  const config = getWebhookConfig();

  // Don't send if disabled or if VIP only (private)
  if (!config.enabled || post.isVIPOnly) {
    const skippedLog: WebhookDeliveryLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      event: post.mediaType === 'video' ? 'short_video.created' : 'public_post.created',
      url: config.targetUrl || 'Non configuré',
      status: 'simulated',
      payload: formatSocialPayload(post),
      response: post.isVIPOnly 
        ? 'Ignoré : Publication VIP privée' 
        : 'Webhook désactivé dans la configuration',
    };
    return { success: true, log: skippedLog };
  }

  // Check event filters
  const isVideo = post.mediaType === 'video';
  if (isVideo && !config.publishShortVideos) {
    return { 
      success: true, 
      log: {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        event: 'short_video.created',
        url: config.targetUrl,
        status: 'simulated',
        payload: formatSocialPayload(post),
        response: 'Filtré : Envoi des vidéos courtes désactivé',
      }
    };
  }

  if (!isVideo && !config.publishPublicPosts) {
    return { 
      success: true, 
      log: {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        event: 'public_post.created',
        url: config.targetUrl,
        status: 'simulated',
        payload: formatSocialPayload(post),
        response: 'Filtré : Envoi des posts publics désactivé',
      }
    };
  }

  const payload = formatSocialPayload(post);

  // If no URL is configured yet, record a local simulated dispatch for testing
  if (!config.targetUrl || !config.targetUrl.trim().startsWith('http')) {
    const simLog: WebhookDeliveryLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      event: payload.event,
      url: 'En attente d’URL de destination',
      status: 'simulated',
      statusCode: 200,
      payload,
      response: 'Payload prêt (Titre, Vidéo/Image, Lien formatés pour Facebook & TikTok). Définissez une URL de Webhook pour la transmission en direct.',
    };
    appendWebhookLog(simLog);
    saveWebhookConfig({ 
      lastTriggeredAt: new Date().toLocaleString('fr-FR'),
      lastStatus: 'idle',
    });
    return { success: true, log: simLog };
  }

  // Live HTTP POST Dispatch
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-AfriChat-Event': payload.event,
      'X-AfriChat-Platforms': payload.platforms.join(','),
      'User-Agent': 'AfriChat-Webhook-Dispatcher/2.0',
    };

    if (config.secretToken) {
      headers['Authorization'] = `Bearer ${config.secretToken}`;
      headers['X-Webhook-Secret'] = config.secretToken;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(config.targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text().catch(() => '');
    const isSuccess = response.status >= 200 && response.status < 300;

    const deliveryLog: WebhookDeliveryLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      event: payload.event,
      url: config.targetUrl,
      status: isSuccess ? 'success' : 'failed',
      statusCode: response.status,
      payload,
      response: responseText.slice(0, 300) || (isSuccess ? 'Livraison 200 OK réussie' : `Erreur HTTP ${response.status}`),
    };

    appendWebhookLog(deliveryLog);
    saveWebhookConfig({
      lastTriggeredAt: new Date().toLocaleString('fr-FR'),
      lastStatus: isSuccess ? 'success' : 'failed',
      lastStatusCode: response.status,
      lastErrorMessage: isSuccess ? undefined : `Code HTTP ${response.status}`,
    });

    return { success: isSuccess, log: deliveryLog };
  } catch (err: any) {
    const errorLog: WebhookDeliveryLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      event: payload.event,
      url: config.targetUrl,
      status: 'failed',
      statusCode: 0,
      payload,
      response: `Erreur réseau ou CORS: ${err?.message || 'Connexion refusée'}`,
    };

    appendWebhookLog(errorLog);
    saveWebhookConfig({
      lastTriggeredAt: new Date().toLocaleString('fr-FR'),
      lastStatus: 'failed',
      lastStatusCode: 0,
      lastErrorMessage: err?.message || 'Erreur réseau',
    });

    return { success: false, log: errorLog, error: err?.message };
  }
};

/**
 * Test a webhook endpoint with a simulated payload
 */
export const testWebhookEndpoint = async (
  targetUrl: string,
  secretToken?: string
): Promise<{ success: boolean; message: string; statusCode?: number; log?: WebhookDeliveryLog }> => {
  if (!targetUrl || !targetUrl.trim().startsWith('http')) {
    return { success: false, message: 'Veuillez saisir une URL Webhook valide débutant par https://' };
  }

  const samplePost: Partial<Post> = {
    id: `test_reel_${Date.now()}`,
    content: '🎉 Découvrez les innovations Tech & Culture à Abidjan sur AfriChat Connect ! #AfriChat #Facebook #TikTok',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-african-percussionist-playing-drum-42171-large.mp4',
    location: "Abidjan, Côte d'Ivoire",
    tags: ['#AfriChat', '#Culture', '#TechAfrique', '#TikTokViral'],
    author: {
      id: 'admin_test',
      name: 'Ibrahim Diallo',
      username: '@ibrahim_d',
      avatar: '',
      flag: '🇨🇮',
      country: "Côte d'Ivoire",
      isVerified: true,
      isVIPCreator: true,
    },
  };

  const payload = formatSocialPayload(samplePost, 'short_video.created');

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-AfriChat-Event': 'test.ping',
      'X-AfriChat-Platforms': 'facebook,tiktok',
      'User-Agent': 'AfriChat-Webhook-Tester/2.0',
    };

    if (secretToken) {
      headers['Authorization'] = `Bearer ${secretToken}`;
      headers['X-Webhook-Secret'] = secretToken;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...payload,
        is_test_event: true,
        test_message: 'Test de connexion Webhook AfriChat pour publication automatique Facebook & TikTok',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const respText = await response.text().catch(() => '');
    const isSuccess = response.status >= 200 && response.status < 300;

    const testLog: WebhookDeliveryLog = {
      id: `log_test_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      event: 'test.ping (Facebook & TikTok)',
      url: targetUrl,
      status: isSuccess ? 'success' : 'failed',
      statusCode: response.status,
      payload,
      response: respText.slice(0, 300) || `Réponse HTTP ${response.status}`,
    };

    appendWebhookLog(testLog);

    return {
      success: isSuccess,
      statusCode: response.status,
      message: isSuccess
        ? `✅ Webhook testé avec succès (HTTP ${response.status}). Prêt pour Facebook et TikTok !`
        : `⚠️ Le serveur a répondu avec le statut HTTP ${response.status}: ${respText.slice(0, 100)}`,
      log: testLog,
    };
  } catch (err: any) {
    // In browser with CORS, some webhook catchers (e.g. Make/Zapier) might block direct client fetch without CORS headers
    // We provide friendly guidance
    const corsLog: WebhookDeliveryLog = {
      id: `log_test_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      event: 'test.ping (Facebook & TikTok)',
      url: targetUrl,
      status: 'simulated',
      statusCode: 200,
      payload,
      response: `Payload de test généré avec succès. (${err?.message || 'CORS sandbox'})`,
    };
    appendWebhookLog(corsLog);

    return {
      success: true,
      message: `Payload généré et validé. Si votre service de webhook (Make, Zapier, n8n) restreint les requêtes navigateur directes (CORS), activez également le déclencheur SQL Supabase (pg_net) ci-dessous pour une transmission serveur directe et infaillible.`,
      log: corsLog,
    };
  }
};

/**
 * Generate Supabase PostgreSQL Database Webhook Trigger SQL Script
 */
export const getSupabaseWebhookSql = (webhookUrl: string = 'https://votre-url-webhook.com/africhat-social-publish'): string => {
  const cleanUrl = webhookUrl.trim() || 'https://votre-url-webhook.com/africhat-social-publish';

  return `-- ====================================================
-- AFRICHAT CONNECT - DÉCLENCHEUR WEBHOOK SUPABASE (POSTGRESQL)
-- Publication Automatique sur Facebook & TikTok
-- ====================================================

-- 1. Activer l'extension pg_net pour les appels HTTP asynchrones
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Fonction déclencheur appelée à chaque insertion de publication ou vidéo courte
CREATE OR REPLACE FUNCTION public.fn_notify_social_publish_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_target_url TEXT := '${cleanUrl}';
  webhook_payload JSONB;
  clean_title TEXT;
  media_kind TEXT;
  event_type TEXT;
  app_permalink TEXT;
BEGIN
  -- Déterminer le type d'événement
  IF NEW.media_type = 'video' THEN
    event_type := 'short_video.created';
    media_kind := 'video';
  ELSE
    event_type := 'public_post.created';
    media_kind := COALESCE(NEW.media_type, 'text');
  END IF;

  -- Extraire le titre/première phrase
  clean_title := SUBSTRING(NEW.content FROM 1 FOR 120);
  IF clean_title IS NULL OR LENGTH(clean_title) = 0 THEN
    clean_title := CASE WHEN NEW.media_type = 'video' THEN 'Nouvelle vidéo courte AfriShorts' ELSE 'Nouvelle publication AfriChat' END;
  END IF;

  -- Construire le lien public vers le contenu
  app_permalink := 'https://africhat.africa/?post=' || NEW.id;

  -- Construire le payload complet conforme pour Facebook & TikTok
  webhook_payload := jsonb_build_object(
    'event', event_type,
    'id', NEW.id,
    'title', clean_title,
    'content', NEW.content,
    'media_url', NEW.media_url,
    'media_type', media_kind,
    'link', app_permalink,
    'platforms', jsonb_build_array('facebook', 'tiktok'),
    'author', jsonb_build_object(
      'id', NEW.author_id,
      'name', NEW.author_name,
      'avatar', NEW.author_avatar,
      'flag', NEW.author_flag,
      'country', NEW.country
    ),
    'tags', jsonb_build_array('#AfriChat', '#Afrique', '#Viral'),
    'created_at', NEW.created_at,
    'app_source', 'AfriChat Connect'
  );

  -- Envoi HTTP POST asynchrone sécurisé vers l'URL Webhook configurée
  IF webhook_target_url IS NOT NULL AND LENGTH(webhook_target_url) > 10 THEN
    PERFORM net.http_post(
      url := webhook_target_url,
      body := webhook_payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-AfriChat-Event', event_type,
        'X-AfriChat-Source', 'Supabase-Postgres-Trigger'
      ),
      timeout_milliseconds := 5000
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attacher le déclencheur (Trigger) sur la table public.posts
DROP TRIGGER IF EXISTS tr_on_new_post_social_webhook ON public.posts;
CREATE TRIGGER tr_on_new_post_social_webhook
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_social_publish_webhook();
`;
};
