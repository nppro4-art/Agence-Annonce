export function scoreAnnonce({ titre, description, pointsForts, defauts, prixConseil }) {
  let score = 0
  const suggestions = []

  if (titre && titre.length >= 20) score += 20
  else suggestions.push('Titre trop court - visez 30-60 caracteres')

  if (description && description.length >= 150) score += 25
  else if (description && description.length >= 80) { score += 15; suggestions.push('Description un peu courte') }
  else suggestions.push('Description trop courte - ajoutez plus de details')

  if (pointsForts && pointsForts.length > 30) score += 20
  else suggestions.push('Ajoutez des points forts specifiques')

  if (defauts && defauts.length > 10) score += 15
  else suggestions.push('Mentionnez les defauts - ca rassure les acheteurs')

  if (prixConseil && prixConseil.length > 5) score += 10
  else suggestions.push('Precisez votre politique de prix')

  // Bonus qualite
  if (titre && /\d/.test(titre)) score += 5 // chiffres dans le titre
  if (description && description.length >= 300) score += 5 // description longue

  score = Math.min(100, score)

  let grade = 'Faible'
  if (score >= 80) grade = 'Excellent'
  else if (score >= 65) grade = 'Bon'
  else if (score >= 50) grade = 'Correct'
  else if (score >= 35) grade = 'A ameliorer'

  return { score, grade, suggestions }
}

// Score vendeur (idée H) - basé sur l'historique
export function scoreVendeur(nbAnnonces, nbVentes, nbReponses) {
  let points = 0
  points += Math.min(nbAnnonces * 10, 200)
  points += Math.min(nbVentes * 25, 500)
  points += Math.min(nbReponses * 5, 150)

  let niveau = 'Debutant'
  let prochainNiveau = 'Vendeur'
  let pointsManquants = Math.max(0, 50 - points)
  let emoji = '🌱'

  if (points >= 500) { niveau = 'Expert'; prochainNiveau = null; emoji = '👑'; pointsManquants = 0 }
  else if (points >= 200) { niveau = 'Pro'; prochainNiveau = 'Expert'; emoji = '⭐'; pointsManquants = 500 - points }
  else if (points >= 50) { niveau = 'Vendeur'; prochainNiveau = 'Pro'; emoji = '🔥'; pointsManquants = 200 - points }

  return { points, niveau, prochainNiveau, pointsManquants, emoji }
}
