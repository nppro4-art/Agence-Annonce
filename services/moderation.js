import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Liste de mots bloqués (filtrage rapide avant appel IA)
const BLOCKED_WORDS = [
  'nazi','hitler','terrorisme','terroriste','bombe','arme','drogue','cocaïne',
  'héroïne','pornographie','porno','escort','prostitution','arnaque','scam',
  'fake','contrefaçon','piratage','hack','crack','serial key','keygen',
];

export async function moderateContent(text) {
  if (!text || text.trim().length === 0) {
    return { safe: false, reason: 'Contenu vide' };
  }

  // Filtrage rapide par mots clés
  const lowerText = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lowerText.includes(word)) {
      return {
        safe: false,
        reason: `Contenu inapproprié détecté. Veuillez utiliser un langage professionnel pour décrire votre activité.`,
      };
    }
  }

  // Vérification longueur
  if (text.length > 5000) {
    return { safe: false, reason: 'Description trop longue (maximum 5000 caractères)' };
  }

  // Pour les textes courts et évidents, pas besoin d'appel IA
  if (text.length < 200 && !containsSuspiciousPatterns(text)) {
    return { safe: true };
  }

  // Modération IA pour les textes plus longs ou suspects
  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: `Tu es un modérateur de contenu. Analyse le texte suivant et réponds UNIQUEMENT par "SAFE" ou "UNSAFE:raison".
      
      Contenu UNSAFE : propos racistes, haineux, violence, contenu adulte, activités illégales, arnaque, contenu offensant.
      Contenu SAFE : description d'activité professionnelle, commerciale ou personnelle normale.`,
      messages: [{ role: 'user', content: `Texte à analyser : "${text}"` }],
    });

    const result = res.content[0].text.trim();
    if (result.startsWith('UNSAFE')) {
      return {
        safe: false,
        reason: 'Votre description contient du contenu que nous ne pouvons pas accepter. Veuillez la reformuler de façon professionnelle.',
      };
    }
    return { safe: true };
  } catch {
    // En cas d'erreur API, on laisse passer (fail open)
    return { safe: true };
  }
}

function containsSuspiciousPatterns(text) {
  const patterns = [
    /\b(fuck|shit|putain|merde|connard)\b/i,
    /\b(kill|mort|tuer|death)\b/i,
    /\b(sex|xxx|adult|18\+)\b/i,
  ];
  return patterns.some(p => p.test(text));
}
