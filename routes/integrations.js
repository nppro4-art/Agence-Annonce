/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CATALOGUE D'INTÉGRATIONS                                     ║
 * ║                                                                ║
 * ║  Liste des intégrations disponibles pour les sites clients,   ║
 * ║  + helpers CRUD sur la table `integrations` (Supabase).        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ── Catalogue ────────────────────────────────────────────────
// `plans` : plans pour lesquels l'intégration est disponible
// `sectors` : si défini, restreint l'intégration à certains secteurs
// `requires_config` : champs de configuration demandés au client
export const INTEGRATIONS_CATALOG = {
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    description: 'Paiements en ligne pour votre boutique',
    icon: '💳',
    plans: ['solo', 'business', 'expert'],
    requires_config: ['public_key', 'secret_key'],
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Bouton de contact direct WhatsApp',
    icon: '💬',
    plans: ['solo', 'business', 'expert'],
    requires_config: ['phone_number'],
  },
  calendly: {
    id: 'calendly',
    name: 'Calendly',
    description: 'Prise de rendez-vous en ligne',
    icon: '📅',
    plans: ['business', 'expert'],
    requires_config: ['calendly_url'],
  },
  instagram_feed: {
    id: 'instagram_feed',
    name: 'Instagram',
    description: 'Affichez vos derniers posts Instagram',
    icon: '📷',
    plans: ['business', 'expert'],
    requires_config: ['access_token'],
  },
  google_maps: {
    id: 'google_maps',
    name: 'Google Maps',
    description: 'Carte interactive de votre établissement',
    icon: '📍',
    plans: ['solo', 'business', 'expert'],
    requires_config: ['address'],
  },
  brevo: {
    id: 'brevo',
    name: 'Brevo',
    description: 'Newsletter et emails marketing',
    icon: '✉️',
    plans: ['business', 'expert'],
    requires_config: ['api_key', 'list_id'],
  },
  mailchimp: {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Newsletter et automatisation email',
    icon: '🐵',
    plans: ['business', 'expert'],
    requires_config: ['api_key', 'audience_id', 'server_prefix'],
  },
  loyverse: {
    id: 'loyverse',
    name: 'Loyverse',
    description: 'Programme de fidélité client',
    icon: '🎁',
    plans: ['business', 'expert'],
    sectors: ['restaurant', 'boutique', 'commerce'],
    requires_config: ['api_key'],
  },
  printful: {
    id: 'printful',
    name: 'Printful',
    description: 'Impression et expédition à la demande',
    icon: '📦',
    plans: ['expert'],
    sectors: ['boutique', 'ecommerce'],
    requires_config: ['api_key'],
  },
  facebook_pixel: {
    id: 'facebook_pixel',
    name: 'Meta Pixel',
    description: 'Suivi des conversions publicitaires',
    icon: '📊',
    plans: ['business', 'expert'],
    requires_config: ['pixel_id'],
  },
  google_analytics: {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Statistiques de visites détaillées',
    icon: '📈',
    plans: ['solo', 'business', 'expert'],
    requires_config: ['measurement_id'],
  },
  tiktok_pixel: {
    id: 'tiktok_pixel',
    name: 'TikTok Pixel',
    description: 'Suivi des conversions TikTok Ads',
    icon: '🎵',
    plans: ['expert'],
    requires_config: ['pixel_id'],
  },
};

// ── Catalogue filtré par plan ────────────────────────────────
export function getCatalogForPlan(plan) {
  return Object.values(INTEGRATIONS_CATALOG).filter(i => i.plans.includes(plan));
}

// ── Catalogue filtré par secteur ─────────────────────────────
export function getCatalogForSector(sector) {
  return Object.values(INTEGRATIONS_CATALOG).filter(i => !i.sectors || i.sectors.includes(sector));
}

// ── Intégrations actives d'un projet ─────────────────────────
export async function getProjectIntegrations(projectId) {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('project_id', projectId)
    .eq('active', true);
  if (error) throw error;
  return data || [];
}

// ── Activer une intégration sur un projet ────────────────────
export async function activateIntegration(projectId, integrationId, config, userId) {
  const definition = INTEGRATIONS_CATALOG[integrationId];
  if (!definition) throw new Error(`Intégration inconnue : ${integrationId}`);

  // Sauvegarder la config sensible séparément si fournie
  if (config && Object.keys(config).length > 0) {
    await supabase.from('integration_secrets').upsert({
      project_id: projectId,
      integration_id: integrationId,
      secrets: config,
    }, { onConflict: 'project_id,integration_id' });
  }

  const { data, error } = await supabase
    .from('integrations')
    .upsert({
      project_id: projectId,
      user_id: userId,
      integration_id: integrationId,
      config: config ? Object.keys(config).reduce((acc, k) => ({ ...acc, [k]: '••••••' }), {}) : {},
      active: true,
    }, { onConflict: 'project_id,integration_id' })
    .select()
    .single();

  if (error) throw error;
  return { success: true, integration: data };
}

// ── Désactiver une intégration ───────────────────────────────
export async function deactivateIntegration(projectId, integrationId) {
  const { error } = await supabase
    .from('integrations')
    .update({ active: false })
    .eq('project_id', projectId)
    .eq('integration_id', integrationId);
  if (error) throw error;
  return { success: true };
}
  
