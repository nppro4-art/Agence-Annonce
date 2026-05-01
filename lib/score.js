// Score de qualité d'une annonce sur 100
export function scoreAnnonce({ titre, description, pointsForts, defauts, prixConseil, shortVersion, inputData }) {
  let score = 0
  const suggestions = []

  // Titre (20 pts)
  if (titre) {
    score += 10
    if (titre.length >= 30 && titre.length <= 70) score += 10
    else suggestions.push('Le titre devrait faire entre 30 et 70 caractères pour être optimal sur LeBonCoin')
  } else suggestions.push('Titre manquant')

  // Description (20 pts)
  if (description) {
    score += 10
    if (description.length >= 150) score += 10
    else suggestions.push('La description est trop courte — ajoutez plus de détails sur l\'état et l\'historique')
  } else suggestions.push('Description manquante')

  // Points forts (15 pts)
  if (pointsForts) {
    score += 8
    const bullets = (pointsForts.match(/•/g) || []).length
    if (bullets >= 3) score += 7
    else suggestions.push('Ajoutez au moins 3 points forts pour convaincre l\'acheteur')
  } else suggestions.push('Points forts manquants — ils augmentent fortement le taux de contact')

  // Transparence sur les défauts (15 pts)
  if (defauts && defauts.toLowerCase() !== 'aucun' && defauts.length > 10) score += 15
  else if (defauts) { score += 8; suggestions.push('Soyez plus précis sur les défauts — les acheteurs font plus confiance aux vendeurs transparents') }
  else suggestions.push('Mentionnez les défauts éventuels — l\'honnêteté génère plus de contacts sérieux')

  // Prix conseillé (10 pts)
  if (prixConseil) score += 10
  else suggestions.push('Utilisez le prix conseillé par l\'IA pour maximiser vos chances de vente')

  // Version courte (10 pts)
  if (shortVersion && shortVersion.length >= 50) score += 10
  else suggestions.push('La version courte est utile pour partager sur Facebook Marketplace')

  // Données du formulaire (10 pts)
  if (inputData) {
    const filled = Object.values(inputData).filter(v => v && v !== '').length
    const total = Object.keys(inputData).length
    if (total > 0) score += Math.round((filled / total) * 10)
    if (filled < total * 0.7) suggestions.push('Remplissez plus de champs dans le formulaire pour une annonce plus complète')
  }

  // Notation
  let grade = 'F'
  if (score >= 90) grade = 'A+'
  else if (score >= 80) grade = 'A'
  else if (score >= 70) grade = 'B'
  else if (score >= 60) grade = 'C'
  else if (score >= 50) grade = 'D'

  return { score: Math.min(score, 100), grade, suggestions: suggestions.slice(0, 3) }
}
