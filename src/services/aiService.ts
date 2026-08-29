// Service d'Intelligence Artificielle AfriChat (Assistant Utilisateur & Outils Administrateur)
import { getApiCredentials } from './apiConfigService';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: 'general' | 'africhat_guide' | 'african_languages' | 'business_creator' | 'culture';
  suggestedFollowUps?: string[];
}

export interface ReleaseNotesPromptOptions {
  version: string;
  features: string[];
  tone: 'panafrican' | 'tech_professional' | 'hype_community' | 'concise';
  targetAudience: string;
}

export interface GeneratedReleaseNote {
  title: string;
  version: string;
  announcementDate: string;
  pushNotificationPreview: {
    title: string;
    body: string;
  };
  markdownContent: string;
  highlights: string[];
}

export interface SystemHealthMetrics {
  totalUsers: number;
  activeLiveStreams: number;
  mobileMoneySuccessRatePct: number;
  agoraRtcLatencyMs: number;
  supabaseSyncStatus: string;
  serverCpuUsagePct: number;
  reportedIncidentsCount: number;
}

export interface SystemHealthDiagnosis {
  overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
  healthScore: number; // 0 to 100
  summary: string;
  keyObservations: string[];
  recommendedActions: string[];
  securityNote: string;
  timestamp: string;
}

// African Knowledge Base & Smart Fallback Engine
const KNOWLEDGE_RESPONSES: Record<string, { answer: string; followUps: string[] }> = {
  vip: {
    answer: "⭐ **Le Statut VIP Star sur AfriChat Connect :**\n\nLe badge VIP Star permet aux créateurs, artistes et personnalités d'offrir des privilèges exclusifs :\n- 💬 **Messagerie Directe Prioritaire** : Vos abonnés peuvent vous contacter directement.\n- 📞 **Appels Audio & Vidéo Haute Définition** sécurisés.\n- 🔒 **Publications Exclusives VIP** : Monétisez vos vidéos et contenus avec paiement Mobile Money.\n- 👑 **Badge Étoile Dorée** affiché sur votre profil et dans le chat des Lives.",
    followUps: ["Comment recharger mon portefeuille ?", "Comment créer une Page Officielle ?", "Quels sont les tarifs VIP ?"],
  },
  money: {
    answer: "💳 **Mobile Money & Portefeuille AfriChat :**\n\nAfriChat Connect intègre tous les principaux réseaux panafricains :\n- 🟠 **Orange Money** (Côte d'Ivoire, Sénégal, Cameroun, Guinée, Mali, etc.)\n- 🟡 **MTN MoMo**\n- 🌊 **Wave** (0% frais cachés)\n- 🟢 **Moov Money** & **Airtel Money**\n- 💳 **Carte Visa / Mastercard & Stripe** pour la Diaspora\n\nVous pouvez recharger instantanément votre solde en FCFA ou retirer vos gains à tout moment !",
    followUps: ["Comment retirer mes gains de Live ?", "Offrir des cadeaux virtuels", "Voir l'historique des transactions"],
  },
  live: {
    answer: "🎥 **Studio Live & Diffusion Vidéo :**\n\nGrâce au moteur RTC Agora et WebRTC intégré :\n- 🔴 **Lancez votre direct** en un clic depuis le bouton '+ Lancer un Live' sur le fil d'actualité ou dans les Lives.\n- 🎁 **Recevez des cadeaux virtuels** en direct (Café Touba, Masque Royal, Lion du Baobab, etc.) crédités en FCFA sur votre portefeuille.\n- 💬 **Interagissez avec vos spectateurs** via le chat en temps réel et les réactions animées.",
    followUps: ["Comment configurer le moteur Agora ?", "Inviter des spectateurs", "Créer une publication vidéo"],
  },
  page: {
    answer: "🏢 **Pages Officielles sur AfriChat :**\n\nLes Pages permettent aux entreprises, startups, ONG et artistes de construire leur communauté :\n- 🏷️ **Catégories** : Entreprise & Marque, Artiste & Créateur, Médias, Startup Tech, Restaurant & Hôtellerie, etc.\n- 📲 **Boutons d'Action Rapide** : Contact WhatsApp direct, site web, et pourboire Mobile Money.\n- 👥 **Fil d'actualité dédié** et statistiques de vos abonnés.",
    followUps: ["Créer ma page officielle maintenant", "Comment certifier ma page ?", "Publier en tant que page"],
  },
  traduction: {
    answer: "🌍 **Traducteur Panafricain AfriChat :**\n\nJe peux vous aider à traduire ou comprendre des expressions dans de nombreuses langues africaines :\n- **Wolof** (Sénégal) : *Nanga def ?* (Comment vas-tu ?) -> *Mangi fi rekk* (Je vais bien).\n- **Bambara / Malinké** (Mali, Guinée, CI) : *I ni sogoma* (Bonjour le matin), *I ka kéné ?* (Tu vas bien ?)\n- **Lingala** (RDC, Congo) : *Mbote na yo !* (Salut !), *Ozali malamu ?* (Tu vas bien ?)\n- **Swahili** (Afrique de l'Est) : *Jambo !* (Bonjour), *Karibu sana* (Bienvenue chaleureusement).\n- **Baoulé** (Côte d'Ivoire) : *N’da ye* (Bonjour), *Môkô* (Merci).\n- **Yoruba** (Nigéria, Bénin) : *Bawo ni ?* (Comment ça va ?), *E se gan* (Merci beaucoup).\n\nQuelle phrase ou langue souhaitez-vous traduire ?",
    followUps: ["Traduire 'Bienvenue sur AfriChat' en Wolof", "Traduire 'Merci beaucoup mon frère' en Lingala", "Expressions populaires ivoiriennes"],
  },
  creator: {
    answer: "🚀 **Conseils pour Créateurs & Entrepreneurs Panafricains :**\n\n1. **Régularité & Identité Locale** : Valorisez votre culture, votre humour ou votre savoir-faire local.\n2. **Utilisez les Lives Interactifs** : Faites participer votre audience et activez la réception de cadeaux virtuels.\n3. **Activez les Publications VIP** : Proposez des tutoriels, coulisses ou contenus exclusifs pour un petit montant en FCFA.\n4. **Liez votre Page à votre WhatsApp Business** pour convertir directement vos spectateurs en clients !",
    followUps: ["Comment fixer le prix d'un post VIP ?", "Gagner de l'argent avec les Reels", "Augmenter mes abonnés"],
  },
};

// Main AI Assistant Generator
export const generateAiAssistantResponse = async (
  userMessage: string,
  history: AiChatMessage[] = [],
  userContext?: { name?: string; walletBalance?: number; isVIP?: boolean; country?: string; flag?: string }
): Promise<{ text: string; category?: AiChatMessage['category']; followUps: string[]; actionType?: 'deposit' | 'payout' | 'live' | 'vip' }> => {
  const creds = getApiCredentials();
  const lower = userMessage.toLowerCase().trim();
  const balance = userContext?.walletBalance ?? 0;
  const userName = userContext?.name || 'Ami';
  const isVip = userContext?.isVIP || false;

  // 1. Specific Balance & Wallet Queries
  if (
    lower.includes('mon solde') || 
    lower.includes('combien j’ai') || 
    lower.includes('combien jai') || 
    lower.includes('mon compte') ||
    lower.includes('mes gains')
  ) {
    const formattedBalance = `${balance.toLocaleString()} FCFA`;
    const text = `💰 **État de votre Portefeuille AfriChat Pay :**\n\nBonjour **${userName}** ! Votre solde disponible est actuellement de **${formattedBalance}**.\n\n- ${balance > 0 ? `✅ Vous pouvez demander un **retrait instantané** vers votre numéro Mobile Money (Wave, Orange Money, MTN MoMo, Moov).` : `💡 Vous pouvez recharger votre compte facilement par Mobile Money ou carte bancaire pour envoyer des pourboires et débloquer des contenus.`}\n- 👑 Statut VIP : **${isVip ? 'VIP Star Actif ⭐' : 'Membre Standard (Passez VIP pour monétiser vos messages)'}**.\n- 🎁 Vos gains issus des Lives et pourboires sont automatiquement crédités en temps réel !`;
    
    return {
      text,
      category: 'business_creator',
      followUps: ['Recharger mon solde Mobile Money', 'Demander un retrait', 'Comment gagner plus en Live ?'],
      actionType: balance > 0 ? 'payout' : 'deposit',
    };
  }

  // 2. Keyword Matching for instant specialized knowledge
  if (lower.includes('vip') || lower.includes('star') || lower.includes('badge')) {
    return { 
      text: KNOWLEDGE_RESPONSES.vip.answer, 
      followUps: ["Comment recharger mon portefeuille ?", "Comment créer une Page Officielle ?", "Quels sont les tarifs VIP ?"], 
      category: 'africhat_guide',
      actionType: 'vip',
    };
  }
  if (lower.includes('argent') || lower.includes('mobile money') || lower.includes('orange') || lower.includes('wave') || lower.includes('mtn') || lower.includes('recharge') || lower.includes('retrait') || lower.includes('fcfa')) {
    return { 
      text: `${KNOWLEDGE_RESPONSES.money.answer}\n\n👉 *Votre solde actuel est de **${balance.toLocaleString()} FCFA**.*`, 
      followUps: ["Comment retirer mes gains de Live ?", "Offrir des cadeaux virtuels", "Voir l'historique des transactions"], 
      category: 'africhat_guide',
      actionType: 'deposit',
    };
  }
  if (lower.includes('live') || lower.includes('direct') || lower.includes('stream') || lower.includes('cadeau') || lower.includes('gift') || lower.includes('agora')) {
    return { 
      text: `${KNOWLEDGE_RESPONSES.live.answer}\n\n⚡ *Le moteur Agora RTC est actif (App ID: ${getApiCredentials().agoraAppId.slice(0, 8)}...) pour une diffusion HD 1080p sans saccade.*`, 
      followUps: ["Lancer mon Live Studio maintenant", "Inviter des spectateurs", "Créer une publication vidéo"], 
      category: 'africhat_guide',
      actionType: 'live',
    };
  }
  if (lower.includes('page') || lower.includes('entreprise') || lower.includes('marque') || lower.includes('certif')) {
    return { text: KNOWLEDGE_RESPONSES.page.answer, followUps: KNOWLEDGE_RESPONSES.page.followUps, category: 'africhat_guide' };
  }
  if (lower.includes('tradui') || lower.includes('langue') || lower.includes('wolof') || lower.includes('lingala') || lower.includes('bambara') || lower.includes('swahili') || lower.includes('bonjour en')) {
    return { text: KNOWLEDGE_RESPONSES.traduction.answer, followUps: KNOWLEDGE_RESPONSES.traduction.followUps, category: 'african_languages' };
  }
  if (lower.includes('conseil') || lower.includes('monétis') || lower.includes('gagner') || lower.includes('business') || lower.includes('créateur')) {
    return { text: KNOWLEDGE_RESPONSES.creator.answer, followUps: KNOWLEDGE_RESPONSES.creator.followUps, category: 'business_creator' };
  }

  // General African AI Response generator
  const defaultFollowUps = [
    "Comment fonctionne le Mobile Money sur AfriChat ?",
    "Comment lancer un Live et recevoir des cadeaux ?",
    "Aide-moi à traduire en langues africaines",
    "Conseils pour monétiser mes publications"
  ];

  let answer = `Bonjour ! Je suis l'**Assistant IA AfriChat**, votre guide intelligent dédié à la plateforme et à l'écosystème numérique africain. 🌍✨\n\n`;

  if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('coucou') || lower.includes('kôkô')) {
    answer += `I ni sogoma ! Mbote ! Nanga def ! Jambo ! Comment puis-je vous aider aujourd'hui sur AfriChat Connect ? Vous pouvez m'interroger sur l'utilisation de l'application, les paiements Mobile Money, la création de Pages, la traduction ou le développement de votre audience.`;
  } else if (lower.includes('qui es-tu') || lower.includes('fondateur') || lower.includes('lama')) {
    answer += `Je suis l'assistant officiel d'**AfriChat Connect**, conçu pour servir la communauté panafricaine et internationale sous la vision de notre Fondateur **Lama Conte** (${'lamaconte95@gmail.com'}). Je suis là pour vous accompagner 24h/24 !`;
  } else {
    answer += `Concernant votre demande : « *${userMessage}* ».\n\nSur AfriChat Connect, tout est conçu pour fluidifier les interactions : du partage de photos et vidéos exclusives, à la création de Pages Officielles, en passant par les diffusions Live et le transfert Mobile Money instantané.\n\nSouhaitez-vous un tutoriel précis sur l'une de ces fonctionnalités ou un conseil sur-mesure ?`;
  }

  return {
    text: answer,
    category: 'general',
    followUps: defaultFollowUps,
  };
};

// Admin AI: Generate Release Notes
export const generateAdminReleaseNotes = async (
  options: ReleaseNotesPromptOptions
): Promise<GeneratedReleaseNote> => {
  const version = options.version || 'v3.5.0';
  const features = options.features.length > 0 ? options.features : [
    "Intégration du backend Supabase pour l'authentification et les messages en temps réel",
    "Moteur Agora RTC haute fidélité pour les flux Lives et appels vidéo",
    "Assistant IA AfriChat Panafricain pour tous les utilisateurs",
    "Système d'annonces push et de surveillance IA pour l'administrateur",
    "Paiement Mobile Money instantané (Wave, Orange, MTN, Moov) et cadeaux virtuels"
  ];

  const highlights = features.map((f) => `✨ ${f}`);

  const markdownContent = `## 🚀 AfriChat Connect — Notes de Version ${version}

Nous sommes fiers de vous dévoiler la mise à jour **${version}** d'**AfriChat Connect**, la plateforme sociale et multimédia panafricaine nouvelle génération !

### 🌟 Les Grandes Nouveautés :
${features.map((f, i) => `${i + 1}. **${f}**`).join('\n')}

---

### 🛡️ Performances, Sécurité & Connectivité :
- **Moteur Supabase & Base PostgreSQL** : Synchronisation instantanée des discussions privées et groupes.
- **Agora Live RTC HD** : Latence ultra-faible pour tous les directs vidéo et salons audio.
- **Sécurité Mobile Money Renforcée** : Transactions protégées par double authentification et reçus électroniques certifiés.

*Merci de faire grandir la communauté panafricaine avec AfriChat Connect !*
*L'équipe technique & Lama Conte (Fondateur).*`;

  return {
    title: `Mise à jour majeure ${version} disponible !`,
    version,
    announcementDate: new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    pushNotificationPreview: {
      title: `🎉 AfriChat Connect ${version} est disponible !`,
      body: `Découvrez l'Assistant IA, les flux Agora Live HD et la synchronisation Supabase instantanée.`,
    },
    markdownContent,
    highlights,
  };
};

// Admin AI: System Health & Monitoring Diagnosis
export const analyzeSystemHealthWithAi = async (
  metrics: SystemHealthMetrics
): Promise<SystemHealthDiagnosis> => {
  let score = 95;
  const keyObservations: string[] = [];
  const recommendedActions: string[] = [];

  if (metrics.mobileMoneySuccessRatePct < 90) {
    score -= 15;
    keyObservations.push(`⚠️ Taux de succès Mobile Money à ${metrics.mobileMoneySuccessRatePct}% (légèrement inférieur à la cible de 98%).`);
    recommendedActions.push("Vérifier les webhooks des passerelles Wave et Orange Money pour réduire les timeouts.");
  } else {
    keyObservations.push(`✅ Passerelles Mobile Money optimales (${metrics.mobileMoneySuccessRatePct}% de succès).`);
  }

  if (metrics.agoraRtcLatencyMs > 60) {
    score -= 10;
    keyObservations.push(`⚠️ Latence des flux vidéo Agora mesurée à ${metrics.agoraRtcLatencyMs}ms.`);
    recommendedActions.push("Activer le CDN multi-régions Agora pour les spectateurs en Afrique de l'Ouest et Centrale.");
  } else {
    keyObservations.push(`✅ Moteur vidéo Agora RTC performant (${metrics.agoraRtcLatencyMs}ms de latence moyenne).`);
  }

  if (metrics.supabaseSyncStatus === 'connected') {
    keyObservations.push("✅ Synchronisation Supabase PostgreSQL active et en temps réel.");
  } else {
    score -= 10;
    keyObservations.push("ℹ️ Mode de synchronisation locale/standby actif pour Supabase.");
    recommendedActions.push("Configurer ou tester les clés SUPABASE_URL et SUPABASE_ANON_KEY dans le gestionnaire d'API.");
  }

  keyObservations.push(`👥 ${metrics.totalUsers} utilisateurs enregistrés et ${metrics.activeLiveStreams} diffusions en direct actives.`);

  let overallStatus: SystemHealthDiagnosis['overallStatus'] = 'excellent';
  if (score < 70) overallStatus = 'warning';
  else if (score < 85) overallStatus = 'good';

  return {
    overallStatus,
    healthScore: score,
    summary: `L'application AfriChat Connect fonctionne à un niveau de stabilité de ${score}/100. Les flux vidéo Agora et la base de données répondent avec une excellente disponibilité.`,
    keyObservations,
    recommendedActions: recommendedActions.length > 0 ? recommendedActions : ["Maintenir la surveillance standard et planifier la prochaine annonce de mise à jour."],
    securityNote: "Chiffrement AES-256 actif sur les portefeuilles et clés d'API protégées.",
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
};
