/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ÉQUIPE CRÉAZIO — identité de marque                         ║
 * ║                                                                ║
 * ║  Donne l'impression d'une petite équipe humaine derrière      ║
 * ║  Créazio : noms + rôles utilisés pour signer les emails,      ║
 * ║  et calcul des délais "de traitement" avant que le client     ║
 * ║  ne voie le résultat d'une création ou d'une modification.    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ── Membres de l'équipe (fictifs) ───────────────────────────
// Chaque membre a un ou plusieurs rôles. On choisit un nom au
// hasard parmi ceux qui correspondent au rôle de la tâche.
export const TEAM = [
  { name: 'Camille Roussel',  role: 'designer',     title: 'Designer UI' },
  { name: 'Thomas Lefebvre',  role: 'developer',    title: 'Développeur' },
  { name: 'Sarah Benali',     role: 'developer',    title: 'Développeuse' },
  { name: 'Pierre Dupont',    role: 'support',      title: 'Support client' },
  { name: 'Léa Martin',       role: 'content',      title: 'Rédactrice de contenu' },
  { name: 'Antoine Girard',   role: 'designer',     title: 'Designer produit' },
  { name: 'Inès Chevalier',   role: 'support',      title: 'Responsable suivi client' },
  { name: 'Maxime Lambert',   role: 'developer',    title: 'Développeur full-stack' },
];

/**
 * Choisit un membre de l'équipe au hasard pour un rôle donné.
 * Si aucun membre n'a ce rôle, retourne un membre au hasard.
 */
export function pickTeamMember(role) {
  const candidates = TEAM.filter(m => m.role === role);
  const pool = candidates.length > 0 ? candidates : TEAM;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Renvoie une signature HTML prête à insérer dans un email,
 * avec le nom et le rôle du membre choisi.
 */
export function signatureHTML(member) {
  return `
    <p style="color:#555;font-size:.85rem;line-height:1.6;margin-top:28px">
      ${member.name}<br>
      <span style="color:#999">${member.title} · Créazio</span>
    </p>`;
}

// ── Délais "de traitement" pour la création initiale ────────
// Bornes globales : minimum 62h (~2,6 jours), maximum 20 jours.
const GLOBAL_MIN_HOURS = 62;
const GLOBAL_MAX_HOURS = 20 * 24;

// Fourchettes par plan (en heures), avant application des bornes globales.
const CREATION_DELAY_RANGES = {
  solo:     [3 * 24,  5 * 24],   // 3 à 5 jours — site vitrine simple
  business: [5 * 24,  10 * 24],  // 5 à 10 jours
  expert:   [15 * 24, 20 * 24],  // 15 à 20 jours — projet détaillé/agence
};

/**
 * Calcule une date de "révélation" aléatoire pour la création
 * initiale d'un site, selon le plan du client.
 *
 * @param {string} plan - 'solo' | 'business' | 'expert'
 * @param {Date}   from - date de départ (par défaut : maintenant)
 * @returns {Date} date à laquelle le site devient visible pour le client
 */
export function computeCreationRevealDate(plan, from = new Date()) {
  const range = CREATION_DELAY_RANGES[plan] || CREATION_DELAY_RANGES.solo;
  let hours = randomBetween(range[0], range[1]);
  hours = clamp(hours, GLOBAL_MIN_HOURS, GLOBAL_MAX_HOURS);
  return new Date(from.getTime() + hours * 3600 * 1000);
}

// ── Délais "de traitement" pour les modifications ───────────
const MODIFY_DELAY_RANGE_HOURS = [24, 72]; // 24 à 72h

/**
 * Calcule une date d'application aléatoire pour une modification.
 *
 * @param {Date} from - date de départ (par défaut : maintenant)
 * @returns {Date} date à laquelle l'email "modification terminée" est envoyé
 */
export function computeModifyApplyDate(from = new Date()) {
  const hours = randomBetween(MODIFY_DELAY_RANGE_HOURS[0], MODIFY_DELAY_RANGE_HOURS[1]);
  return new Date(from.getTime() + hours * 3600 * 1000);
}

// ── Délai "de traitement" pour le remplacement d'une photo ──
const PHOTO_REPLACE_DELAY_RANGE_HOURS = [1.5, 2.5]; // ~2h

/**
 * Calcule une date d'application aléatoire pour le remplacement
 * d'une photo par le client (plus rapide qu'une modification
 * de contenu classique : ~2h au lieu de 24-72h).
 *
 * @param {Date} from - date de départ (par défaut : maintenant)
 * @returns {Date} date à laquelle la photo est effectivement visible
 */
export function computePhotoReplaceDate(from = new Date()) {
  const hours = randomBetween(PHOTO_REPLACE_DELAY_RANGE_HOURS[0], PHOTO_REPLACE_DELAY_RANGE_HOURS[1]);
  return new Date(from.getTime() + hours * 3600 * 1000);
}

// ── Helpers ──────────────────────────────────────────────────
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
