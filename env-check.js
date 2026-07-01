/**
 * Script de vérification des variables d'environnement Créazio
 * À lancer avant le démarrage : node env-check.js
 */

import dotenv from 'dotenv';
import { cleanSupabaseUrl, inspectServiceKey } from './lib/supabase.js';

dotenv.config();

const REQUIRED = [
  'ANTHROPIC_API_KEY',
  'GITHUB_TOKEN',
  'GITHUB_USERNAME',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'RESEND_API_KEY',
  'STRIPE_SECRET_KEY',
  'FRONTEND_URL',
];

const OPTIONAL = [
  'STRIPE_WEBHOOK_SECRET',
  'VERCEL_TOKEN',
  'PORKBUN_API_KEY',
  'PORKBUN_SECRET_KEY',
  'ADMIN_SECRET_KEY',
  'ADMIN_PASSWORD',
  'INSEE_TOKEN',
];

const DISCORD_WEBHOOKS = [
  'DISCORD_WEBHOOK_INSCRITS',
  'DISCORD_WEBHOOK_PAYANTS',
  'DISCORD_WEBHOOK_ESSAIS',
  'DISCORD_WEBHOOK_RESILIATIONS',
  'DISCORD_WEBHOOK_PAIEMENTS_OK',
  'DISCORD_WEBHOOK_PAIEMENTS_KO',
  'DISCORD_WEBHOOK_SITES',
  'DISCORD_WEBHOOK_HORS_LIGNE',
  'DISCORD_WEBHOOK_ERREURS',
  'DISCORD_WEBHOOK_HEBDO',
  'DISCORD_WEBHOOK_MESSAGES',
];

function checkVar(name) {
  const val = process.env[name];
  if (!val) return { ok: false, msg: 'MANQUANT' };
  if (val.startsWith(' ') || val.endsWith(' ')) return { ok: false, msg: 'ESPACE détecté au début/fin de la valeur' };
  if (val.includes('\n')) return { ok: false, msg: 'CARACTÈRE NOUVELLE LIGNE détecté' };
  if (name === 'SUPABASE_URL') {
    const cleaned = cleanSupabaseUrl(val);
    if (!cleaned.startsWith('https://')) return { ok: false, msg: `Doit commencer par https:// (valeur brute : "${val}")` };
    if (!cleaned.includes('.supabase.co')) return { ok: false, msg: `URL Supabase inhabituelle (valeur nettoyée : "${cleaned}")` };
    if (val !== cleaned) return { ok: true, msg: `OK (URL corrigée automatiquement : "${cleaned}")` };
  }
  if (name === 'SUPABASE_SERVICE_KEY') {
    const role = inspectServiceKey(val);
    if (role === 'missing') return { ok: false, msg: 'MANQUANT' };
    if (role === 'invalid') return { ok: false, msg: 'Clé invalide (ne ressemble pas à un JWT Supabase)' };
    if (role !== 'service_role') return { ok: false, msg: `Rôle incorrect : "${role}" — utilisez la clé service_role, pas anon` };
  }
  if (name === 'FRONTEND_URL' && !val.startsWith('https://')) return { ok: false, msg: `Doit commencer par https:// (valeur : ${val})` };
  if (name === 'GITHUB_USERNAME' && val.includes('/')) return { ok: false, msg: `Ne doit pas contenir de / (valeur : ${val})` };
  return { ok: true, msg: 'OK' };
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  CRÉAZIO — Vérification variables d\'environnement          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

let errors = 0;

console.log('Variables OBLIGATOIRES :');
for (const name of REQUIRED) {
  const { ok, msg } = checkVar(name);
  console.log(`  ${ok ? '✓' : '✗'} ${name.padEnd(25)} ${msg}`);
  if (!ok) errors++;
}

console.log('\nVariables OPTIONNELLES :');
for (const name of OPTIONAL) {
  const { ok, msg } = checkVar(name);
  if (!ok && msg === 'MANQUANT') {
    console.log(`  • ${name.padEnd(25)} non configurée (optionnel)`);
  } else {
    console.log(`  ${ok ? '✓' : '✗'} ${name.padEnd(25)} ${msg}`);
    if (!ok) errors++;
  }
}

console.log('\nWebhooks Discord :');
for (const name of DISCORD_WEBHOOKS) {
  const val = process.env[name];
  if (!val) {
    console.log(`  • ${name.padEnd(25)} non configuré (optionnel)`);
  } else if (!val.startsWith('https://discord.com/api/webhooks/')) {
    console.log(`  ✗ ${name.padEnd(25)} URL Discord invalide`);
    errors++;
  } else {
    console.log(`  ✓ ${name.padEnd(25)} OK`);
  }
}

console.log('\n' + (errors === 0 ? '✓ Toutes les variables critiques sont OK.' : `✗ ${errors} problème(s) détecté(s). Corrigez avant de démarrer.`));
process.exit(errors === 0 ? 0 : 1);
