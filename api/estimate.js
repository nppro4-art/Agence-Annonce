export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs } = req.body;

  try {
    const lines = specs.toLowerCase();

    // ── PRIX DE BASE PAR TYPE ─────────────────────────────
    let base = 8000;

    if (lines.includes('type: voiture') || lines.includes('type d\'article: voiture')) {
      // Marques premium
      if (/bmw|mercedes|audi|porsche|lexus|tesla/.test(lines)) base = 22000;
      else if (/volkswagen|volvo|toyota|honda|mazda/.test(lines)) base = 14000;
      else if (/renault|peugeot|citroen|opel|ford|seat|skoda/.test(lines)) base = 10000;
      else if (/dacia|fiat|smart|mini/.test(lines)) base = 7000;
      else base = 10000;
    } else if (lines.includes('type: moto') || lines.includes('type d\'article: moto')) {
      if (/ducati|harley|triumph|bmw/.test(lines)) base = 12000;
      else if (/yamaha|honda|kawasaki|suzuki/.test(lines)) base = 6000;
      else base = 4000;
    } else if (lines.includes('type: electronique') || lines.includes('type d\'article: electronique')) {
      if (/iphone 15|iphone 14|samsung s24|s23/.test(lines)) base = 700;
      else if (/iphone 13|iphone 12|samsung s22/.test(lines)) base = 450;
      else if (/ps5|playstation 5/.test(lines)) base = 420;
      else if (/ps4|xbox|nintendo/.test(lines)) base = 200;
      else if (/macbook|ipad pro/.test(lines)) base = 900;
      else base = 300;
    } else if (lines.includes('type: meuble') || lines.includes('type d\'article: meuble')) {
      base = 300;
    } else if (lines.includes('type: vetement') || lines.includes('type d\'article: vetement')) {
      if (/louis vuitton|gucci|chanel|hermès/.test(lines)) base = 800;
      else if (/nike|adidas|jordan|stone island/.test(lines)) base = 120;
      else base = 40;
    } else {
      base = 200;
    }

    // ── DÉPRÉCIATION PAR ANNÉE ────────────────────────────
    const yearMatch = specs.match(/ann[ée]e[^:]*:\s*(\d{4})/i) || specs.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : 2020;
    const age = Math.max(0, 2025 - year);
    const depreciationRate = Math.min(0.75, age * 0.08); // 8% par an max 75%
    base = base * (1 - depreciationRate);

    // ── DÉPRÉCIATION PAR KILOMÉTRAGE (véhicules) ─────────
    const kmMatch = specs.match(/kil[oô]m[eé]trage[^:]*:\s*([\d\s]+)/i);
    if (kmMatch) {
      const km = parseInt(kmMatch[1].replace(/\s/g, ''));
      if (km > 200000) base *= 0.5;
      else if (km > 150000) base *= 0.6;
      else if (km > 100000) base *= 0.72;
      else if (km > 70000) base *= 0.82;
      else if (km > 40000) base *= 0.90;
      else if (km < 20000) base *= 1.05;
    }

    // ── MALUS ÉTAT GÉNÉRAL ────────────────────────────────
    if (/état général[^:]*:\s*(à réparer|mauvais)/i.test(specs)) base *= 0.45;
    else if (/état général[^:]*:\s*(état moyen|moyen)/i.test(specs)) base *= 0.65;
    else if (/état général[^:]*:\s*(bon)/i.test(specs)) base *= 0.82;
    else if (/état général[^:]*:\s*(très bon)/i.test(specs)) base *= 0.92;
    else if (/état général[^:]*:\s*(excellent|neuf|comme neuf)/i.test(specs)) base *= 1.0;

    // ── MALUS DÉFAUTS ─────────────────────────────────────
    const defautsMatch = specs.match(/d[eé]fauts[^:]*:\s*(.+)/i);
    if (defautsMatch) {
      const defauts = defautsMatch[1].toLowerCase();
      if (defauts !== 'aucun') {
        const nbDefauts = (defauts.match(/,/g) || []).length + 1;
        const malus = Math.min(0.45, nbDefauts * 0.07); // 7% par défaut max 45%
        base *= (1 - malus);

        // Malus spécifiques graves
        if (/moteur|boite de vitesses|embrayage|alternateur/.test(defauts)) base *= 0.7;
        if (/voyant moteur|fuite/.test(defauts)) base *= 0.8;
        if (/accident|carrosserie/.test(defauts)) base *= 0.85;
      }
    }

    // ── BONUS ─────────────────────────────────────────────
    if (/1er main|premier propri[eé]taire/i.test(specs)) base *= 1.08;
    if (/carnet.*complet|entretien.*complet/i.test(specs)) base *= 1.05;
    if (/ct.*valide|contr[oô]le.*valide/i.test(specs)) base *= 1.03;
    if (/garantie/i.test(specs)) base *= 1.04;
    if (/facture/i.test(specs)) base *= 1.03;

    // ── CALCUL FOURCHETTE ─────────────────────────────────
    const mid = Math.round(base / 50) * 50;
    const low = Math.round(mid * 0.85 / 50) * 50;
    const high = Math.round(mid * 1.12 / 50) * 50;

    // ── NOTE EXPLICATIVE ──────────────────────────────────
    const notes = [];
    if (age > 5) notes.push(`véhicule de ${age} ans`);
    if (kmMatch && parseInt(kmMatch[1].replace(/\s/g,'')) > 100000) notes.push('kilométrage élevé');
    if (defautsMatch && defautsMatch[1].toLowerCase() !== 'aucun') notes.push('défauts détectés');
    if (/1er main/i.test(specs)) notes.push('bonus 1er main');
    if (/carnet.*complet/i.test(specs)) notes.push('bonus entretien complet');

    const note = notes.length > 0
      ? 'Estimation basée sur : ' + notes.join(', ') + '. Prix indicatif marché LeBonCoin.'
      : 'Estimation indicative basée sur le marché LeBonCoin actuel.';

    res.status(200).json({ low, mid, high, note });

  } catch (e) {
    console.error('Estimate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
