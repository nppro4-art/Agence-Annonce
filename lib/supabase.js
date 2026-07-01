import { createClient } from '@supabase/supabase-js';

/**
 * Nettoie une URL Supabase pour qu'elle soit compatible avec @supabase/supabase-js.
 * Supabase attend exactement : https://<project>.supabase.co
 * Tout slash final, chemin /rest/v1, espaces ou protocole manquent provoquent
 * l'erreur : "Invalid path specified in request URL".
 */
export function cleanSupabaseUrl(raw) {
  if (!raw) return '';
  let url = String(raw).trim();
  // Supprime espaces, tabulations, retours à la ligne
  url = url.replace(/\s/g, '');
  // Ajoute https:// si le protocole est manquant
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  // Supprime tout chemin après le domaine (ex: /rest/v1, /auth/v1, etc.)
  try {
    const parsed = new URL(url);
    url = `${parsed.protocol}//${parsed.host}`;
  } catch {
    // Si l'URL est trop invalide pour être parsée, on laisse tel quel
  }
  return url;
}

/**
 * Vérifie le rôle d'une clé Supabase sans la logger en entier.
 * Retourne 'service_role' | 'anon' | 'unknown'.
 */
export function inspectServiceKey(key) {
  if (!key) return 'missing';
  try {
    const payload = key.split('.')[1];
    if (!payload) return 'invalid';
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.role || 'unknown';
  } catch {
    return 'invalid';
  }
}

export function createSupabaseClient() {
  const rawUrl = process.env.SUPABASE_URL;
  const url = cleanSupabaseUrl(rawUrl);
  const key = process.env.SUPABASE_SERVICE_KEY;
  const role = inspectServiceKey(key);
  if (!url || !key) {
    throw new Error(`Configuration serveur : SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant (URL brute="${rawUrl}", URL nettoyée="${url}", clé présente=${!!key})`);
  }
  console.log(`[SUPABASE] Client initialisé avec l'URL : ${url}`);
  console.log(`[SUPABASE] Rôle détecté pour la clé : ${role} (prefix=${key.slice(0, 7)}...)`);
  if (role !== 'service_role') {
    console.warn(`[SUPABASE] ATTENTION : la clé n'a pas le rôle service_role (${role}). supabase.auth.admin.createUser va échouer.`);
  }
  return createClient(url, key);
}
