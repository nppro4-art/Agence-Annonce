import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const PLAN_LIMITS = {
  premium:  { annonces: Infinity, reponses: Infinity },
  expert:   { annonces: Infinity, reponses: Infinity },
  business: { annonces: 30, reponses: 100 },
  starter:  { annonces: 10, reponses: 30  },
  pro:      { annonces: 30, reponses: 100 },
  free:     { annonces: 0,  reponses: 0   },
}

const PLAN_FEATURES = {
  premium:  { analyser:true, chatbot:true, ventes:true, flash:true, traduction:true, lot:true, arnaque:true, plateformes:true },
  expert:   { analyser:true, chatbot:true, ventes:true, flash:true, traduction:true, lot:true, arnaque:true, plateformes:true },
  business: { analyser:true, chatbot:true, ventes:true, flash:true, traduction:true, lot:false, arnaque:true, plateformes:true },
  starter:  { analyser:false, chatbot:false, ventes:false, flash:false, traduction:false, lot:false, arnaque:false, plateformes:false },
  pro:      { analyser:true, chatbot:true, ventes:true, flash:true, traduction:true, lot:false, arnaque:true, plateformes:true },
  free:     { analyser:false, chatbot:false, ventes:false, flash:false, traduction:false, lot:false, arnaque:false, plateformes:false },
}

function canAccessFeature(planKey, feature) {
  return !!(PLAN_FEATURES[planKey] || PLAN_FEATURES.free)[feature]
}
const PLAN_NAMES = { premium:'Premium', expert:'Expert', business:'Business', starter:'Starter', pro:'Business', free:'Gratuit' }
const PLAN_PRICES = { premium:'—', expert:'12,99', business:'5,99', starter:'3,99', pro:'5,99', free:'0' }
const PLAN_CHATBOT = { premium:500, expert:200, business:50, starter:0, pro:50, free:0 }

const CATEGORIES = {
  Voiture: [
    { key:'marque', label:'Marque', ph:'BMW, Renault, Peugeot...' },
    { key:'modele', label:'Modele', ph:'Serie 3, Clio, 308...' },
    { key:'version', label:'Version / Finition', ph:'M Sport, GT Line...' },
    { key:'annee', label:'Annee', ph:'2019', type:'number' },
    { key:'kilometrage', label:'Kilometrage (km)', ph:'75000', type:'number' },
    { key:'carburant', label:'Carburant', type:'select', opts:['Essence','Diesel','Hybride','Hybride rechargeable','Electrique','GPL'] },
    { key:'boite', label:'Boite de vitesse', type:'select', opts:['Manuelle 5v','Manuelle 6v','Automatique','Semi-automatique'] },
    { key:'couleur', label:'Couleur exterieure', ph:'Noir metallise, Blanc nacre...' },
    { key:'couleurInt', label:'Couleur interieure', ph:'Noir, Beige, Cuir brun...' },
    { key:'puissance', label:'Puissance (CV)', ph:'120', type:'number' },
    { key:'cylindree', label:'Cylindree (cm3)', ph:'1598', type:'number' },
    { key:'conso', label:'Consommation (L/100)', ph:'5.8' },
    { key:'co2', label:'Emissions CO2 (g/km)', ph:'112' },
    { key:'nbPortes', label:'Nombre de portes', type:'select', opts:['2','3','4','5'] },
    { key:'nbPlaces', label:'Nombre de places', type:'select', opts:['2','4','5','7','9'] },
    { key:'carrosserie', label:'Type de carrosserie', type:'select', opts:['Berline','Break','SUV','Citadine','Coupe','Cabriolet','Monospace','Utilitaire'] },
    { key:'etat', label:'Etat general', type:'select', opts:['Excellent - comme neuf','Tres bon etat','Bon etat','Etat correct','A reparer'] },
    { key:'nbProprio', label:'Nb de proprietaires', ph:'1', type:'number' },
    { key:'premiereMain', label:'Premiere main', type:'select', opts:['Oui','Non','Ne sait pas'] },
    { key:'ct', label:'Controle technique', type:'select', opts:['Valide','A refaire sous 2 mois','Non presente','Non applicable'] },
    { key:'dateCT', label:'Date du CT', ph:'03/2024' },
    { key:'carnet', label:'Carnet entretien', type:'select', opts:['Complet et a jour','Partiel','Absent'] },
    { key:'dernierEntretien', label:'Dernier entretien', ph:'Vidange + filtres a 70 000 km...', wide:true },
    { key:'pneus', label:'Etat des pneus', type:'select', opts:['Neufs','Bonne epaisseur','Usure normale','A changer'] },
    { key:'freins', label:'Etat des freins', type:'select', opts:['Neufs','Bon etat','Usure normale','A surveiller'] },
    { key:'courroie', label:'Courroie de distribution', type:'select', opts:['Changee recemment','A faire','Chaine - pas de courroie'] },
    { key:'options', label:'Options et equipements', ph:'GPS, Camera recul, Toit ouvrant, Sieges chauffants...', wide:true },
    { key:'defauts', label:'Defauts et imperfections', ph:'Rayure aile avant, trace pare-choc, voyant...', wide:true },
    { key:'travauxFaits', label:'Travaux effectues recemment', ph:'Embrayage neuf a 65 000 km, batterie 2023...', wide:true },
    { key:'travauxAFaire', label:'Travaux a prevoir', ph:'Pneus arriere bientot, vidange dans 5000 km...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'8500', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui - prix a debattre','Legerement','Non - prix ferme'] },
    { key:'prixMin', label:'Prix minimum accepte (confidentiel)', ph:'7800', type:'number' },
    { key:'ville', label:'Ville', ph:'Lyon, Paris...' },
    { key:'dispo', label:'Disponibilite', type:'select', opts:['Immediate','Sous 1 semaine','Semaine uniquement','Week-end uniquement','Sur RDV'] },
    { key:'livraison', label:'Livraison possible', type:'select', opts:['Non','Oui - frais acheteur','Oui - inclus','A discuter'] },
    { key:'paiement', label:'Mode de paiement accepte', type:'select', opts:['Especes','Virement bancaire','Cheque de banque','Tous modes'] },
    { key:'raisonVente', label:'Raison de la vente', ph:'Achat vehicule neuf, demenagement...' },
    { key:'urgence', label:'Urgence de vente', type:'urgence' },
  ],
  Telephone: [
    { key:'marque', label:'Marque', ph:'Apple, Samsung, Xiaomi...' },
    { key:'modele', label:'Modele', ph:'iPhone 15 Pro, Galaxy S24...' },
    { key:'couleur', label:'Couleur', ph:'Noir titane, Blanc, Violet...' },
    { key:'stockage', label:'Stockage', type:'select', opts:['32 Go','64 Go','128 Go','256 Go','512 Go','1 To'] },
    { key:'ram', label:'RAM', ph:'8 Go, 12 Go...' },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf sous blister','Comme neuf','Tres bon','Bon etat','Etat correct'] },
    { key:'batterie', label:'Sante batterie', ph:'94%' },
    { key:'cycles', label:'Nb cycles batterie', ph:'120 cycles' },
    { key:'debloque', label:'Debloque tous operateurs', type:'select', opts:['Oui - tous operateurs','Non - Orange','Non - SFR','Non - Bouygues','Non - Free'] },
    { key:'imei', label:'IMEI disponible', type:'select', opts:['Oui - sur demande','Non'] },
    { key:'faceId', label:'Face ID / Touch ID', type:'select', opts:['Fonctionne parfaitement','Probleme mineur','Ne fonctionne plus','Non applicable'] },
    { key:'etatEcran', label:'Etat ecran', type:'select', opts:['Parfait','Micro-rayures','Rayures legeres','Fissure ou cassure'] },
    { key:'etatDos', label:'Etat du dos', type:'select', opts:['Parfait','Micro-rayures','Rayures visibles','Fissure'] },
    { key:'cameras', label:'Etat cameras', type:'select', opts:['Toutes parfaites','Legere buee','Probleme sur une','Plusieurs defectueuses'] },
    { key:'hautParleur', label:'Haut-parleur et micro', type:'select', opts:['Parfaits','Probleme leger','Defectueux'] },
    { key:'connecteur', label:'Connecteur de charge', type:'select', opts:['Parfait','Parfois capricieux','Defectueux'] },
    { key:'accessoires', label:'Accessoires inclus', ph:'Boite origine, chargeur, cable, coques...', wide:true },
    { key:'reparations', label:'Reparations effectuees', ph:'Ecran change 2023, batterie remplacee...', wide:true },
    { key:'defauts', label:'Autres defauts', ph:'Petit impact bas telephone, marque vitre arriere...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'450', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non - prix ferme'] },
    { key:'ville', label:'Ville', ph:'Paris, Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - Mondial Relay','Oui - Colissimo','Oui - tous','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  Informatique: [
    { key:'type', label:'Type', type:'select', opts:['Ordinateur portable','PC fixe','Tablette','Ecran','Imprimante','Clavier/Souris','Composant PC','Disque dur SSD','Autre'] },
    { key:'marque', label:'Marque', ph:'Apple, Dell, HP, Asus, Lenovo...' },
    { key:'modele', label:'Modele', ph:'MacBook Pro 14 M3, XPS 15 9520...' },
    { key:'anneeAchat', label:'Annee achat', ph:'2022', type:'number' },
    { key:'processeur', label:'Processeur', ph:'Apple M3 Pro, Intel i7-12700H, Ryzen 9...' },
    { key:'ram', label:'RAM', type:'select', opts:['4 Go','8 Go','16 Go','18 Go','24 Go','32 Go','48 Go','64 Go'] },
    { key:'stockage', label:'Stockage', ph:'512 Go SSD NVMe, 1 To SSD...' },
    { key:'gpu', label:'Carte graphique', ph:'RTX 4060, RX 7600, Intel Iris Xe...' },
    { key:'ecranTaille', label:'Taille ecran', ph:'14 pouces, 27 pouces...' },
    { key:'ecranRes', label:'Resolution ecran', ph:'2560x1600 Retina, 4K UHD...' },
    { key:'ecranHz', label:'Taux rafraichissement', ph:'60 Hz, 120 Hz, 165 Hz...' },
    { key:'autonomie', label:'Autonomie reelle', ph:'8-10h bureautique...' },
    { key:'batterie', label:'Sante batterie / cycles', ph:'94%, 120 cycles...' },
    { key:'os', label:'Systeme exploitation', type:'select', opts:['macOS Sonoma','macOS Ventura','Windows 11','Windows 10','Linux','Chrome OS','Aucun'] },
    { key:'etat', label:'Etat general', type:'select', opts:['Comme neuf','Tres bon etat','Bon etat','Etat correct','Pour pieces'] },
    { key:'etatEcran', label:'Etat ecran', type:'select', opts:['Parfait','Micro-rayures','Pixels morts','Fissure'] },
    { key:'etatClavier', label:'Etat clavier', type:'select', opts:['Parfait','Touches normales','Quelques touches capricieuses','Defectueux'] },
    { key:'ports', label:'Ports disponibles', ph:'2x USB-C Thunderbolt, HDMI, SD, USB-A...' },
    { key:'accessoires', label:'Accessoires inclus', ph:'Chargeur origine, housse, souris, dock...' },
    { key:'logiciels', label:'Logiciels inclus', ph:'Office 2021, Adobe CC, Final Cut Pro...' },
    { key:'defauts', label:'Defauts et remarques', ph:'Petite marque couvercle, charniere legerement...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'800', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'1400', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Paris, Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - emballe soin','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  Mobilier: [
    { key:'type', label:'Type de meuble', ph:'Canape, Table basse, Armoire, Lit, Bureau...' },
    { key:'marque', label:'Marque / Fabricant', ph:'Ikea, Maisons du Monde, Roche Bobois...' },
    { key:'modele', label:'Modele / Reference', ph:'KALLAX, EKTORP, sur-mesure...' },
    { key:'couleur', label:'Couleur principale', ph:'Blanc, Chene naturel, Gris anthracite...' },
    { key:'matiere', label:'Matiere principale', type:'select', opts:['Bois massif','Bois MDF','Agglomere','Metal','Verre','Tissu','Cuir','Velours','Rotin','Marbre','Autre'] },
    { key:'matiereSecondaire', label:'Matiere secondaire', ph:'Pieds metal noir, plateau verre...' },
    { key:'longueur', label:'Longueur (cm)', ph:'180', type:'number' },
    { key:'largeur', label:'Largeur / Profondeur (cm)', ph:'90', type:'number' },
    { key:'hauteur', label:'Hauteur (cm)', ph:'75', type:'number' },
    { key:'places', label:'Nb places (si canape)', type:'select', opts:['1 place','2 places','3 places','4 places','Angle / L','Convertible'] },
    { key:'convertible', label:'Convertible en lit', type:'select', opts:['Non','Oui - clic-clac','Oui - avec coffre','Oui - meridienne'] },
    { key:'rangements', label:'Rangements integres', type:'select', opts:['Aucun','Tiroirs','Portes','Etageres','Coffre'] },
    { key:'anneeAchat', label:'Annee achat approximative', ph:'2021' },
    { key:'etat', label:'Etat', type:'select', opts:['Comme neuf','Tres bon etat','Bon etat','Etat correct','Necessite nettoyage'] },
    { key:'defauts', label:'Defauts et imperfections', ph:'Petite rayure plateau, trace accoudoir...', wide:true },
    { key:'demontable', label:'Demontable', type:'select', opts:['Oui - facile','Partiellement','Non - un seul bloc'] },
    { key:'instructions', label:'Instructions de montage', type:'select', opts:['Oui disponibles','Non'] },
    { key:'poids', label:'Poids estime (kg)', ph:'35', type:'number' },
    { key:'prix', label:'Prix demande (EUR)', ph:'150', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'450', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'aideChargement', label:'Aide au chargement', type:'select', opts:['Oui je peux aider','Non'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  Electromenager: [
    { key:'type', label:'Type appareil', ph:'Lave-linge, Frigo, Four, Lave-vaisselle...' },
    { key:'marque', label:'Marque', ph:'Bosch, Samsung, Whirlpool, Miele...' },
    { key:'modele', label:'Reference modele', ph:'WAN24264FR...' },
    { key:'anneeAchat', label:'Annee achat', ph:'2020', type:'number' },
    { key:'capacite', label:'Capacite', ph:'7 kg, 200L, 60 cm...' },
    { key:'classeEnergie', label:'Classe energetique', type:'select', opts:['A+++','A++','A+','A','B','C','D','E','F','G'] },
    { key:'conso', label:'Consommation annuelle (kWh)', ph:'150 kWh' },
    { key:'dimensions', label:'Dimensions (L x H x P cm)', ph:'60 x 85 x 55' },
    { key:'couleur', label:'Couleur', type:'select', opts:['Blanc','Inox','Noir','Gris anthracite','Autre'] },
    { key:'etat', label:'Etat', type:'select', opts:['Excellent - comme neuf','Tres bon etat','Bon etat','Quelques traces cosmetiques','Necessite reparation'] },
    { key:'fonctionnement', label:'Fonctionnement', type:'select', opts:['Parfait - aucun probleme','Quelques defauts mineurs','Fonctionne mais reparation conseillee'] },
    { key:'nbProgrammes', label:'Nombre de programmes', ph:'15 programmes' },
    { key:'niveauSonore', label:'Niveau sonore (dB)', ph:'49 dB' },
    { key:'garantie', label:'Garantie restante', type:'select', opts:['Sous garantie constructeur','Sous garantie revendeur','Plus de garantie'] },
    { key:'dateGarantie', label:'Date fin garantie', ph:'06/2025' },
    { key:'entretien', label:'Entretien effectue', ph:'Detartrage regulier, joint remplace 2023...', wide:true },
    { key:'defauts', label:'Defauts ou pannes historiques', ph:'Trace legere rouille tambour, joint a surveiller...', wide:true },
    { key:'accessoires', label:'Accessoires inclus', ph:'Tuyaux, grilles, bacs, livret garantie...' },
    { key:'facture', label:'Facture disponible', type:'select', opts:['Oui','Non'] },
    { key:'prix', label:'Prix demande (EUR)', ph:'200', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'600', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'livraison', label:'Livraison possible', type:'select', opts:['Non','Oui - frais acheteur','Oui - inclus'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  Vetements: [
    { key:'type', label:'Type de vetement', ph:'Veste, Manteau, Robe, Pantalon, Sneakers...' },
    { key:'marque', label:'Marque', ph:'Zara, H&M, Nike, Gucci...' },
    { key:'collection', label:'Collection / Saison', ph:'Hiver 2023, Ete 2022...' },
    { key:'taille', label:'Taille', ph:'M, 42, 10 ans, EU 42...' },
    { key:'couleur', label:'Couleur', ph:'Noir, Bleu marine, Ecru...' },
    { key:'matiere', label:'Composition / Matiere', ph:'100% coton, 80% laine 20% cachemire...' },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf avec etiquette','Neuf sans etiquette','Comme neuf - porte 1-2 fois','Tres bon etat','Bon etat - legere usure','Etat correct'] },
    { key:'nbPortes', label:'Nb de fois porte', ph:'2-3 fois, rarement...' },
    { key:'defauts', label:'Defauts visibles', ph:'Aucun, petite pilling, decoloration legere...', wide:true },
    { key:'entretien', label:'Instructions entretien', ph:'Lavage 30 degres, nettoyage a sec...' },
    { key:'coupe', label:'Longueur / Coupe', ph:'Regular, Slim, Oversized, Cropped...' },
    { key:'pointure', label:'Pointure (si chaussures)', ph:'42 EU / 8.5 US' },
    { key:'accessoires', label:'Accessoires inclus', ph:'Ceinture, sac protection, etiquette...' },
    { key:'prix', label:'Prix demande (EUR)', ph:'25', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'80', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Paris...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - Mondial Relay','Oui - Colissimo','Oui - tous','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  'Jeux video': [
    { key:'type', label:'Type', type:'select', opts:['Jeu video','Console','Manette / Accessoire','Pack complet','Carte cadeau'] },
    { key:'console', label:'Plateforme', type:'select', opts:['PlayStation 5','PlayStation 4','PlayStation 3','Xbox Series X/S','Xbox One','Nintendo Switch','Nintendo Switch Lite','PC','Retro / Autre'] },
    { key:'titre', label:'Titre / Nom', ph:'FIFA 24, Zelda Tears of the Kingdom...' },
    { key:'region', label:'Region', type:'select', opts:['FR / Europe PAL','USA NTSC','Japon','Multi-region'] },
    { key:'version', label:'Version', type:'select', opts:['Version physique - boite','Version numerique - code','Edition speciale / Collector','Premiere impression'] },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf sous blister','Comme neuf','Tres bon etat','Bon etat','Etat correct'] },
    { key:'boite', label:'Boite et notice', type:'select', opts:['Complet - boite + notice + jeu','Jeu seul','Boite seule','Boite abimee mais complete'] },
    { key:'dlc', label:'DLC inclus', ph:'Season pass, DLC 1 et 2, skin exclusif...', wide:true },
    { key:'nbJeux', label:'Nb de jeux (si lot)', ph:'5 jeux inclus...' },
    { key:'manettes', label:'Manettes incluses (si console)', ph:'2 manettes, 1 charge-play...' },
    { key:'defauts', label:'Defauts / Problemes', ph:'Aucun, rayure sur boite, disque parfait...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'25', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - emballe soin','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  Sport: [
    { key:'type', label:'Type de materiel', ph:'Velo de route, Raquette tennis, Tapis de course...' },
    { key:'marque', label:'Marque', ph:'Decathlon, Specialized, Nike, Technogym...' },
    { key:'modele', label:'Modele', ph:'BTwin 540, Babolat Pure Drive...' },
    { key:'anneeAchat', label:'Annee achat', ph:'2021' },
    { key:'taille', label:'Taille / Cadre', ph:'M, 42, cadre 54cm...' },
    { key:'etat', label:'Etat', type:'select', opts:['Comme neuf','Tres bon etat','Bon etat - usure normale','Etat correct','Necessite entretien'] },
    { key:'frequence', label:'Frequence utilisation', type:'select', opts:['Jamais ou presque','Quelques fois par an','1 fois par mois','1 fois par semaine','Plusieurs fois par semaine'] },
    { key:'niveau', label:'Niveau pratique vise', type:'select', opts:['Debutant','Intermediaire','Avance','Competiteur'] },
    { key:'poids', label:'Poids (kg)', ph:'8.5', type:'number' },
    { key:'specs', label:'Specifications techniques', ph:'Shimano 105 11v, fourche carbone, freins disque...', wide:true },
    { key:'entretien', label:'Entretien et reparations', ph:'Revision complete 2023, chaine neuve...', wide:true },
    { key:'defauts', label:'Defauts et usures', ph:'Rayures cadre, grips uses, pneu avant a surveiller...', wide:true },
    { key:'accessoires', label:'Accessoires inclus', ph:'Casque, pompe, cadenas, sacoche, ordinateur bord...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'80', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'350', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'livraison', label:'Livraison possible', type:'select', opts:['Non','Oui - emballe soin','Oui - selon transporteur'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  Bijoux: [
    { key:'type', label:'Type', ph:'Bague, Collier, Bracelet, Montre, Boucles oreilles...' },
    { key:'marque', label:'Marque / Createur', ph:'Cartier, Pandora, Daniel Wellington...' },
    { key:'matiere', label:'Matiere principale', type:'select', opts:['Or 18 carats','Or 14 carats','Or rose','Or blanc','Argent 925','Argent plaque','Acier inoxydable','Platine','Plaque or','Bijou fantaisie'] },
    { key:'pierres', label:'Pierres / Ornements', ph:'Diamant 0.5ct, Saphir, Perle naturelle...' },
    { key:'poids', label:'Poids (grammes)', ph:'5.2', type:'number' },
    { key:'taille', label:'Taille / Tour de doigt', ph:'54, 18cm longueur, 40cm chaine...' },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf sous ecrin','Comme neuf - jamais porte','Tres bon etat','Bon etat','Quelques traces usure'] },
    { key:'defauts', label:'Defauts', ph:'Aucun, petite egratignure fermoir...', wide:true },
    { key:'certificat', label:'Certificat authenticite', type:'select', opts:['Oui - inclus','Non'] },
    { key:'facture', label:'Facture achat', type:'select', opts:['Disponible','Non disponible'] },
    { key:'ecrin', label:'Ecrin / Boite origine', type:'select', opts:['Oui','Non'] },
    { key:'gravure', label:'Gravure / Personnalisation', ph:'Aucune, initiales AB...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'120', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'450', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Paris...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - lettre recommandee','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  Autre: [
    { key:'type', label:'Type / Description courte', ph:'Aspirateur robot, Livre rare, Instrument musique...' },
    { key:'marque', label:'Marque / Fabricant', ph:'(si applicable)' },
    { key:'modele', label:'Modele / Reference', ph:'(si applicable)' },
    { key:'anneeAchat', label:'Annee achat', ph:'(si applicable)', type:'number' },
    { key:'couleur', label:'Couleur', ph:'(si applicable)' },
    { key:'dimensions', label:'Dimensions ou caracteristiques', ph:'30x20x15 cm, 2.5 kg...' },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf','Comme neuf','Tres bon etat','Bon etat','Etat correct','Pour pieces'] },
    { key:'description', label:'Description complete', ph:'Decrivez en detail votre article, son usage, ses caracteristiques...', wide:true },
    { key:'defauts', label:'Defauts et imperfections', ph:'Aucun, petite trace, notice manquante...', wide:true },
    { key:'accessoires', label:'Accessoires et elements inclus', ph:'Chargeur, boite, manuel, telecommande...', wide:true },
    { key:'garantie', label:'Garantie restante', ph:'Aucune, 6 mois constructeur...' },
    { key:'facture', label:'Facture disponible', type:'select', opts:['Oui','Non'] },
    { key:'prix', label:'Prix demande (EUR)', ph:'50', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'(si connu)' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Non','Oui - selon taille','Oui - tous transporteurs'] },
    { key:'raisonVente', label:'Raison de la vente', ph:'Plus utilise, upgrade, cadeau non desire...' },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
}

const CATEGORY_LIST = Object.keys(CATEGORIES)

const S = {
  inp: { background:'transparent',border:'none',borderBottom:'1px solid var(--border2)',color:'var(--white)',fontSize:14,padding:'6px 0',width:'100%',outline:'none',transition:'border-color .2s' },
  lbl: { fontSize:10,fontWeight:600,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:7 },
}

function LockOverlay({ subscribe }) {
  return (
    <div style={{ position:'sticky',bottom:24,left:0,right:0,zIndex:50,display:'flex',justifyContent:'center',marginTop:16 }}>
      <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',borderRadius:4,padding:'20px 28px',maxWidth:420,width:'100%',textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,.7)' }}>
        <div style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:2,color:'var(--gold3)',marginBottom:8 }}>SUBSCRIBER ONLY</div>
        <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:8 }}>Abonnement requis</div>
        <div style={{ fontSize:12,color:'var(--muted2)',marginBottom:16,lineHeight:1.6 }}>
          Abonnez-vous a partir de 3,99 EUR/semaine.
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
          {[['Starter','3,99'],['Business','5,99'],['Expert','12,99']].map(([plan,price]) => (
            <button key={plan} onClick={() => subscribe(plan.toLowerCase())}
              style={{ background:'var(--s2)',border:'1px solid var(--border)',borderRadius:3,color:'var(--cream)',cursor:'pointer',fontSize:11,padding:'8px 4px' }}>
              <div style={{ fontSize:9,color:'var(--muted2)',marginBottom:2 }}>{plan}</div>
              <div style={{ fontFamily:'var(--font-label)',color:'var(--gold2)',fontSize:13 }}>{price}EUR</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState({ annonces:0, reponses:0 })
  const [annonces, setAnnonces] = useState([])
  const [credits, setCredits] = useState({ annonces:{ remaining:0 }, reponses:{ remaining:0 } })
  const [purchases, setPurchases] = useState([])
  const [showSubModal, setShowSubModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user)
      setLoading(false)
    }).catch(() => router.push('/auth/login'))
    Promise.all([
      fetch('/api/dashboard/annonces').then(r=>r.json()),
      fetch('/api/dashboard/reponses').then(r=>r.json()),
      fetch('/api/dashboard/credits').then(r=>r.json()),
    ]).then(([a,r,c]) => {
      setUsage({ annonces:a.annonces?.length||0, reponses:r.reponses?.length||0 })
      if (c.credits) setCredits(c.credits)
      if (c.purchases) setPurchases(c.purchases)
    }).catch(()=>{})

    // Charger les annonces pour les sélecteurs
    fetch('/api/dashboard/annonces').then(r=>r.json()).then(d => {
      setAnnonces(d.annonces||[])
    }).catch(()=>{})
  }, [])

  const logout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/') }

  const subscribe = async (planKey='business') => {
    const res = await fetch('/api/stripe/create-subscription',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ planKey })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert('Erreur: '+(data.error||'Inconnue'))
  }

  const cancelSubscription = async () => {
    if (!confirm('Confirmer annulation ? Acces maintenu jusqu\'a fin de periode.')) return
    setCancelLoading(true)
    const res = await fetch('/api/stripe/cancel-subscription',{method:'POST'})
    const data = await res.json()
    setCancelLoading(false)
    if (data.success) { setCancelDone(true); setShowSubModal(false) }
    else alert('Erreur: '+(data.error||'Inconnue'))
  }

  const planKey = user?.planKey || user?.plan || 'free'
  const isPremium = planKey === 'premium'
  const isSubscribed = (user?.plan==='pro' && user?.subStatus==='active') || isPremium
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free
  const annoncesLeft = limits.annonces===Infinity ? '∞' : Math.max(0,limits.annonces-usage.annonces)
  const reponsesLeft = limits.reponses===Infinity ? '∞' : Math.max(0,limits.reponses-usage.reponses)

  const TABS = [
    {id:'home',label:'Accueil'},
    {id:'annonce',label:'Annonce'},
    {id:'reponse',label:'Repondre'},
    {id:'estimation',label:'Estimer'},
    {id:'analyser',label:'Analyser'},
    {id:'ventes',label:'Mes ventes'},
    {id:'chatbots',label:'Chatbots'},
    {id:'outils',label:'Outils'},
    {id:'historique',label:'Historique'},
    {id:'tarifs',label:'Tarifs'},
    {id:'profil',label:'Profil'},
  ]

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--black)' }}>
      <div style={{ width:32,height:32,border:'2px solid var(--border2)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',display:'flex',flexDirection:'column' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .db-fade{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) forwards}
        .tab-btn{transition:all .2s;border-bottom:2px solid transparent;white-space:nowrap}
        .tab-btn:hover{color:var(--cream)!important}
        .tab-btn.active{color:var(--gold2)!important;border-bottom-color:var(--gold)!important}
        .act-tile{transition:all .25s;cursor:pointer}
        .act-tile:hover{background:var(--s2)!important;transform:translateY(-2px)}
        .copy-btn:hover{border-color:var(--gold-border)!important;color:var(--gold2)!important}
        .hover-row:hover{background:var(--s2)!important}
        @media(max-width:768px){
          .db-header{padding:0 8px!important}
          .tab-btn{font-size:9px!important;padding:0 4px!important}
          .db-credits{display:none!important}
          .db-main{padding:14px 12px 80px!important}
          .db-grid2{grid-template-columns:1fr!important}
          .db-grid3{grid-template-columns:1fr 1fr!important}
          .db-actions{grid-template-columns:1fr!important}
          .db-form-grid{grid-template-columns:1fr!important}
          .db-tools-grid{grid-template-columns:1fr!important}
          .db-plans-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {showSubModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
          onClick={()=>setShowSubModal(false)}>
          <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',borderRadius:4,padding:'28px 24px',width:'100%',maxWidth:440,position:'relative',animation:'slideIn .3s ease' }}
            onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowSubModal(false)} style={{ position:'absolute',top:12,right:14,background:'none',border:'none',color:'var(--muted2)',cursor:'pointer',fontSize:20 }}>x</button>
            <div style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:3,color:'var(--gold3)',marginBottom:8 }}>MON ABONNEMENT</div>
            <h3 style={{ fontFamily:'var(--font-display)',fontSize:24,fontWeight:600,marginBottom:18 }}>Plan {PLAN_NAMES[planKey]}</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:18 }}>
              {[
                ['Plan',PLAN_NAMES[planKey]],
                ['Prix',PLAN_PRICES[planKey]+(planKey!=='free'&&planKey!=='premium'?' EUR/sem':'')],
                ['Statut',cancelDone?'Annulation planifiee':'Actif'],
                ['Annonces',limits.annonces===Infinity?'∞':limits.annonces+'/sem'],
                ['Reponses',limits.reponses===Infinity?'∞':limits.reponses+'/sem'],
                ['Renouvellement','7 jours'],
              ].map(([l,v])=>(
                <div key={l} style={{ background:'var(--ink)',padding:'10px 14px' }}>
                  <div style={{ fontSize:9,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:13,color:'var(--cream)',fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            {cancelDone ? (
              <div style={{ background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:3,padding:'12px',fontSize:13,color:'var(--success2)',textAlign:'center' }}>
                Annulation confirmee. Acces maintenu jusqu\'a fin de periode.
              </div>
            ) : (
              <button onClick={cancelSubscription} disabled={cancelLoading}
                style={{ width:'100%',background:'none',border:'1px solid rgba(200,57,43,.3)',borderRadius:3,color:'var(--red2)',cursor:'pointer',fontSize:12,padding:'11px',opacity:cancelLoading?0.6:1 }}>
                {cancelLoading?'Annulation...':'Arreter le prelevement automatique'}
              </button>
            )}
          </div>
        </div>
      )}

      <header style={{ background:'rgba(3,3,3,.96)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(20px)',position:'sticky',top:0,zIndex:100 }}>
        <div className="db-header" style={{ width:'100%',padding:'0 20px',height:52,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8 }}>
          <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:14,letterSpacing:3,color:'var(--white)',flexShrink:0 }}>
            A.<span style={{ color:'var(--red)' }}>A</span>
          </Link>
          <nav style={{ display:'flex',flex:1,height:'100%',alignItems:'stretch',overflow:'hidden' }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={'tab-btn'+(tab===t.id?' active':'')}
                style={{ background:'none',border:'none',borderBottom:'2px solid transparent',color:tab===t.id?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:11,fontWeight:500,padding:'0 10px',flex:1,maxWidth:100 }}>
                {t.label}
              </button>
            ))}
          </nav>
          <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
            <div className="db-credits" style={{ display:'flex',gap:5 }}>
              {isSubscribed && (
                <>
                  <div style={{ background:'var(--s2)',border:'1px solid var(--border)',borderRadius:2,padding:'3px 7px',fontSize:10,color:'var(--muted2)' }}>
                    ✍<span style={{ color:'var(--gold2)',fontWeight:700,marginLeft:3 }}>{annoncesLeft}</span>
                  </div>
                  <div style={{ background:'var(--s2)',border:'1px solid var(--border)',borderRadius:2,padding:'3px 7px',fontSize:10,color:'var(--muted2)' }}>
                    ◎<span style={{ color:'var(--gold2)',fontWeight:700,marginLeft:3 }}>{reponsesLeft}</span>
                  </div>
                </>
              )}
            </div>
            {isSubscribed ? (
              <span style={{ fontFamily:'var(--font-label)',fontSize:8,letterSpacing:1.5,color:'var(--gold2)',background:'rgba(201,168,76,.08)',border:'1px solid var(--gold-border)',borderRadius:2,padding:'3px 7px',cursor:'pointer' }}
                onClick={()=>setShowSubModal(true)}>
                {isPremium?'PREMIUM':'SUB'}
              </span>
            ) : (
              <button onClick={()=>subscribe('business')} className="btn-primary" style={{ fontSize:10,padding:'6px 10px',letterSpacing:1 }}>
                Abonner
              </button>
            )}
            <button onClick={logout} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted)',cursor:'pointer',fontSize:10,padding:'5px 8px' }}>
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="db-main" style={{ flex:1,maxWidth:920,margin:'0 auto',width:'100%',padding:'28px 20px 80px' }}>

        {tab==='home' && (
          <div className="db-fade">
            {/* Bannière lancement gratuit */}
            <LaunchBanner />
            <div style={{ marginBottom:24 }}>
              <div className="label" style={{ marginBottom:8 }}>Espace personnel</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,36px)',fontWeight:400,letterSpacing:-.5 }}>
                Bonjour, <span style={{ fontStyle:'italic',fontWeight:600 }}>{user.name||user.email.split('@')[0]}</span>
              </h1>
            </div>
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:3,padding:'12px 18px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:7,height:7,borderRadius:'50%',background:isSubscribed?'var(--gold)':'var(--muted)',animation:isSubscribed?'pulse 2s infinite':'none' }} />
                <span style={{ fontSize:13,color:'var(--muted3)' }}>
                  Plan <strong style={{ color:isSubscribed?'var(--gold2)':'var(--muted2)',fontFamily:'var(--font-label)',letterSpacing:1 }}>{PLAN_NAMES[planKey].toUpperCase()}</strong>
                  {isSubscribed&&planKey!=='premium'&&<span style={{ marginLeft:6,fontSize:11,color:'var(--muted)' }}>{PLAN_PRICES[planKey]} EUR/sem</span>}
                </span>
              </div>
              {isSubscribed
                ? <button onClick={()=>setShowSubModal(true)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:11,padding:'5px 12px' }}>Mon abonnement</button>
                : <button onClick={()=>subscribe('business')} className="btn-gold" style={{ fontSize:11,padding:'8px 16px',letterSpacing:1.5,color:'#030303' }}>S&apos;ABONNER</button>
              }
            </div>
            <div className="db-actions" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:16 }}>
              {[
                {title:'Creer',sub:'une annonce',t:'annonce',pro:true},
                {title:'Repondre',sub:'a un acheteur',t:'reponse',pro:true},
                {title:'Estimer',sub:'le prix',t:'estimation',pro:false},
              ].map(a=>(
                <div key={a.t} className="act-tile" onClick={()=>setTab(a.t)}
                  style={{ background:'var(--ink)',padding:'22px 14px',textAlign:'center',position:'relative' }}>
                  <div style={{ position:'absolute',top:7,right:8,fontFamily:'var(--font-label)',fontSize:7,letterSpacing:1,color:a.pro?'var(--gold3)':'var(--success2)' }}>
                    {a.pro?'Subscriber Only':'Gratuit'}
                  </div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,lineHeight:1 }}>{a.title}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:11,fontStyle:'italic',fontWeight:300,color:'var(--muted2)',marginTop:3 }}>{a.sub}</div>
                </div>
              ))}
            </div>
            <div className="db-grid2" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:16 }}>
              {[
                {label:'Annonces',val:usage.annonces,limit:limits.annonces,color:'var(--gold)',packRemaining:credits.annonces.remaining},
                {label:'Reponses',val:usage.reponses,limit:limits.reponses,color:'var(--red)',packRemaining:credits.reponses.remaining},
              ].map(s=>{
                const lim = s.limit===Infinity?999999:s.limit
                const pct = lim>0?Math.min((s.val/lim)*100,100):0
                return (
                  <div key={s.label} style={{ background:'var(--ink)',padding:'18px 20px' }}>
                    <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:.5,marginBottom:8,textTransform:'uppercase' }}>{s.label}</div>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:26,fontWeight:300,letterSpacing:-1,lineHeight:1,marginBottom:8 }}>
                      {isSubscribed
                        ? <span>{s.val}<span style={{ fontSize:12,color:'var(--muted2)' }}>/{s.limit===Infinity?'∞':s.limit}</span></span>
                        : <span style={{ color:s.packRemaining<=2?'var(--red2)':'var(--cream)' }}>{s.packRemaining}</span>
                      }
                    </div>
                    <div style={{ background:'var(--s3)',borderRadius:1,height:2,overflow:'hidden' }}>
                      <div style={{ width:pct+'%',height:'100%',background:pct>80?'var(--red)':s.color,transition:'width 1.2s' }} />
                    </div>
                    <div style={{ fontSize:10,color:'var(--muted)',marginTop:5 }}>
                      {isSubscribed?'Cette semaine · '+(s.limit===Infinity?'∞':Math.max(0,s.limit-s.val))+' restantes'
                        :(s.packRemaining===0?'Aucun credit':s.packRemaining+' restant(s)')}
                    </div>
                  </div>
                )
              })}
            </div>
            {!isSubscribed&&(
              <div style={{ border:'1px solid var(--gold-border)',borderRadius:3,padding:'18px 20px' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:17,fontWeight:600,marginBottom:3 }}>Passez a un abonnement</div>
                    <div style={{ fontSize:12,color:'var(--muted2)' }}>Starter 3,99 EUR · Business 5,99 EUR · Expert 12,99 EUR</div>
                  </div>
                  <button onClick={()=>setTab('tarifs')} className="btn-gold" style={{ fontSize:11,padding:'10px 20px',letterSpacing:1.5,flexShrink:0,color:'#030303' }}>VOIR LES TARIFS</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='analyser' && <AnalyserTab isSubscribed={isSubscribed} subscribe={subscribe} hasAccess={canAccessFeature(planKey,'analyser')} annonces={annonces} />}
        {tab==='ventes' && <VentesTab isSubscribed={isSubscribed} subscribe={subscribe} hasAccess={canAccessFeature(planKey,'ventes')} annonces={annonces} />}
        {tab==='chatbots' && <ChatBotsTab />}
        {tab==='annonce' && <AnnonceTab isSubscribed={isSubscribed} planKey={planKey} credits={credits} subscribe={subscribe} onUsed={()=>setUsage(u=>({...u,annonces:u.annonces+1}))} />}
        {tab==='reponse' && <ReponseTab isSubscribed={isSubscribed} subscribe={subscribe} onUsed={()=>setUsage(u=>({...u,reponses:u.reponses+1}))} />}
        {tab==='estimation' && <EstimationTab annonces={annonces} />}
        {tab==='outils' && <OutilsTab isSubscribed={isSubscribed} subscribe={subscribe} planKey={planKey} />}
        {tab==='historique' && <HistoriqueTab />}
        {tab==='tarifs' && <TarifsTab isSubscribed={isSubscribed} planKey={planKey} subscribe={subscribe} openSubModal={()=>setShowSubModal(true)} />}
        {tab==='profil' && <ProfilTab user={user} isSubscribed={isSubscribed} isPremium={isPremium} planKey={planKey} subscribe={subscribe} openSubModal={()=>setShowSubModal(true)} usage={usage} credits={credits} purchases={purchases} limits={limits} />}
      </main>
    </div>
  )
}

function AnnonceTab({ isSubscribed, credits, subscribe, onUsed }) {
  const [categorie, setCategorie] = useState('')
  const [form, setForm] = useState({})
  const [result, setResult] = useState(null)
  const [badResult, setBadResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fields = categorie ? CATEGORIES[categorie] : []
  const filled = Object.values(form).filter(v=>v&&v!=='Non').length
  const pct = Math.round((filled/Math.max(fields.length,1))*100)
  const hasAccess = isSubscribed || credits.annonces.remaining>0

  const generate = async () => {
    if (!categorie) { alert('Choisissez une categorie'); return }
    setLoading(true)
    try {
      const specs = 'Categorie: '+categorie+'\n'+Object.entries(form).filter(([,v])=>v).map(([k,v])=>k+': '+v).join('\n')
      const res = await fetch('/api/ai/annonce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs,lang:'fr',urgence:form.urgence||'normal',type:categorie,inputData:form})})
      const data = await res.json()
      setResult(data)
      if (data.annonce) setBadResult({ titre:form.marque&&form.modele?form.marque+' '+form.modele+' a vendre':'Article a vendre', description:'Je vends cet article. Il est en bon etat. Prix: '+(form.prix||'?')+' EUR.', score:Math.floor(Math.random()*20)+15 })
      if (!data.error) onUsed()
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (!hasAccess) return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Outil IA</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Creer une annonce</h2></div>
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:1 }}>
          {CATEGORY_LIST.slice(0,6).map(c=>(<div key={c} style={{ background:'var(--ink)',padding:'12px',textAlign:'center',fontSize:12,color:'var(--muted2)' }}>{c}</div>))}
        </div>
        <div style={{ background:'var(--ink)',height:100,marginBottom:1 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Outil IA</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Creer une annonce</h2></div>
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:1 }}>
        <div style={S.lbl}>Categorie *</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:5,marginTop:6 }}>
          {CATEGORY_LIST.map(c=>(
            <button key={c} onClick={()=>{setCategorie(c);setForm({})}}
              style={{ background:categorie===c?'rgba(201,168,76,.12)':'var(--ink)',border:'1px solid',borderColor:categorie===c?'var(--gold)':'var(--border)',borderRadius:3,color:categorie===c?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:11,padding:'7px 5px',fontWeight:categorie===c?600:400 }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {categorie&&(
        <>
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'8px 18px',marginBottom:1,display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                <span style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1 }}>Formulaire</span>
                <span style={{ fontSize:11,color:'var(--gold2)',fontWeight:600 }}>{pct}%</span>
              </div>
              <div style={{ background:'var(--s3)',borderRadius:1,height:2 }}>
                <div style={{ width:pct+'%',height:'100%',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',transition:'width .4s' }} />
              </div>
            </div>
            <div style={{ fontSize:10,color:'var(--muted)',flexShrink:0 }}>Plus = mieux</div>
          </div>
          <div className="db-form-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:1 }}>
            {fields.map(f=>(
              <div key={f.key} style={{ background:'var(--ink)',padding:'14px 18px',gridColumn:f.wide?'1/-1':'auto' }}>
                <label style={S.lbl}>{f.label}</label>
                {f.type==='select'
                  ? <select style={{ ...S.inp,appearance:'none',cursor:'pointer' }} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})}>
                      <option value="">Selectionner</option>
                      {f.opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  : f.wide
                    ? <textarea style={{ ...S.inp,resize:'vertical',minHeight:52,lineHeight:1.6 }} placeholder={f.ph} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} />
                    : f.type==='urgence'
                      ? <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginTop:4 }}>
                          {[['normal','Normal'],['rapide','Rapide'],['optimise','Max prix']].map(([v,l])=>(
                            <div key={v} onClick={()=>setForm({...form,urgence:v})}
                              style={{ background:form.urgence===v?'rgba(201,168,76,.08)':'var(--s2)',borderBottom:form.urgence===v?'2px solid var(--gold)':'2px solid transparent',padding:'7px',textAlign:'center',fontSize:11,color:form.urgence===v?'var(--gold2)':'var(--muted2)',cursor:'pointer' }}>
                              {l}
                            </div>
                          ))}
                        </div>
                      : <input style={S.inp} type={f.type||'text'} placeholder={f.ph} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} />
                }
              </div>
            ))}
          </div>
          <button onClick={generate} disabled={loading} className="btn-primary"
            style={{ width:'100%',fontSize:13,padding:'15px',opacity:loading?0.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:1 }}>
            {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Generation...</>:'GENERER MON ANNONCE'}
          </button>
        </>
      )}
      {result&&!result.error&&(
        <div style={{ marginTop:16 }}>
          {badResult&&(
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:14 }}>
              <div style={{ background:'rgba(200,57,43,.06)',padding:'14px 18px',borderTop:'2px solid var(--red)' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                  <span style={{ fontSize:10,color:'var(--red2)',textTransform:'uppercase',letterSpacing:1 }}>Annonce faible</span>
                  <span style={{ fontFamily:'var(--font-label)',fontSize:20,color:'var(--red2)' }}>{badResult.score}/100</span>
                </div>
                <div style={{ fontSize:13,fontWeight:600,marginBottom:5,color:'var(--muted3)' }}>{badResult.titre}</div>
                <div style={{ fontSize:12,color:'var(--muted)',lineHeight:1.6 }}>{badResult.description}</div>
              </div>
              <div style={{ background:'rgba(45,122,79,.06)',padding:'14px 18px',borderTop:'2px solid var(--success2)' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                  <span style={{ fontSize:10,color:'var(--success2)',textTransform:'uppercase',letterSpacing:1 }}>Annonce optimisee</span>
                  <span style={{ fontFamily:'var(--font-label)',fontSize:20,color:'var(--success2)' }}>{result.score?.score||85}/100</span>
                </div>
                <div style={{ fontSize:13,fontWeight:600,marginBottom:5 }}>{result.annonce?.titre||'Titre genere'}</div>
                <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.6 }}>{(result.annonce?.description||'').slice(0,100)}...</div>
              </div>
            </div>
          )}
          {result.annonce?.titre&&(
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'14px 18px',marginBottom:1 }}>
              <div style={S.lbl}>Titre</div>
              <div style={{ fontFamily:'var(--font-display)',fontSize:17,fontWeight:600,lineHeight:1.4 }}>{result.annonce.titre}</div>
            </div>
          )}
          {[['Description',result.annonce?.description],['Points forts',result.annonce?.pointsForts],['Transparence',result.annonce?.defauts],['Prix conseille',result.annonce?.prixConseil]].filter(([,v])=>v).map(([label,val])=>(
            <div key={label} style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:1 }}>
              <div style={S.lbl}>{label}</div>
              <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{val}</div>
            </div>
          ))}
          {result.annonce?.shortVersion&&(
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--red)',padding:'14px 18px',marginBottom:1 }}>
              <div style={S.lbl}>Version courte - Facebook / SMS</div>
              <div style={{ fontSize:13,color:'var(--muted3)',lineHeight:1.8,fontStyle:'italic',whiteSpace:'pre-wrap' }}>{result.annonce.shortVersion}</div>
            </div>
          )}
          <button className="copy-btn"
            onClick={()=>{navigator.clipboard.writeText(result.raw||'');setCopied(true);setTimeout(()=>setCopied(false),2000)}}
            style={{ width:'100%',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:2,color:copied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:12,fontWeight:500,padding:'11px',marginTop:1 }}>
            {copied?'Copie !':'Copier l\'annonce complete'}
          </button>
        </div>
      )}
    </div>
  )
}

function ReponseTab({ isSubscribed, subscribe, onUsed }) {
  const [message, setMessage] = useState('')
  const [contexte, setContexte] = useState('')
  const [annonces, setAnnonces] = useState([])
  const [selectedAnnonce, setSelectedAnnonce] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(()=>{
    if (!isSubscribed) return
    fetch('/api/dashboard/annonces').then(r=>r.json()).then(d=>setAnnonces(d.annonces||[])).catch(()=>{})
  },[])

  if (!isSubscribed) return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Outil IA</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Repondre a un acheteur</h2></div>
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'16px',height:100,marginBottom:1 }} />
        <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'16px',height:70 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  const generate = async () => {
    if (!message) return
    setLoading(true)
    try {
      const ctx = selectedAnnonce ? 'Annonce: '+selectedAnnonce.titre+'\n'+contexte : contexte
      const res = await fetch('/api/ai/reponse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,contexte:ctx,annonceId:selectedAnnonce?.id||null})})
      const data = await res.json()
      if (data.error) setResult({error:data.error,message:data.message||data.error})
      else { setResult(data); onUsed() }
    } catch(e) { setResult({error:'Erreur reseau: '+e.message}) }
    finally { setLoading(false) }
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Outil IA</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Repondre a un acheteur</h2></div>
      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:1 }}>
        <label style={S.lbl}>Message recu *</label>
        <textarea style={{ ...S.inp,minHeight:90,resize:'vertical',lineHeight:1.7 }} placeholder="Collez ici le message de l'acheteur..." value={message} onChange={e=>setMessage(e.target.value)} />
      </div>
      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:1 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
          <label style={{ ...S.lbl,marginBottom:0 }}>Lier une annonce (optionnel)</label>
          <button onClick={()=>setShowSearch(!showSearch)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:10,padding:'3px 8px' }}>
            {showSearch?'Masquer':'+ Lier'}
          </button>
        </div>
        {showSearch&&annonces.length>0&&(
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:3,marginBottom:8,maxHeight:160,overflowY:'auto' }}>
            {annonces.map(a=>(
              <div key={a.id} onClick={()=>{setSelectedAnnonce(a);setShowSearch(false);setContexte('Annonce: '+a.titre)}} className="hover-row"
                style={{ padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:selectedAnnonce?.id===a.id?'rgba(201,168,76,.06)':'transparent' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--cream)' }}>{a.titre||'Sans titre'}</div>
                <div style={{ fontSize:10,color:'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}
          </div>
        )}
        {selectedAnnonce&&(
          <div style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(201,168,76,.06)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'5px 10px',marginBottom:7,fontSize:11 }}>
            <span style={{ color:'var(--gold2)' }}>v</span>
            <span style={{ color:'var(--cream)',flex:1 }}>{selectedAnnonce.titre}</span>
            <button onClick={()=>{setSelectedAnnonce(null);setContexte('')}} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14 }}>x</button>
          </div>
        )}
        <textarea style={{ ...S.inp,minHeight:50,resize:'vertical',lineHeight:1.7 }} placeholder="Ou decrivez le contexte..." value={contexte} onChange={e=>setContexte(e.target.value)} />
      </div>
      <button onClick={generate} disabled={loading||!message} className="btn-primary"
        style={{ width:'100%',fontSize:13,padding:'15px',opacity:(loading||!message)?0.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
        {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Generation...</>:'GENERER LA REPONSE'}
      </button>
      {result?.error&&(
        <div style={{ background:'rgba(200,57,43,.08)',border:'1px solid rgba(200,57,43,.3)',borderRadius:3,padding:'12px 18px',marginTop:14,fontSize:13,color:'var(--red2)' }}>
          Erreur: {result.message||result.error}
        </div>
      )}
      {result?.reponse&&(
        <div style={{ marginTop:16 }}>
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'18px',marginBottom:1 }}>
            <div style={S.lbl}>Reponse prete a copier</div>
            <div style={{ fontSize:14,color:'var(--cream)',lineHeight:1.85,whiteSpace:'pre-wrap' }}>{result.reponse.reponsePrete}</div>
          </div>
          {result.reponse.suggestion&&(
            <div style={{ background:'var(--ink)',border:'1px solid var(--border)',borderLeft:'3px solid var(--red)',padding:'14px 18px',marginBottom:1 }}>
              <div style={S.lbl}>Conseil de negociation</div>
              <div style={{ fontSize:13,color:'var(--muted3)',lineHeight:1.7,fontStyle:'italic' }}>{result.reponse.suggestion}</div>
            </div>
          )}
          <button className="copy-btn"
            onClick={()=>{navigator.clipboard.writeText(result.reponse.reponsePrete);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
            style={{ width:'100%',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:2,color:copied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:12,fontWeight:500,padding:'11px',marginTop:1 }}>
            {copied?'Copie !':'Copier la reponse'}
          </button>
        </div>
      )}
    </div>
  )
}

function EstimationTab({ annonces = [] }) {
  const [specs, setSpecs] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedAnnonce, setSelectedAnnonce] = useState(null)

  const estimate = async () => {
    if (!specs) return
    setLoading(true)
    const res = await fetch('/api/ai/estimation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs})})
    const data = await res.json()
    if (data.error&&data.upgrade) { alert(data.message); setLoading(false); return }
    setResult(data); setLoading(false)
  }
  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Outil gratuit</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Estimer le prix</h2></div>
      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:1 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
          <label style={{ ...S.lbl,marginBottom:0 }}>Decrivez votre article</label>
          {annonces.length>0 && (
            <button onClick={()=>setShowSearch(!showSearch)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:10,padding:'3px 8px' }}>
              {showSearch?'Masquer':'+ Lier une annonce'}
            </button>
          )}
        </div>
        {showSearch && annonces.length>0 && (
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:3,marginBottom:8,maxHeight:150,overflowY:'auto' }}>
            {annonces.filter(a=>a.type!=='estimation').map(a=>(
              <div key={a.id} onClick={()=>{ setSelectedAnnonce(a); setSpecs(Object.entries(a.inputData||{}).filter(([,v])=>v).map(([k,v])=>k+': '+v).join(', ')); setShowSearch(false) }}
                className="hover-row" style={{ padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:selectedAnnonce?.id===a.id?'rgba(201,168,76,.06)':'transparent' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--cream)' }}>{a.titre||'Sans titre'}</div>
                <div style={{ fontSize:10,color:'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}
          </div>
        )}
        {selectedAnnonce && (
          <div style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(201,168,76,.06)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'5px 10px',marginBottom:7,fontSize:11 }}>
            <span style={{ color:'var(--gold2)' }}>✦</span>
            <span style={{ color:'var(--cream)',flex:1 }}>{selectedAnnonce.titre}</span>
            <button onClick={()=>{setSelectedAnnonce(null);setSpecs('')}} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14 }}>x</button>
          </div>
        )}
        <textarea style={{ ...S.inp,minHeight:110,resize:'vertical',lineHeight:1.7 }} placeholder="Ex: iPhone 15 Pro 256Go noir, tres bon etat, batterie 94%, avec boite..." value={specs} onChange={e=>setSpecs(e.target.value)} />
        <div style={{ fontSize:10,color:'var(--muted)',marginTop:5 }}>3 estimations gratuites par jour</div>
      </div>
      <button onClick={estimate} disabled={loading||!specs} className="btn-primary"
        style={{ width:'100%',fontSize:13,padding:'15px',opacity:(loading||!specs)?0.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
        {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Analyse...</>:'ESTIMER LE PRIX'}
      </button>
      {result&&!result.error&&(
        <div style={{ marginTop:16 }}>
          <div className="db-grid3" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)' }}>
            {[['Basse',result.low,'var(--red2)'],['Moyenne',result.mid,'var(--gold2)'],['Haute',result.high,'var(--success2)']].map(([label,val,color])=>(
              <div key={label} style={{ background:'var(--ink)',padding:'22px 18px',textAlign:'center' }}>
                <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:8 }}>{label}</div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:24,fontWeight:600,color,letterSpacing:-1 }}>{Number(val).toLocaleString('fr-FR')} EUR</div>
              </div>
            ))}
          </div>
          {result.note&&(
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'12px 18px',marginTop:1 }}>
              <div style={{ fontSize:12,color:'var(--muted2)',fontStyle:'italic',lineHeight:1.65 }}>{result.note}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OutilsTab({ isSubscribed, subscribe, planKey }) {
  const [activeTool, setActiveTool] = useState(null)
  const [titreSpecs, setTitreSpecs] = useState('')
  const [titres, setTitres] = useState([])
  const [titreLoading, setTitreLoading] = useState(false)
  const [prixArticle, setPrixArticle] = useState('')
  const [prixDemande, setPrixDemande] = useState('')
  const [prixResult, setPrixResult] = useState(null)
  const [prixLoading, setPrixLoading] = useState(false)
  const [flashSpecs, setFlashSpecs] = useState('')
  const [flashResult, setFlashResult] = useState(null)
  const [flashLoading, setFlashLoading] = useState(false)
  const [checklist, setChecklist] = useState({ photos:false, prix:false, description:false, disponible:false, contact:false, ct:false })
  const [annonceText, setAnnonceText] = useState('')
  const [tradLang, setTradLang] = useState('en')
  const [tradResult, setTradResult] = useState('')
  const [tradLoading, setTradLoading] = useState(false)
  // Arnaque
  const [arnaqueMsg, setArnaqueMsg] = useState('')
  const [arnaqueResult, setArnaqueResult] = useState(null)
  const [arnaqueLoading, setArnaqueLoading] = useState(false)
  // Calendrier
  const [calCat, setCalCat] = useState('')
  const [calArticle, setCalArticle] = useState('')
  const [calResult, setCalResult] = useState(null)
  const [calLoading, setCalLoading] = useState(false)
  // Plateformes
  const [platArticle, setPlatArticle] = useState('')
  const [platPrix, setPlatPrix] = useState('')
  const [platResult, setPlatResult] = useState(null)
  const [platLoading, setPlatLoading] = useState(false)
  // Lot
  const [lotObjets, setLotObjets] = useState([{nom:'',prix:'',etat:''},{nom:'',prix:'',etat:''}])
  const [lotPrix, setLotPrix] = useState('')
  const [lotContexte, setLotContexte] = useState('')
  const [lotResult, setLotResult] = useState(null)
  const [lotLoading, setLotLoading] = useState(false)
  const [lotCopied, setLotCopied] = useState(false)

  const tradLangs = { en:'Anglais', es:'Espagnol', de:'Allemand', it:'Italien', nl:'Neerlandais' }

  const checklistItems = [
    { key:'photos', label:'Au moins 5 photos claires en lumiere naturelle' },
    { key:'prix', label:'Prix correspond au marche (utiliser estimateur)' },
    { key:'description', label:'Description repond aux questions des acheteurs' },
    { key:'disponible', label:'Coordonnees et disponibilites sont claires' },
    { key:'contact', label:'Livraison ou remise en main propre precisee' },
    { key:'ct', label:'Documents importants mentionnes (CT, facture...)' },
  ]
  const checkScore = Object.values(checklist).filter(Boolean).length

  const genTitres = async () => {
    if (!titreSpecs) return
    setTitreLoading(true)
    try { const r = await fetch('/api/ai/titres',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs:titreSpecs})}); const d = await r.json(); setTitres(d.titres||[]) } catch(e) {}
    setTitreLoading(false)
  }

  const checkPrix = async () => {
    if (!prixArticle||!prixDemande) return
    setPrixLoading(true)
    try {
      const r = await fetch('/api/ai/estimation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs:prixArticle})})
      const d = await r.json()
      const prix = parseFloat(prixDemande)
      const diff = d.mid>0?Math.round(((prix-d.mid)/d.mid)*100):0
      setPrixResult({...d,prixDemande:prix,diff})
    } catch(e) {}
    setPrixLoading(false)
  }

  const genFlash = async () => {
    if (!flashSpecs) return
    setFlashLoading(true)
    try { const r = await fetch('/api/ai/annonce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs:flashSpecs,urgence:'rapide',type:'flash',inputData:{}})}); const d = await r.json(); setFlashResult(d) } catch(e) {}
    setFlashLoading(false)
  }

  const checkArnaque = async () => {
    if (!arnaqueMsg) return
    setArnaqueLoading(true)
    try { const r = await fetch('/api/ai/arnaque',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:arnaqueMsg})}); const d = await r.json(); setArnaqueResult(d) } catch(e) {}
    setArnaqueLoading(false)
  }

  const getCalendrier = async () => {
    if (!calCat) return
    setCalLoading(true)
    try { const r = await fetch('/api/ai/calendrier',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({categorie:calCat,article:calArticle})}); const d = await r.json(); setCalResult(d) } catch(e) {}
    setCalLoading(false)
  }

  const getPlateformes = async () => {
    if (!platArticle) return
    setPlatLoading(true)
    try { const r = await fetch('/api/ai/plateformes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({article:platArticle,prix:platPrix})}); const d = await r.json(); setPlatResult(d) } catch(e) {}
    setPlatLoading(false)
  }

  const addLotItem = () => setLotObjets(prev => [...prev, {nom:'',prix:'',etat:''}])
  const removeLotItem = (i) => setLotObjets(prev => prev.filter((_,idx)=>idx!==i))
  const updateLotItem = (i, key, val) => setLotObjets(prev => prev.map((o,idx)=>idx===i?{...o,[key]:val}:o))

  const genLot = async () => {
    const objetsValides = lotObjets.filter(o=>o.nom)
    if (objetsValides.length < 2) return
    setLotLoading(true)
    try { const r = await fetch('/api/ai/lot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({objets:objetsValides,prixTotal:lotPrix,contexte:lotContexte})}); const d = await r.json(); setLotResult(d) } catch(e) {}
    setLotLoading(false)
  }

  const genTrad = async () => {
    if (!annonceText) return
    setTradLoading(true)
    try { const r = await fetch('/api/ai/annonce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs:'Traduis cette annonce en '+tradLangs[tradLang]+': '+annonceText,lang:tradLang,urgence:'normal',type:'traduction',inputData:{}})}); const d = await r.json(); setTradResult(d.raw||'') } catch(e) {}
    setTradLoading(false)
  }

  const feats = (PLAN_FEATURES[planKey] || PLAN_FEATURES.free)
  const getBadge = (feat, minPlan) => {
    if (!isSubscribed) return minPlan || 'Starter+'
    if (feats[feat]) return 'Actif'
    return minPlan || 'Plan superieur'
  }

  const TOOLS = [
    {id:'titre',icon:'✍',label:'Generateur de titres',desc:'5 titres optimises en un clic pour maximiser les vues',badge:'Starter+',active:true},
    {id:'prix',icon:'📊',label:'Detecteur prix abusif',desc:'Verifiez si votre prix est aligne avec le marche',badge:'Starter+',active:true},
    {id:'calendrier',icon:'📅',label:'Calendrier optimal',desc:'Quel jour et heure publier pour maximiser les vues',badge:'Starter+',active:true},
    {id:'checklist',icon:'✅',label:'Checklist publication',desc:'6 points a verifier avant de publier',badge:'Starter+',active:true},
    {id:'arnaque',icon:'🚨',label:'Detecteur arnaque',desc:'Analysez un message suspect avant de repondre',badge:'Business+',active:feats.arnaque},
    {id:'plateformes',icon:'🔀',label:'Comparateur plateformes',desc:'LeBonCoin vs Vinted vs Facebook vs eBay',badge:'Business+',active:feats.plateformes},
    {id:'flash',icon:'⚡',label:'Mode vente flash',desc:'Annonce ultra-agressive pour vendre en moins de 48h',badge:'Business+',active:feats.flash},
    {id:'traduction',icon:'🌍',label:'Traduction annonce',desc:'Anglais, Espagnol, Allemand, Italien, Neerlandais',badge:'Business+',active:feats.traduction},
    {id:'lot',icon:'📦',label:'Mode lot',desc:'Vendez plusieurs objets ensemble en une seule annonce',badge:'Expert',active:feats.lot},
  ]

  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Boite a outils</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Outils supplementaires</h2></div>
      <div className="db-tools-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:14 }}>
        {TOOLS.map(tool=>(
          <div key={tool.id}
            onClick={()=>tool.active||!isSubscribed?setActiveTool(activeTool===tool.id?null:tool.id):null}
            style={{ background:activeTool===tool.id?'var(--s2)':'var(--ink)',padding:'18px',cursor:tool.active||!isSubscribed?'pointer':'not-allowed',transition:'all .2s',borderTop:activeTool===tool.id?'2px solid var(--gold)':'2px solid transparent',opacity:isSubscribed&&!tool.active?0.5:1 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7 }}>
              <span style={{ fontSize:22 }}>{tool.icon}</span>
              <span style={{ fontFamily:'var(--font-label)',fontSize:7,letterSpacing:1.5,
                color:tool.badge==='Starter+'?'var(--success2)':tool.badge==='Actif'?'var(--success2)':'var(--gold3)',
                background:tool.badge==='Starter+'||tool.badge==='Actif'?'rgba(45,122,79,.1)':'rgba(201,168,76,.1)',
                border:'1px solid',
                borderColor:tool.badge==='Starter+'||tool.badge==='Actif'?'rgba(45,122,79,.2)':'rgba(201,168,76,.2)',
                borderRadius:2,padding:'2px 6px' }}>{tool.badge}</span>
            </div>
            <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:600,marginBottom:3 }}>{tool.label}</div>
            <div style={{ fontSize:11,color:'var(--muted2)',lineHeight:1.5 }}>{tool.desc}</div>
          </div>
        ))}
      </div>

      {activeTool==='titre'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:1 }}>
          <div style={S.lbl}>Generateur de titres optimises</div>
          <textarea style={{ ...S.inp,minHeight:65,resize:'vertical',lineHeight:1.6,marginBottom:8 }} placeholder="Decrivez votre article: BMW 320d 2019, 75 000 km, diesel, bon etat..." value={titreSpecs} onChange={e=>setTitreSpecs(e.target.value)} />
          <button onClick={genTitres} disabled={titreLoading||!titreSpecs} className="btn-primary" style={{ width:'100%',fontSize:12,padding:'11px',opacity:(titreLoading||!titreSpecs)?0.5:1 }}>
            {titreLoading?'Generation...':'GENERER 5 TITRES'}
          </button>
          {titres.length>0&&(
            <div style={{ marginTop:10 }}>
              {titres.map((t,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--ink)',border:'1px solid var(--border)',padding:'9px 12px',marginBottom:3,gap:10 }}>
                  <div style={{ fontSize:13,color:'var(--cream)' }}>{t}</div>
                  <button onClick={()=>navigator.clipboard.writeText(t)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:10,padding:'3px 8px',flexShrink:0 }}>Copier</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTool==='prix'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:1 }}>
          <div style={S.lbl}>Detecteur de prix abusif</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:8 }}>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Votre article</label>
              <input style={S.inp} placeholder="BMW 320d 2019, 75 000 km..." value={prixArticle} onChange={e=>setPrixArticle(e.target.value)} />
            </div>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Votre prix (EUR)</label>
              <input style={S.inp} type="number" placeholder="12000" value={prixDemande} onChange={e=>setPrixDemande(e.target.value)} />
            </div>
          </div>
          <button onClick={checkPrix} disabled={prixLoading||!prixArticle||!prixDemande} className="btn-primary" style={{ width:'100%',fontSize:12,padding:'11px',opacity:(prixLoading||!prixArticle||!prixDemande)?0.5:1 }}>
            {prixLoading?'Analyse...':'ANALYSER MON PRIX'}
          </button>
          {prixResult&&(
            <div style={{ marginTop:10,background:prixResult.diff>30?'rgba(200,57,43,.08)':prixResult.diff>15?'rgba(255,165,0,.08)':'rgba(45,122,79,.08)',border:'1px solid',borderColor:prixResult.diff>30?'rgba(200,57,43,.3)':prixResult.diff>15?'rgba(255,165,0,.3)':'rgba(45,122,79,.3)',padding:'14px' }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:26,color:prixResult.diff>30?'var(--red2)':prixResult.diff>15?'var(--warning)':'var(--success2)',letterSpacing:-1,marginBottom:8 }}>
                {prixResult.diff>0?'+':''}{prixResult.diff}% {prixResult.diff>30?'TROP CHER':prixResult.diff>15?'Un peu eleve':'Prix correct'}
              </div>
              <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7 }}>
                Marche: {prixResult.low} - {prixResult.high} EUR (moy. {prixResult.mid} EUR)<br/>
                Votre prix: {prixResult.prixDemande} EUR
                {prixResult.diff>15&&<><br/>Conseil: baisser a {Math.round(prixResult.mid*1.05)} EUR pour vendre plus vite</>}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTool==='flash'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:1 }}>
          {!isSubscribed ? <LockOverlay subscribe={subscribe} /> : (
            <>
              <div style={{ fontSize:12,color:'var(--gold3)',marginBottom:10,lineHeight:1.6 }}>Annonce urgente avec prix attractif. Pour vendre en moins de 48h.</div>
              <textarea style={{ ...S.inp,minHeight:75,resize:'vertical',lineHeight:1.6,marginBottom:8 }} placeholder="Decrivez votre article + prix actuel + prix minimum..." value={flashSpecs} onChange={e=>setFlashSpecs(e.target.value)} />
              <button onClick={genFlash} disabled={flashLoading||!flashSpecs} className="btn-primary" style={{ width:'100%',fontSize:12,padding:'11px',opacity:(flashLoading||!flashSpecs)?0.5:1 }}>
                {flashLoading?'Generation...':'GENERER ANNONCE FLASH'}
              </button>
              {flashResult?.annonce&&(
                <div style={{ marginTop:10,background:'var(--ink)',border:'1px solid var(--border)',borderLeft:'3px solid var(--red)',padding:'14px' }}>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,marginBottom:7 }}>{flashResult.annonce.titre}</div>
                  <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.7,whiteSpace:'pre-wrap' }}>{flashResult.annonce.description}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTool==='checklist'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:1 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
            <div style={S.lbl}>Checklist avant publication</div>
            <div style={{ fontFamily:'var(--font-label)',fontSize:22,color:checkScore===6?'var(--success2)':'var(--gold2)',letterSpacing:-1 }}>{checkScore}/6</div>
          </div>
          <div style={{ background:'var(--s3)',borderRadius:1,height:4,marginBottom:14,overflow:'hidden' }}>
            <div style={{ width:(checkScore/6*100)+'%',height:'100%',background:checkScore===6?'var(--success2)':'linear-gradient(90deg,var(--gold3),var(--gold2))',transition:'width .4s' }} />
          </div>
          {checklistItems.map(item=>(
            <div key={item.key} onClick={()=>setChecklist(c=>({...c,[item.key]:!c[item.key]}))}
              style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--border)',cursor:'pointer' }}>
              <div style={{ width:18,height:18,borderRadius:3,border:'1px solid',borderColor:checklist[item.key]?'var(--gold)':'var(--border2)',background:checklist[item.key]?'rgba(201,168,76,.15)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,color:'var(--gold2)' }}>
                {checklist[item.key]?'v':''}
              </div>
              <div style={{ fontSize:13,color:checklist[item.key]?'var(--muted2)':'var(--cream)',textDecoration:checklist[item.key]?'line-through':'none',lineHeight:1.5 }}>{item.label}</div>
            </div>
          ))}
          {checkScore===6&&(
            <div style={{ marginTop:12,background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:3,padding:'11px',fontSize:13,color:'var(--success2)',textAlign:'center' }}>
              Votre annonce est prete a etre publiee !
            </div>
          )}
        </div>
      )}

      {activeTool==='arnaque'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:1 }}>
          <div style={S.lbl}>Detecteur d'arnaque acheteur</div>
          <div style={{ fontSize:12,color:'var(--muted2)',marginBottom:10,lineHeight:1.6 }}>Collez un message suspect. L'IA analyse les signaux d'arnaque connus sur LeBonCoin et Vinted.</div>
          <textarea style={{ ...S.inp,minHeight:90,resize:'vertical',lineHeight:1.6,marginBottom:8 }}
            placeholder="Collez ici le message de l'acheteur suspect..."
            value={arnaqueMsg} onChange={e=>setArnaqueMsg(e.target.value)} />
          <button onClick={checkArnaque} disabled={arnaqueLoading||!arnaqueMsg} className="btn-primary" style={{ width:'100%',fontSize:12,padding:'11px',opacity:(arnaqueLoading||!arnaqueMsg)?0.5:1 }}>
            {arnaqueLoading?'Analyse...':'ANALYSER CE MESSAGE'}
          </button>
          {arnaqueResult&&(
            <div style={{ marginTop:10,background:arnaqueResult.isArnaque?'rgba(200,57,43,.08)':arnaqueResult.isSuspect?'rgba(255,165,0,.08)':'rgba(45,122,79,.08)',border:'1px solid',borderColor:arnaqueResult.isArnaque?'rgba(200,57,43,.3)':arnaqueResult.isSuspect?'rgba(255,165,0,.3)':'rgba(45,122,79,.3)',padding:'16px' }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:20,color:arnaqueResult.isArnaque?'var(--red2)':arnaqueResult.isSuspect?'var(--warning)':'var(--success2)',letterSpacing:.5,marginBottom:8 }}>
                {arnaqueResult.isArnaque?'ARNAQUE PROBABLE':arnaqueResult.isSuspect?'MESSAGE SUSPECT':'SEMBLE LEGITIME'}
              </div>
              <div style={{ fontSize:12,color:'var(--cream)',lineHeight:1.7,marginBottom:8 }}>{arnaqueResult.explication}</div>
              {arnaqueResult.conseils&&<div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,fontStyle:'italic',borderTop:'1px solid var(--border)',paddingTop:8,marginTop:8 }}>{arnaqueResult.conseils}</div>}
            </div>
          )}
        </div>
      )}

      {activeTool==='calendrier'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:1 }}>
          <div style={S.lbl}>Calendrier de publication optimal</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:8 }}>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Categorie *</label>
              <select style={{ ...S.inp,appearance:'none',cursor:'pointer' }} value={calCat} onChange={e=>setCalCat(e.target.value)}>
                <option value="">Choisir...</option>
                {['Voiture','Telephone','Informatique','Mobilier','Electromenager','Vetements','Jeux video','Sport','Bijoux','Autre'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Article (optionnel)</label>
              <input style={S.inp} placeholder="iPhone 14, BMW 320d..." value={calArticle} onChange={e=>setCalArticle(e.target.value)} />
            </div>
          </div>
          <button onClick={getCalendrier} disabled={calLoading||!calCat} className="btn-primary" style={{ width:'100%',fontSize:12,padding:'11px',opacity:(calLoading||!calCat)?0.5:1 }}>
            {calLoading?'Analyse...':'TROUVER LE MEILLEUR MOMENT'}
          </button>
          {calResult&&!calResult.error&&(
            <div style={{ marginTop:10 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:8 }}>
                <div style={{ background:'var(--ink)',padding:'14px',textAlign:'center' }}>
                  <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>Meilleur jour</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:600,color:'var(--gold2)' }}>{calResult.meilleurJour}</div>
                </div>
                <div style={{ background:'var(--ink)',padding:'14px',textAlign:'center' }}>
                  <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>Meilleure heure</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:600,color:'var(--gold2)' }}>{calResult.meilleureHeure}</div>
                </div>
              </div>
              {calResult.raison&&<div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'12px 14px',fontSize:12,color:'var(--cream)',lineHeight:1.7,marginBottom:6 }}>{calResult.raison}</div>}
              {calResult.conseilSaison&&<div style={{ background:'var(--ink)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold3)',padding:'12px 14px',fontSize:12,color:'var(--muted2)',lineHeight:1.7,fontStyle:'italic' }}>{calResult.conseilSaison}</div>}
              {calResult.scoreMoment&&<div style={{ marginTop:8,fontSize:12,color:'var(--muted2)',textAlign:'center' }}>Publier maintenant : <strong style={{ color:'var(--gold2)' }}>{calResult.scoreMoment}</strong></div>}
            </div>
          )}
        </div>
      )}

      {activeTool==='plateformes'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:1 }}>
          <div style={S.lbl}>Comparateur de plateformes</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:8 }}>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Votre article *</label>
              <input style={S.inp} placeholder="iPhone 14 Pro 256Go noir..." value={platArticle} onChange={e=>setPlatArticle(e.target.value)} />
            </div>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Prix envisage (EUR)</label>
              <input style={S.inp} type="number" placeholder="450" value={platPrix} onChange={e=>setPlatPrix(e.target.value)} />
            </div>
          </div>
          <button onClick={getPlateformes} disabled={platLoading||!platArticle} className="btn-primary" style={{ width:'100%',fontSize:12,padding:'11px',opacity:(platLoading||!platArticle)?0.5:1 }}>
            {platLoading?'Comparaison...':'COMPARER LES PLATEFORMES'}
          </button>
          {platResult&&!platResult.error&&(
            <div style={{ marginTop:10 }}>
              {platResult.recommandation&&(
                <div style={{ background:'rgba(201,168,76,.08)',border:'1px solid var(--gold-border)',padding:'12px 14px',marginBottom:8,fontSize:13,color:'var(--cream)',lineHeight:1.7 }}>
                  <strong style={{ color:'var(--gold2)' }}>Recommandation :</strong> {platResult.recommandation}
                </div>
              )}
              {[
                ['LeBonCoin',platResult.leboncoin],
                ['Vinted',platResult.vinted],
                ['Facebook Marketplace',platResult.facebook],
                ['eBay',platResult.ebay],
              ].filter(([,v])=>v).map(([nom,texte])=>(
                <div key={nom} style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'12px 14px',marginBottom:4 }}>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:12,color:'var(--gold3)',letterSpacing:1,marginBottom:6 }}>{nom}</div>
                  <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,whiteSpace:'pre-line' }}>{texte}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTool==='lot'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:1 }}>
          {!isSubscribed ? <LockOverlay subscribe={subscribe} /> : (
            <>
              <div style={S.lbl}>Mode lot - plusieurs objets</div>
              <div style={{ fontSize:12,color:'var(--muted2)',marginBottom:12,lineHeight:1.6 }}>Minimum 2 objets. Le nom est obligatoire, le prix et l'etat sont optionnels.</div>
              {lotObjets.map((o,i)=>(
                <div key={i} style={{ display:'grid',gridTemplateColumns:'1fr 80px 100px 32px',gap:1,background:'var(--border)',marginBottom:4 }}>
                  <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                    <input style={{ ...S.inp,fontSize:13 }} placeholder={'Objet '+(i+1)+' *'} value={o.nom} onChange={e=>updateLotItem(i,'nom',e.target.value)} />
                  </div>
                  <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                    <input style={{ ...S.inp,fontSize:13 }} type="number" placeholder="Prix" value={o.prix} onChange={e=>updateLotItem(i,'prix',e.target.value)} />
                  </div>
                  <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                    <select style={{ ...S.inp,fontSize:11,appearance:'none' }} value={o.etat} onChange={e=>updateLotItem(i,'etat',e.target.value)}>
                      <option value="">Etat</option>
                      <option>Neuf</option><option>Comme neuf</option><option>Bon etat</option><option>Correct</option>
                    </select>
                  </div>
                  <button onClick={()=>removeLotItem(i)} disabled={lotObjets.length<=2}
                    style={{ background:'var(--ink)',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,opacity:lotObjets.length<=2?0.3:1 }}>x</button>
                </div>
              ))}
              <button onClick={addLotItem} style={{ background:'none',border:'1px dashed var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:11,padding:'8px',width:'100%',marginBottom:10 }}>
                + Ajouter un objet
              </button>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:8 }}>
                <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                  <label style={{ ...S.lbl,fontSize:9 }}>Prix lot propose (EUR)</label>
                  <input style={S.inp} type="number" placeholder="Laisser vide = IA suggere" value={lotPrix} onChange={e=>setLotPrix(e.target.value)} />
                </div>
                <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                  <label style={{ ...S.lbl,fontSize:9 }}>Contexte</label>
                  <select style={{ ...S.inp,appearance:'none',fontSize:13 }} value={lotContexte} onChange={e=>setLotContexte(e.target.value)}>
                    <option value="">Choisir...</option>
                    <option>Demenagement</option><option>Vide grenier</option><option>Lot coherent</option><option>Collection</option>
                  </select>
                </div>
              </div>
              <button onClick={genLot} disabled={lotLoading||lotObjets.filter(o=>o.nom).length<2} className="btn-primary"
                style={{ width:'100%',fontSize:12,padding:'11px',opacity:(lotLoading||lotObjets.filter(o=>o.nom).length<2)?0.5:1 }}>
                {lotLoading?'Generation...':'GENERER ANNONCE LOT'}
              </button>
              {lotResult&&!lotResult.error&&(
                <div style={{ marginTop:10 }}>
                  {lotResult.titre&&<div style={{ background:'var(--ink)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'12px 14px',marginBottom:4 }}>
                    <div style={S.lbl}>Titre</div>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:16,fontWeight:600 }}>{lotResult.titre}</div>
                  </div>}
                  {[['Description',lotResult.description],['Liste complete',lotResult.liste],['Economie acheteur',lotResult.economie],['Prix lot suggere',lotResult.prixLot]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l} style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'12px 14px',marginBottom:4 }}>
                      <div style={S.lbl}>{l}</div>
                      <div style={{ fontSize:12,color:'var(--cream)',lineHeight:1.7,whiteSpace:'pre-wrap' }}>{v}</div>
                    </div>
                  ))}
                  <button onClick={()=>{navigator.clipboard.writeText([lotResult.titre,lotResult.description,lotResult.liste,lotResult.prixLot].filter(Boolean).join('\n\n'));setLotCopied(true);setTimeout(()=>setLotCopied(false),2000)}}
                    style={{ width:'100%',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:2,color:lotCopied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:12,fontWeight:500,padding:'11px',marginTop:4 }}>
                    {lotCopied?'Copie !':"Copier l'annonce lot"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTool==='traduction'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:1 }}>
          {!isSubscribed ? <LockOverlay subscribe={subscribe} /> : (
            <>
              <div style={{ display:'flex',gap:7,marginBottom:10,flexWrap:'wrap' }}>
                {Object.entries(tradLangs).map(([code,nom])=>(
                  <button key={code} onClick={()=>setTradLang(code)}
                    style={{ background:tradLang===code?'rgba(201,168,76,.1)':'var(--ink)',border:'1px solid',borderColor:tradLang===code?'var(--gold)':'var(--border)',borderRadius:2,color:tradLang===code?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:11,padding:'5px 12px' }}>
                    {nom}
                  </button>
                ))}
              </div>
              <textarea style={{ ...S.inp,minHeight:90,resize:'vertical',lineHeight:1.6,marginBottom:8 }} placeholder="Collez votre annonce en francais ici..." value={annonceText} onChange={e=>setAnnonceText(e.target.value)} />
              <button onClick={genTrad} disabled={tradLoading||!annonceText} className="btn-primary" style={{ width:'100%',fontSize:12,padding:'11px',opacity:(tradLoading||!annonceText)?0.5:1 }}>
                {tradLoading?'Traduction...':'TRADUIRE EN '+(tradLangs[tradLang]||'').toUpperCase()}
              </button>
              {tradResult&&(
                <div style={{ marginTop:10,background:'var(--ink)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'14px' }}>
                  <div style={S.lbl}>Annonce traduite - {tradLangs[tradLang]}</div>
                  <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.75,whiteSpace:'pre-wrap' }}>{tradResult}</div>
                  <button onClick={()=>navigator.clipboard.writeText(tradResult)} style={{ marginTop:8,background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:11,padding:'5px 12px' }}>Copier</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function HistoriqueTab() {
  const [annonces, setAnnonces] = useState([])
  const [reponses, setReponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('annonces')
  const [expanded, setExpanded] = useState(null)

  useEffect(()=>{
    Promise.all([
      fetch('/api/dashboard/annonces').then(r=>r.json()),
      fetch('/api/dashboard/reponses').then(r=>r.json()),
    ]).then(([a,r])=>{ setAnnonces(a.annonces||[]); setReponses(r.reponses||[]); setLoading(false) }).catch(()=>setLoading(false))
  },[])

  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Mes creations</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Historique</h2></div>
      <div style={{ display:'flex',gap:1,background:'var(--border)',marginBottom:12 }}>
        {[['annonces','Annonces ('+annonces.length+')'],['reponses','Reponses ('+reponses.length+')']].map(([id,label])=>(
          <button key={id} onClick={()=>setSection(id)}
            style={{ flex:1,background:section===id?'var(--s1)':'var(--ink)',border:'none',borderBottom:section===id?'2px solid var(--gold)':'2px solid transparent',color:section===id?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500,padding:'11px' }}>
            {label}
          </button>
        ))}
      </div>
      {loading&&<div style={{ fontSize:13,color:'var(--muted2)',padding:20,textAlign:'center' }}>Chargement...</div>}
      {section==='annonces'&&!loading&&(
        annonces.length===0
          ? <div style={{ textAlign:'center',padding:36,color:'var(--muted2)',fontFamily:'var(--font-display)',fontStyle:'italic' }}>Aucune annonce generee</div>
          : annonces.map(a=>(
            <div key={a.id} style={{ background:'var(--ink)',border:'1px solid var(--border)',marginBottom:1 }}>
              <div style={{ padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,cursor:'pointer' }}
                onClick={()=>setExpanded(expanded===a.id?null:a.id)}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:600,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.titre||'Sans titre'}</div>
                  <div style={{ fontSize:11,color:'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                </div>
                <span style={{ fontSize:12,color:'var(--muted)',flexShrink:0,transform:expanded===a.id?'rotate(180deg)':'rotate(0deg)',transition:'transform .2s' }}>v</span>
              </div>
              {expanded===a.id&&(
                <div style={{ borderTop:'1px solid var(--border)',padding:'12px 18px',background:'var(--s1)' }}>
                  {a.description&&<div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.75,marginBottom:8,whiteSpace:'pre-wrap' }}>{a.description}</div>}
                  {a.pointsForts&&<div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,fontStyle:'italic' }}>{a.pointsForts}</div>}
                </div>
              )}
            </div>
          ))
      )}
      {section==='reponses'&&!loading&&(
        reponses.length===0
          ? <div style={{ textAlign:'center',padding:36,color:'var(--muted2)',fontFamily:'var(--font-display)',fontStyle:'italic' }}>Aucune reponse generee</div>
          : reponses.map(r=>(
            <div key={r.id} style={{ background:'var(--ink)',border:'1px solid var(--border)',marginBottom:1 }}>
              <div style={{ padding:'12px 18px',cursor:'pointer' }} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <div style={{ fontSize:11,color:'var(--muted2)',marginBottom:3 }}>Message: {r.messageAcheteur.slice(0,70)}...</div>
                <div style={{ fontSize:11,color:'var(--muted)',display:'flex',justifyContent:'space-between' }}>
                  <span>{new Date(r.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</span>
                  <span style={{ color:'var(--gold3)' }}>{expanded===r.id?'Masquer':'Voir la reponse'}</span>
                </div>
              </div>
              {expanded===r.id&&(
                <div style={{ borderTop:'1px solid var(--border)',padding:'12px 18px',background:'var(--s1)' }}>
                  <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{r.reponsePrete}</div>
                  {r.suggestion&&<div style={{ marginTop:8,fontSize:12,color:'var(--muted2)',fontStyle:'italic',borderTop:'1px solid var(--border)',paddingTop:8 }}>{r.suggestion}</div>}
                </div>
              )}
            </div>
          ))
      )}
    </div>
  )
}

function TarifsTab({ isSubscribed, planKey, subscribe, openSubModal }) {
  const PLANS = [
    {key:'starter',name:'Starter',price:'3,99',features:['10 annonces/semaine','30 reponses/semaine','Estimation prix (3/jour)','Generateur titres','Detecteur prix abusif','Checklist publication','Calendrier optimal']},
    {key:'business',name:'Business',price:'5,99',features:['30 annonces/semaine','100 reponses/semaine','Chatbot vendeur (50 msg/j)','Analyser une annonce','Detecteur arnaque','Comparateur plateformes','Mode flash + Traduction','Suivi des ventes','Tout Starter inclus'],recommended:true},
    {key:'expert',name:'Expert',price:'12,99',features:['Annonces illimitees','Reponses illimitees','Chatbot (200 msg/jour)','Mode lot multi-objets','Tout Business inclus','Acces prioritaire nouveautes']},
  ]
  const PACKS = [
    {name:'5 annonces',price:'9,99 EUR',unit:'2,00/ann.'},
    {name:'10 annonces',price:'17,99 EUR',unit:'1,80/ann.'},
    {name:'50 reponses',price:'14,99 EUR',unit:'0,30/rep.'},
    {name:'500 reponses',price:'39,99 EUR',unit:'0,08/rep.'},
  ]
  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Offres</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Tarifs</h2></div>
      <div className="db-plans-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:14 }}>
        {PLANS.map(plan=>{
          const isCurrent = planKey===plan.key||(planKey==='pro'&&plan.key==='business')
          return (
            <div key={plan.key} style={{ background:plan.recommended?'var(--s1)':'var(--ink)',padding:'22px 18px',position:'relative',borderTop:plan.recommended?'2px solid var(--gold)':'2px solid transparent' }}>
              {plan.recommended&&<div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%) translateY(-50%)',background:'var(--gold)',color:'#030303',fontFamily:'var(--font-label)',fontSize:7,letterSpacing:2,padding:'3px 8px',whiteSpace:'nowrap' }}>RECOMMANDE</div>}
              <div style={{ fontFamily:'var(--font-label)',fontSize:14,letterSpacing:2,marginBottom:4 }}>{plan.name}</div>
              <div style={{ fontFamily:'var(--font-label)',fontSize:28,color:plan.recommended?'var(--gold2)':'var(--cream)',letterSpacing:-2,lineHeight:1,marginBottom:12 }}>{plan.price}<span style={{ fontSize:11,color:'var(--muted2)',letterSpacing:0 }}> EUR/sem</span></div>
              <div style={{ marginBottom:14 }}>
                {plan.features.map(f=><div key={f} style={{ fontSize:11,color:'var(--muted2)',marginBottom:5,display:'flex',alignItems:'center',gap:5 }}><span style={{ color:plan.recommended?'var(--gold3)':'var(--muted)' }}>+</span>{f}</div>)}
              </div>
              {isCurrent&&isSubscribed
                ? <button onClick={openSubModal} style={{ width:'100%',background:'rgba(201,168,76,.1)',border:'1px solid var(--gold-border)',borderRadius:2,color:'var(--gold2)',cursor:'pointer',fontSize:11,padding:'9px',letterSpacing:1 }}>Plan actif - Gerer</button>
                : <button onClick={()=>subscribe(plan.key)} style={{ width:'100%',background:plan.recommended?'linear-gradient(135deg,var(--gold3),var(--gold2))':'none',border:plan.recommended?'none':'1px solid var(--border2)',borderRadius:2,color:plan.recommended?'#030303':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:11,letterSpacing:1.5,padding:'10px',transition:'all .2s' }}>
                    {isSubscribed?'Changer - '+plan.name:'Choisir '+plan.name}
                  </button>
              }
            </div>
          )
        })}
      </div>
      <div style={{ textAlign:'center',padding:'10px 0' }}><span style={{ fontSize:11,color:'var(--muted)',letterSpacing:2,textTransform:'uppercase' }}>ou packs a l\'unite</span></div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)' }}>
        {PACKS.map(p=>(
          <div key={p.name} style={{ background:'var(--ink)',padding:'18px' }}>
            <div style={{ fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,marginBottom:2 }}>{p.name}</div>
            <div style={{ fontSize:11,color:'var(--muted2)',marginBottom:12 }}>{p.unit} · Paiement unique</div>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:8 }}>
              <span style={{ fontFamily:'var(--font-label)',fontSize:18,color:'var(--muted3)',letterSpacing:-1 }}>{p.price}</span>
              <button className="btn-ghost" style={{ fontSize:11,padding:'6px 14px' }}>Acheter</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfilTab({ user, isSubscribed, isPremium, planKey, subscribe, openSubModal, usage, credits, purchases, limits }) {
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFAEnabled || false)
  const [toggling2FA, setToggling2FA] = useState(false)
  const [msg2FA, setMsg2FA] = useState('')

  const toggle2FA = async () => {
    setToggling2FA(true)
    try {
      const res = await fetch('/api/auth/toggle-2fa', { method:'POST' })
      const data = await res.json()
      if (data.success) { setTwoFAEnabled(data.enabled); setMsg2FA(data.enabled?'Double authentification activee':'Double authentification desactivee') }
    } catch(e) {}
    setToggling2FA(false)
    setTimeout(()=>setMsg2FA(''), 3000)
  }
  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Mon compte</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Profil</h2></div>
      <div className="db-grid2" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:1 }}>
        <div style={{ background:'var(--ink)',padding:'18px 20px' }}>
          <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:7 }}>Compte</div>
          <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:2 }}>{user.name||'Sans nom'}</div>
          <div style={{ fontSize:12,color:'var(--muted2)' }}>{user.email}</div>
        </div>
        <div style={{ background:'var(--ink)',padding:'18px 20px' }}>
          <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:7 }}>Plan actuel</div>
          <div style={{ fontFamily:'var(--font-label)',fontSize:20,letterSpacing:2,color:isSubscribed?'var(--gold2)':'var(--muted2)',marginBottom:2 }}>{PLAN_NAMES[planKey].toUpperCase()}</div>
          <div style={{ fontSize:11,color:'var(--muted)' }}>{isSubscribed&&!isPremium?PLAN_PRICES[planKey]+' EUR/semaine':isPremium?'Acces Premium':'Gratuit'}</div>
        </div>
      </div>
      <div className="db-grid3" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:1 }}>
        {[
          {val:usage.annonces,label:'Annonces',sub:'cette semaine'},
          {val:usage.reponses,label:'Reponses',sub:'cette semaine'},
          {val:limits.annonces===Infinity?'∞':limits.annonces,label:'Limite',sub:'ann./semaine'},
        ].map(s=>(
          <div key={s.label} style={{ background:'var(--s1)',padding:'16px',textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)',fontSize:24,fontWeight:300,letterSpacing:-1,lineHeight:1,marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1 }}>{s.label}</div>
            <div style={{ fontSize:9,color:'var(--muted)',marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px 20px',marginBottom:1 }}>
        <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:10 }}>Abonnement</div>
        {isSubscribed ? (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:14,color:'var(--cream)',marginBottom:2 }}>Plan {PLAN_NAMES[planKey]} actif{!isPremium?' · '+PLAN_PRICES[planKey]+' EUR/semaine':''}</div>
              {!isPremium&&<div style={{ fontSize:11,color:'var(--muted)' }}>Annulable a tout moment · Non remboursable</div>}
            </div>
            {!isPremium&&<button onClick={openSubModal} className="btn-ghost" style={{ fontSize:11 }}>Gerer</button>}
          </div>
        ) : (
          <div>
            <div style={{ fontSize:13,color:'var(--muted2)',marginBottom:10 }}>Plan gratuit · Abonnez-vous pour generer des annonces</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7 }}>
              {[['starter','Starter','3,99'],['business','Business','5,99'],['expert','Expert','12,99']].map(([key,name,price])=>(
                <button key={key} onClick={()=>subscribe(key)}
                  style={{ background:key==='business'?'linear-gradient(135deg,var(--gold3),var(--gold2))':'var(--s2)',border:'1px solid var(--border)',borderRadius:3,color:key==='business'?'#030303':'var(--muted2)',cursor:'pointer',padding:'9px 5px',fontSize:11 }}>
                  <div style={{ fontWeight:600,marginBottom:2 }}>{name}</div>
                  <div style={{ fontSize:12 }}>{price} EUR/sem</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Double authentification */}
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px 20px',marginBottom:1 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
          <div>
            <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:4 }}>Double authentification</div>
            <div style={{ fontSize:13,color:'var(--cream)',marginBottom:2 }}>
              {twoFAEnabled?'Activee — un code vous est envoye par email a chaque connexion':'Desactivee — connexion directe avec mot de passe'}
            </div>
            <div style={{ fontSize:11,color:'var(--muted)' }}>Recommande pour proteger votre compte</div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            {msg2FA && <span style={{ fontSize:11,color:twoFAEnabled?'var(--success2)':'var(--muted2)' }}>{msg2FA}</span>}
            <button onClick={toggle2FA} disabled={toggling2FA}
              style={{ background:twoFAEnabled?'rgba(45,122,79,.1)':'var(--s2)',border:'1px solid',borderColor:twoFAEnabled?'rgba(45,122,79,.3)':'var(--border2)',borderRadius:2,color:twoFAEnabled?'var(--success2)':'var(--muted2)',cursor:'pointer',fontSize:11,padding:'8px 16px',transition:'all .2s',opacity:toggling2FA?0.5:1 }}>
              {toggling2FA?'...':twoFAEnabled?'Desactiver':'Activer'}
            </button>
          </div>
        </div>
      </div>

      {isSubscribed&&!isPremium&&<ReferralSection />}
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px 20px',marginBottom:1 }}>
        <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:10 }}>Comment fonctionne le parrainage ?</div>
        {[
          '1. Copiez votre lien de parrainage personnel ci-dessus.',
          '2. Envoyez-le a un ami.',
          '3. Si votre ami prend le plan Starter ou plus, vous recevez 1 semaine Business gratuite.',
          '4. Votre ami beneficie aussi d\'une reduction.',
        ].map((s,i)=>(<div key={i} style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,marginBottom:5 }}>{s}</div>))}
      </div>
      {purchases&&purchases.length>0&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px 20px' }}>
          <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:12 }}>Historique des achats</div>
          {purchases.map(p=>(
            <div key={p.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--border)',gap:8 }}>
              <div>
                <div style={{ fontSize:13,color:'var(--cream)' }}>{p.packName}</div>
                <div style={{ fontSize:11,color:'var(--muted2)' }}>{new Date(p.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <div style={{ fontFamily:'var(--font-label)',fontSize:15,color:'var(--gold2)' }}>{p.amount} EUR</div>
                <div style={{ fontSize:10,color:'var(--muted2)' }}>{p.quantity} {p.packType}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



// ─── ANALYSER TAB (Idée D) ────────────────────────────────
function AnalyserTab({ isSubscribed, subscribe, hasAccess, annonces = [] }) {
  const [annonce, setAnnonce] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedAnnonce, setSelectedAnnonce] = useState(null)

  if (!isSubscribed || !hasAccess) return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Outil IA</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Analyser et ameliorer</h2></div>
      {isSubscribed && !hasAccess && <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'14px 18px',marginBottom:12,fontSize:13,color:'var(--muted2)' }}>Cette fonctionnalite necessite le plan Business ou superieur.</div>}
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:20,height:120,marginBottom:1 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  const analyse = async () => {
    if (!annonce || annonce.length < 20) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/analyser', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ annonce })
      })
      const data = await res.json()
      setResult(data)
    } catch(e) {}
    setLoading(false)
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}>
        <div className="label" style={{ marginBottom:6 }}>Outil IA</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Analyser et ameliorer</h2>
        <p style={{ fontSize:13,color:'var(--muted2)',marginTop:6,lineHeight:1.6 }}>Collez votre annonce existante. L'IA la note, identifie les problemes et la reecrit en mieux.</p>
      </div>

      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:1 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
          <label style={{ ...S.lbl,marginBottom:0 }}>Votre annonce actuelle *</label>
          {annonces.length>0 && (
            <button onClick={()=>setShowSearch(!showSearch)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:10,padding:'3px 8px' }}>
              {showSearch?'Masquer':'+ Importer une annonce'}
            </button>
          )}
        </div>
        {showSearch && (
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:3,marginBottom:8,maxHeight:150,overflowY:'auto' }}>
            {annonces.filter(a=>a.type!=='estimation').map(a=>(
              <div key={a.id} onClick={()=>{ setSelectedAnnonce(a); const txt = [a.titre, a.description, a.pointsForts, a.defauts].filter(Boolean).join('

'); setAnnonce(txt); setShowSearch(false) }}
                className="hover-row" style={{ padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:selectedAnnonce?.id===a.id?'rgba(201,168,76,.06)':'transparent' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--cream)' }}>{a.titre||'Sans titre'}</div>
                <div style={{ fontSize:10,color:'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}
          </div>
        )}
        {selectedAnnonce && (
          <div style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(201,168,76,.06)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'5px 10px',marginBottom:7,fontSize:11 }}>
            <span style={{ color:'var(--gold2)' }}>✦</span>
            <span style={{ color:'var(--cream)',flex:1 }}>{selectedAnnonce.titre}</span>
            <button onClick={()=>{setSelectedAnnonce(null);setAnnonce('')}} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14 }}>x</button>
          </div>
        )}
        <textarea style={{ ...S.inp,minHeight:160,resize:'vertical',lineHeight:1.7 }}
          placeholder="Collez ici votre annonce LeBonCoin, Vinted ou Facebook Marketplace..."
          value={annonce} onChange={e=>setAnnonce(e.target.value)} />
        <div style={{ fontSize:10,color:'var(--muted)',marginTop:5 }}>{annonce.length} caracteres</div>
      </div>

      <button onClick={analyse} disabled={loading||annonce.length<20} className="btn-primary"
        style={{ width:'100%',fontSize:13,padding:'15px',opacity:(loading||annonce.length<20)?0.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
        {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Analyse...</>:'ANALYSER MON ANNONCE'}
      </button>

      {result && (
        <div style={{ marginTop:16 }}>
          {/* Comparaison scores */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:1 }}>
            <div style={{ background:'rgba(200,57,43,.06)',padding:'20px',textAlign:'center',borderTop:'2px solid var(--red)' }}>
              <div style={{ fontSize:10,color:'var(--red2)',textTransform:'uppercase',letterSpacing:1,marginBottom:8 }}>Annonce originale</div>
              <div style={{ fontFamily:'var(--font-label)',fontSize:42,color:'var(--red2)',letterSpacing:-2,lineHeight:1 }}>{result.scoreOriginal}</div>
              <div style={{ fontSize:11,color:'var(--muted2)',marginTop:4 }}>sur 100</div>
            </div>
            <div style={{ background:'rgba(45,122,79,.06)',padding:'20px',textAlign:'center',borderTop:'2px solid var(--success2)' }}>
              <div style={{ fontSize:10,color:'var(--success2)',textTransform:'uppercase',letterSpacing:1,marginBottom:8 }}>Apres optimisation</div>
              <div style={{ fontFamily:'var(--font-label)',fontSize:42,color:'var(--success2)',letterSpacing:-2,lineHeight:1 }}>{result.scoreAmeliore}</div>
              <div style={{ fontSize:11,color:'var(--muted2)',marginTop:4 }}>sur 100 (+{result.scoreAmeliore-result.scoreOriginal} pts)</div>
            </div>
          </div>

          {result.problemes && (
            <div style={{ background:'rgba(200,57,43,.06)',border:'1px solid rgba(200,57,43,.2)',padding:'14px 18px',marginBottom:1 }}>
              <div style={S.lbl}>Problemes detectes</div>
              <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{result.problemes}</div>
            </div>
          )}

          {result.annonceAmelioree && (
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'16px 18px',marginBottom:1 }}>
              <div style={S.lbl}>Annonce optimisee</div>
              <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{result.annonceAmelioree}</div>
            </div>
          )}

          {result.conseils && (
            <div style={{ background:'var(--ink)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold3)',padding:'14px 18px',marginBottom:1 }}>
              <div style={S.lbl}>Conseils specifiques</div>
              <div style={{ fontSize:13,color:'var(--muted3)',lineHeight:1.8,fontStyle:'italic',whiteSpace:'pre-wrap' }}>{result.conseils}</div>
            </div>
          )}

          <button className="copy-btn"
            onClick={()=>{navigator.clipboard.writeText(result.annonceAmelioree||'');setCopied(true);setTimeout(()=>setCopied(false),2000)}}
            style={{ width:'100%',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:2,color:copied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:12,fontWeight:500,padding:'11px',marginTop:1 }}>
            {copied?'Copie !':"Copier l'annonce optimisee"}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── VENTES TAB (Idée E) ──────────────────────────────────
function VentesTab({ isSubscribed, subscribe }) {
  const [objets, setObjets] = useState([])
  const [stats, setStats] = useState({ vendu:0, totalGagne:0, enCours:0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre:'', prix:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [prixFinal, setPrixFinal] = useState('')

  const load = () => {
    fetch('/api/dashboard/ventes').then(r=>r.json()).then(d=>{
      setObjets(d.objets||[])
      setStats(d.stats||{ vendu:0,totalGagne:0,enCours:0 })
      setLoading(false)
    }).catch(()=>setLoading(false))
  }

  useEffect(()=>{ if(isSubscribed) { load() } else { setLoading(false) } },[isSubscribed])

  if (!isSubscribed) return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}><div className="label" style={{ marginBottom:6 }}>Suivi</div><h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Mes ventes</h2></div>
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:20,height:100,marginBottom:1 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  const addObjet = async () => {
    if (!form.titre||!form.prix) return
    setSaving(true)
    await fetch('/api/dashboard/ventes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    setForm({titre:'',prix:'',notes:''})
    setShowForm(false)
    setSaving(false)
    load()
  }

  const markVendu = async (id) => {
    if (!prixFinal) return
    await fetch('/api/dashboard/ventes',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,statut:'vendu',prixFinal})})
    setEditId(null)
    setPrixFinal('')
    load()
  }

  const deleteObjet = async (id) => {
    if (!confirm('Supprimer cet objet ?')) return
    await fetch('/api/dashboard/ventes?id='+id,{method:'DELETE'})
    load()
  }

  const STATUT_COLORS = { actif:'var(--gold2)', vendu:'var(--success2)', archive:'var(--muted)' }

  return (
    <div className="db-fade">
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div>
          <div className="label" style={{ marginBottom:6 }}>Suivi</div>
          <h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Mes ventes</h2>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-gold" style={{ fontSize:11,padding:'10px 18px',letterSpacing:1.5,color:'#030303' }}>
          + AJOUTER UN OBJET
        </button>
      </div>

      {/* Stats */}
      <div className="db-grid3" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:16 }}>
        {[
          {label:'En cours',val:stats.enCours,color:'var(--gold2)'},
          {label:'Vendus',val:stats.vendu,color:'var(--success2)'},
          {label:'Total gagne',val:stats.totalGagne.toLocaleString('fr-FR')+' EUR',color:'var(--gold2)'},
        ].map(s=>(
          <div key={s.label} style={{ background:'var(--ink)',padding:'18px',textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-label)',fontSize:26,color:s.color,letterSpacing:-1,lineHeight:1,marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',padding:'18px',marginBottom:14 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:1 }}>
            <div style={{ background:'var(--ink)',padding:'12px 16px' }}>
              <label style={S.lbl}>Nom de l'objet *</label>
              <input style={S.inp} placeholder="iPhone 14 Pro, BMW 320d..." value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})} />
            </div>
            <div style={{ background:'var(--ink)',padding:'12px 16px' }}>
              <label style={S.lbl}>Prix demande (EUR) *</label>
              <input style={S.inp} type="number" placeholder="450" value={form.prix} onChange={e=>setForm({...form,prix:e.target.value})} />
            </div>
          </div>
          {annonces.length>0 && (
            <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'12px 16px',marginBottom:1 }}>
              <label style={S.lbl}>Lier a une annonce (optionnel)</label>
              <select style={{ ...S.inp,appearance:'none',cursor:'pointer' }} value={form.annonceId||''} onChange={e=>setForm({...form,annonceId:e.target.value})}>
                <option value="">Aucune</option>
                {annonces.filter(a=>a.type!=='estimation').map(a=>(
                  <option key={a.id} value={a.id}>{a.titre||'Sans titre'}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'12px 16px',marginBottom:1 }}>
            <label style={S.lbl}>Notes (optionnel)</label>
            <input style={S.inp} placeholder="Mis en vente le 15 mai, 3 contacts..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          </div>
          <div style={{ display:'flex',gap:8,marginTop:1 }}>
            <button onClick={addObjet} disabled={saving||!form.titre||!form.prix} className="btn-primary" style={{ flex:2,fontSize:12,padding:'12px',opacity:(saving||!form.titre||!form.prix)?0.5:1 }}>
              {saving?'Ajout...':'AJOUTER'}
            </button>
            <button onClick={()=>setShowForm(false)} className="btn-ghost" style={{ flex:1,fontSize:12 }}>Annuler</button>
          </div>
        </div>
      )}

      {loading && <div style={{ fontSize:13,color:'var(--muted2)',padding:20,textAlign:'center' }}>Chargement...</div>}

      {!loading && objets.length === 0 && (
        <div style={{ textAlign:'center',padding:40,fontFamily:'var(--font-display)',fontStyle:'italic',color:'var(--muted2)' }}>
          Aucun objet suivi. Ajoutez vos articles en cours de vente.
        </div>
      )}

      {objets.map(o => (
        <div key={o.id} style={{ background:'var(--ink)',border:'1px solid var(--border)',marginBottom:1 }}>
          <div style={{ padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,marginBottom:3 }}>{o.titre}</div>
              <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'var(--font-label)',fontSize:12,letterSpacing:.5,
                    color:o.statut==='vendu'?'var(--success2)':o.statut==='actif'?'var(--gold2)':'var(--muted)',
                    background:o.statut==='vendu'?'rgba(45,122,79,.1)':o.statut==='actif'?'rgba(201,168,76,.1)':'var(--s2)',
                    border:'1px solid',borderColor:o.statut==='vendu'?'rgba(45,122,79,.3)':o.statut==='actif'?'var(--gold-border)':'var(--border)',
                    borderRadius:2,padding:'2px 8px' }}>
                    {o.statut==='vendu'?'Vendu':o.statut==='actif'?'En cours':'Archive'}
                  </span>
                  <span style={{ fontSize:12,color:'var(--cream)',fontWeight:600 }}>
                    {o.statut==='vendu'
                      ? o.prixFinal+' EUR'+(o.prixFinal!==o.prix?o.prixFinal>o.prix?' (+'+Math.round(o.prixFinal-o.prix)+' EUR)':' (-'+Math.round(o.prix-o.prixFinal)+' EUR)':'')
                      : o.prix+' EUR demandes'}
                  </span>
                </div>
                <span style={{ fontSize:10,color:'var(--muted)' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
              </div>
              {o.notes && <div style={{ fontSize:11,color:'var(--muted2)',marginTop:3,fontStyle:'italic' }}>{o.notes}</div>}
            </div>
            <div style={{ display:'flex',gap:6,flexShrink:0 }}>
              {o.statut === 'actif' && (
                editId === o.id ? (
                  <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                    <input style={{ ...S.inp,width:90,fontSize:13 }} type="number" placeholder="Prix final" value={prixFinal} onChange={e=>setPrixFinal(e.target.value)} />
                    <button onClick={()=>markVendu(o.id)} className="btn-gold" style={{ fontSize:10,padding:'6px 12px',color:'#030303' }}>OK</button>
                    <button onClick={()=>setEditId(null)} className="btn-ghost" style={{ fontSize:10,padding:'6px 10px' }}>x</button>
                  </div>
                ) : (
                  <button onClick={()=>setEditId(o.id)} className="btn-ghost" style={{ fontSize:10,padding:'6px 12px',color:'var(--success2)',borderColor:'rgba(45,122,79,.3)' }}>
                    Marquer vendu
                  </button>
                )
              )}
              <button onClick={()=>deleteObjet(o.id)} style={{ background:'none',border:'1px solid rgba(200,57,43,.2)',borderRadius:2,color:'var(--red2)',cursor:'pointer',fontSize:10,padding:'5px 10px' }}>
                Sup.
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── CHATBOTS TAB (Idée Q) ────────────────────────────────
function ChatBotsTab() {
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [annonces, setAnnonces] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedAnnonceId, setSelectedAnnonceId] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')

  useEffect(()=>{
    fetch('/api/chat/list').then(r=>r.json()).then(d=>{
      setBots(d.bots||[])
      setLoading(false)
    }).catch(()=>setLoading(false))
    fetch('/api/dashboard/annonces').then(r=>r.json()).then(d=>{
      setAnnonces((d.annonces||[]).filter(a=>a.type!=='estimation'))
    }).catch(()=>{})
  },[])

  const createBot = async () => {
    if (!selectedAnnonceId) return
    setCreating(true)
    try {
      const res = await fetch('/api/chat/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ annonceId: selectedAnnonceId })
      })
      const data = await res.json()
      if (data.chatBot) {
        setBots(prev => [data.chatBot, ...prev.filter(b=>b.id!==data.chatBot.id)])
        setShowCreate(false)
        setSelectedAnnonceId('')
        setCreateMsg('Assistant cree avec succes !')
        setTimeout(()=>setCreateMsg(''), 3000)
      }
    } catch(e) {}
    setCreating(false)
  }

  const copyLink = (code) => {
    const text = 'Des questions sur cet article ? Mon assistant repond instantanement : annonza.business/chat/' + code
    navigator.clipboard.writeText(text)
    setCopied(code)
    setTimeout(()=>setCopied(null), 2000)
  }

  const copyUrl = (code) => {
    navigator.clipboard.writeText('https://annonza.business/chat/'+code)
    setCopied(code+'url')
    setTimeout(()=>setCopied(null), 2000)
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}>
        <div className="label" style={{ marginBottom:6 }}>Chatbots vendeur</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Mes assistants</h2>
        <p style={{ fontSize:13,color:'var(--muted2)',marginTop:6,lineHeight:1.65 }}>
          Chaque annonce generee cree automatiquement un assistant IA. Copiez le texte et collez-le dans vos annonces LeBonCoin.
        </p>
      </div>

      {/* Bouton créer + formulaire */}
      <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:12 }}>
        <button onClick={()=>setShowCreate(!showCreate)} className="btn-gold" style={{ fontSize:11,padding:'10px 18px',letterSpacing:1.5,color:'#030303' }}>
          + CREER UN ASSISTANT
        </button>
      </div>

      {createMsg && (
        <div style={{ background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:3,padding:'10px 14px',marginBottom:12,fontSize:13,color:'var(--success2)' }}>
          {createMsg}
        </div>
      )}

      {showCreate && (
        <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',padding:'18px',marginBottom:16,borderTop:'2px solid var(--gold)' }}>
          <div style={{ fontFamily:'var(--font-display)',fontSize:16,fontWeight:600,marginBottom:14 }}>Creer un assistant pour une annonce</div>
          {annonces.length === 0 ? (
            <div style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.65 }}>
              Vous n'avez pas encore d'annonce. Generez une annonce dans l'onglet Annonce pour creer un assistant.
            </div>
          ) : (
            <>
              <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'12px 16px',marginBottom:8 }}>
                <label style={S.lbl}>Choisir une annonce *</label>
                <select style={{ ...S.inp,appearance:'none',cursor:'pointer' }} value={selectedAnnonceId} onChange={e=>setSelectedAnnonceId(e.target.value)}>
                  <option value="">Selectionner une annonce...</option>
                  {annonces.map(a=>(
                    <option key={a.id} value={a.id}>{a.titre||'Sans titre'} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</option>
                  ))}
                </select>
              </div>
              {selectedAnnonceId && (
                <div style={{ background:'rgba(201,168,76,.06)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'10px 14px',marginBottom:10,fontSize:12,color:'var(--muted2)',lineHeight:1.65 }}>
                  Un assistant IA sera cree pour cette annonce. Il pourra repondre aux questions des acheteurs 24h/24 avec toutes les infos de votre annonce.
                </div>
              )}
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={createBot} disabled={creating||!selectedAnnonceId} className="btn-primary" style={{ flex:2,fontSize:12,padding:'12px',opacity:(creating||!selectedAnnonceId)?0.5:1 }}>
                  {creating?'Creation...':'CREER L'ASSISTANT'}
                </button>
                <button onClick={()=>{setShowCreate(false);setSelectedAnnonceId('')}} className="btn-ghost" style={{ flex:1,fontSize:12 }}>Annuler</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Explication */}
      <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',borderLeft:'3px solid var(--gold)',padding:'14px 18px',marginBottom:16 }}>
        <div style={{ fontSize:12,color:'var(--cream)',lineHeight:1.7,marginBottom:8,fontWeight:600 }}>Comment ca marche ?</div>
        <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7 }}>
          1. Generez une annonce dans l'onglet Annonce<br/>
          2. Un assistant est cree automatiquement<br/>
          3. Copiez le texte ci-dessous et ajoutez-le a la fin de votre annonce LeBonCoin<br/>
          4. Les acheteurs tapent l'adresse dans leur navigateur et posent leurs questions directement<br/>
          5. L'IA repond 24h/24 avec toutes les infos de votre annonce
        </div>
      </div>

      {loading && <div style={{ fontSize:13,color:'var(--muted2)',padding:20,textAlign:'center' }}>Chargement...</div>}

      {!loading && bots.length === 0 && (
        <div style={{ textAlign:'center',padding:40,fontFamily:'var(--font-display)',fontStyle:'italic',color:'var(--muted2)' }}>
          Aucun assistant cree. Generez une annonce pour en creer un automatiquement.
        </div>
      )}

      {bots.map(bot => (
        <div key={bot.id} style={{ background:'var(--ink)',border:'1px solid var(--border)',marginBottom:1 }}>
          <div style={{ padding:'14px 18px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8 }}>
              <div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:600,marginBottom:2 }}>{bot.titre}</div>
                <div style={{ display:'flex',gap:10,alignItems:'center' }}>
                  <span style={{ fontFamily:'monospace',fontSize:10,color:'var(--muted2)',background:'var(--s3)',padding:'2px 8px' }}>{bot.code}</span>
                  <span style={{ fontSize:10,color:'var(--muted)' }}>{bot.nbQuestions} questions posees</span>
                  <span style={{ fontSize:10,color:bot.actif?'var(--success2)':'var(--muted)' }}>{bot.actif?'Actif':'Inactif'}</span>
                </div>
              </div>
            </div>

            {/* Texte a copier pour LeBonCoin */}
            <div style={{ background:'var(--s2)',border:'1px solid var(--border)',padding:'10px 14px',fontSize:12,color:'var(--cream)',lineHeight:1.6,marginBottom:10,borderRadius:3 }}>
              Des questions sur cet article ? Mon assistant repond instantanement : annonza.business/chat/{bot.code}
            </div>

            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              <button onClick={()=>copyLink(bot.code)}
                style={{ background:copied===bot.code?'rgba(201,168,76,.1)':'var(--s1)',border:'1px solid',borderColor:copied===bot.code?'var(--gold-border)':'var(--border2)',borderRadius:2,color:copied===bot.code?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:11,padding:'7px 14px',flex:1,transition:'all .15s' }}>
                {copied===bot.code?'Copie ! (texte LeBonCoin)':'Copier pour LeBonCoin'}
              </button>
              <button onClick={()=>copyUrl(bot.code)}
                style={{ background:'var(--s1)',border:'1px solid var(--border2)',borderRadius:2,color:copied===bot.code+'url'?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:11,padding:'7px 14px',transition:'all .15s' }}>
                {copied===bot.code+'url'?'Copie !':'Copier le lien seul'}
              </button>
              <a href={'/chat/'+bot.code} target="_blank" rel="noreferrer"
                style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:11,padding:'7px 14px',textDecoration:'none',display:'inline-flex',alignItems:'center' }}>
                Tester
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


function ScoreVendeur({ usage }) {
  const { points, niveau, prochainNiveau, pointsManquants, emoji } = (() => {
    let p = Math.min(usage.annonces * 10, 200) + Math.min(usage.reponses * 5, 150)
    let n = 'Debutant', pn = 'Vendeur', pm = Math.max(0, 50-p), em = '🌱'
    if (p >= 500) { n = 'Expert'; pn = null; em = '👑'; pm = 0 }
    else if (p >= 200) { n = 'Pro'; pn = 'Expert'; em = '⭐'; pm = 500-p }
    else if (p >= 50) { n = 'Vendeur'; pn = 'Pro'; em = '🔥'; pm = 200-p }
    return { points:p, niveau:n, prochainNiveau:pn, pointsManquants:pm, emoji:em }
  })()

  const maxPoints = niveau === 'Expert' ? 500 : prochainNiveau === 'Expert' ? 500 : prochainNiveau === 'Pro' ? 200 : 50
  const minPoints = niveau === 'Expert' ? 200 : niveau === 'Pro' ? 50 : niveau === 'Vendeur' ? 50 : 0
  const pct = Math.min(100, ((points - minPoints) / (maxPoints - minPoints)) * 100)

  return (
    <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:16,display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' }}>
      <div style={{ fontSize:28 }}>{emoji}</div>
      <div style={{ flex:1,minWidth:160 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
          <div>
            <span style={{ fontFamily:'var(--font-label)',fontSize:14,letterSpacing:1,color:'var(--gold2)' }}>{niveau}</span>
            {prochainNiveau && <span style={{ fontSize:10,color:'var(--muted)',marginLeft:8 }}>→ {prochainNiveau} dans {pointsManquants} pts</span>}
          </div>
          <span style={{ fontFamily:'var(--font-label)',fontSize:12,color:'var(--muted2)',letterSpacing:.5 }}>{points} pts</span>
        </div>
        <div style={{ background:'var(--s3)',borderRadius:1,height:3,overflow:'hidden' }}>
          <div style={{ width:Math.max(3,pct)+'%',height:'100%',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',transition:'width .8s' }} />
        </div>
      </div>
    </div>
  )
}

function LaunchBanner() {
  const [countdown, setCountdown] = useState(null)
  const LAUNCH_END = new Date('2026-06-30T23:59:59.000Z')

  useEffect(() => {
    const update = () => {
      const diff = LAUNCH_END - new Date()
      if (diff <= 0) { setCountdown(null); return }
      setCountdown({
        days: Math.floor(diff/(1000*60*60*24)),
        hours: Math.floor((diff%(1000*60*60*24))/(1000*60*60)),
        minutes: Math.floor((diff%(1000*60*60))/(1000*60)),
        seconds: Math.floor((diff%(1000*60))/1000),
      })
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  if (!countdown) return null

  return (
    <div style={{ background:'linear-gradient(90deg,var(--gold3),var(--gold2))',borderRadius:3,padding:'12px 18px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
      <div>
        <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:2,color:'#030303',marginBottom:2 }}>LANCEMENT GRATUIT</div>
        <div style={{ fontSize:12,color:'rgba(0,0,0,.7)' }}>Acces Business offert jusqu'au 30 juin 2026</div>
      </div>
      <div style={{ display:'flex',gap:6 }}>
        {[[countdown.days,'J'],[countdown.hours,'H'],[countdown.minutes,'M'],[countdown.seconds,'S']].map(([v,u])=>(
          <div key={u} style={{ background:'rgba(0,0,0,.15)',borderRadius:2,padding:'4px 8px',textAlign:'center',minWidth:36 }}>
            <div style={{ fontFamily:'var(--font-label)',fontSize:16,color:'#030303',letterSpacing:-1,lineHeight:1 }}>{String(v).padStart(2,'0')}</div>
            <div style={{ fontSize:8,color:'rgba(0,0,0,.5)',letterSpacing:1 }}>{u}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReferralSection() {
  const [code, setCode] = useState(null)
  const [stats, setStats] = useState({ total:0, active:0 })
  const [copied, setCopied] = useState(false)

  useEffect(()=>{
    fetch('/api/referral/generate').then(r=>r.json()).then(data=>{ if(data.code){ setCode(data.code); if(data.stats) setStats(data.stats) } }).catch(()=>{})
  },[])

  if (!code) return null
  const link = (typeof window!=='undefined'?window.location.origin:'')+'/?ref='+code

  return (
    <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px 20px',marginBottom:1 }}>
      <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:8 }}>Mon lien de parrainage</div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:10 }}>
        <div style={{ background:'var(--ink)',padding:'10px 14px',textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-label)',fontSize:22,color:'var(--gold2)',letterSpacing:-1 }}>{stats.total}</div>
          <div style={{ fontSize:10,color:'var(--muted2)',marginTop:2 }}>Amis parraines</div>
        </div>
        <div style={{ background:'var(--ink)',padding:'10px 14px',textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-label)',fontSize:22,color:'var(--success2)',letterSpacing:-1 }}>{stats.active}</div>
          <div style={{ fontSize:10,color:'var(--muted2)',marginTop:2 }}>Actifs</div>
        </div>
      </div>
      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'9px 12px',fontFamily:'monospace',fontSize:11,color:'var(--muted2)',wordBreak:'break-all',marginBottom:8 }}>{link}</div>
      <button onClick={()=>{navigator.clipboard.writeText(link);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
        className="btn-ghost" style={{ width:'100%',fontSize:11,color:copied?'var(--gold2)':'var(--muted2)',borderColor:copied?'var(--gold-border)':'var(--border2)' }}>
        {copied?'Lien copie !':'Copier mon lien de parrainage'}
      </button>
    </div>
  )
}
