# Créazio — Backend V1

> API Node.js + Express qui alimente la plateforme Créazio : génération de sites web par IA, déploiement automatique GitHub/Vercel, abonnements Stripe, et bien plus.

---

## Stack technique

| Brique | Usage |
|---|---|
| Node.js + Express | Serveur API REST |
| Anthropic Claude | Génération et modification de sites (JSON → HTML) |
| Supabase | Base de données + Auth + Storage |
| Stripe | Abonnements, paiements, webhooks |
| GitHub (Octokit) | Push des sites générés dans des repos privés |
| Vercel | Déploiement automatique des sites clients |
| Resend | Emails transactionnels |
| Discord Webhooks | Notifications opérationnelles internes |
| Unsplash | Images automatiques pour les sites générés |
| node-cron | Tâches planifiées (révélations, rapports, monitoring) |

---

## Installation

```bash
git clone https://github.com/nppro4-art/creazio-backend.git
cd creazio-backend
npm install
cp .env.example .env
# Remplissez .env avec vos clés
npm run dev
```

---

## Structure

```
creazio-backend/
├── server.js                  # Point d'entrée, CORS, cron jobs, notifications Discord
├── .env.example               # Variables d'environnement requises
│
├── routes/
│   ├── auth.js                # Inscription, connexion, profil, projets
│   ├── generate.js            # Génération de site via Claude (JSON → HTML → GitHub → Vercel)
│   ├── modify.js              # Modification de site via Claude
│   ├── deploy.js              # Déploiement, redéploiement, domaines personnalisés
│   ├── billing.js             # Checkout Stripe, webhooks, portail facturation
│   ├── versions.js            # Historique des versions, restauration
│   ├── contact.js             # Formulaires de contact des sites clients
│   ├── admin.js               # Dashboard admin, modération, broadcast
│   ├── stats.js               # Stats publiques (preuve sociale)
│   ├── finance.js             # Comptabilité simplifiée (revenus + dépenses)
│   └── integrations.js        # Catalogue d'intégrations tierces
│
├── services/
│   ├── moderation.js          # Modération de contenu (mots bloqués + Claude Haiku)
│   ├── team.js                # Équipe fictive, signatures emails, délais de "traitement"
│   ├── images.js              # Recherche automatique d'images via Unsplash
│   ├── integrations.js        # CRUD intégrations (Stripe, WhatsApp, Calendly, GA…)
│   └── problems-handler.js    # RGPD, chargebacks, auto-debug, SIRET, factures
│
├── engine/
│   ├── render-engine.js       # Moteur de rendu : JSON data → HTML final
│   └── site-schema.json       # Schéma de validation du JSON généré
│
└── templates/
    └── base/
        └── universal.html     # Template HTML universel (seul template V1)
```

---

## Routes API

### Auth — `/api/auth`
| Méthode | Route | Description |
|---|---|---|
| POST | `/register` | Créer un compte (Supabase Auth + Stripe Customer + email bienvenue) |
| POST | `/login` | Connexion, retourne session + profil |
| POST | `/forgot-password` | Envoi email de réinitialisation |
| GET | `/profile/:userId` | Récupérer le profil |
| PUT | `/profile/:userId` | Mettre à jour le profil |
| GET | `/projects/:userId` | Lister les projets d'un utilisateur |

### Génération — `/api/generate`
| Méthode | Route | Description |
|---|---|---|
| POST | `/` | Générer un site complet (Claude → JSON → HTML → GitHub → Vercel) |
| POST | `/stream` | Génération en streaming (SSE) |

### Modification — `/api/modify`
| Méthode | Route | Description |
|---|---|---|
| POST | `/` | Modifier un site via instruction en langage naturel |
| GET | `/preview/:projectId` | Aperçu HTML du site actuel |

### Déploiement — `/api/deploy`
| Méthode | Route | Description |
|---|---|---|
| POST | `/site` | Déployer ou redéployer un site |
| POST | `/redeploy` | Redéploiement forcé depuis le Storage |
| POST | `/domain` | Connecter un domaine personnalisé |
| GET | `/check-domain` | Vérifier la disponibilité d'un domaine |

### Facturation — `/api/billing`
| Méthode | Route | Description |
|---|---|---|
| POST | `/create-checkout` | Créer une session de paiement Stripe |
| POST | `/create-subscription-dynamic` | Abonnement avec prix dynamique |
| POST | `/webhook` | Webhooks Stripe (checkout, paiements, résiliations…) |
| GET | `/portal/:userId` | Portail de facturation Stripe |
| GET | `/invoices/:userId` | Liste des factures |

### Versions — `/api/versions`
| Méthode | Route | Description |
|---|---|---|
| GET | `/:projectId` | Historique des versions |
| POST | `/restore` | Restaurer une version précédente |

### Contact — `/api/contact`
| Méthode | Route | Description |
|---|---|---|
| POST | `/` | Soumettre un message depuis un site client |
| GET | `/:userId` | Messages reçus d'un utilisateur |
| PUT | `/read/:messageId` | Marquer un message comme lu |

### Admin — `/api/admin`
| Méthode | Route | Description |
|---|---|---|
| POST | `/login` | Connexion admin |
| GET | `/dashboard` | Vue d'ensemble (clients, MRR, sites, signalements) |
| POST | `/suspend` | Suspendre un client |
| POST | `/reactivate` | Réactiver un client |
| POST | `/email-client` | Envoyer un email à un client |
| POST | `/broadcast` | Message à tous les clients actifs |
| POST | `/report-content` | Signalement contenu illégal |
| POST | `/delete-account` | Suppression RGPD |
| POST | `/debug` | Auto-debug manuel d'un site |
| POST | `/validate-siret` | Valider un SIRET via l'API INSEE |

### Stats — `/api/stats`
| Méthode | Route | Description |
|---|---|---|
| GET | `/public` | Compteurs publics (sites créés, clients actifs) |

### Finance — `/api/finance`
| Méthode | Route | Description |
|---|---|---|
| GET | `/:userId/summary` | Revenus + dépenses par mois, totaux |
| GET | `/:userId/expenses` | Liste des dépenses |
| POST | `/:userId/expenses` | Ajouter une dépense |
| DELETE | `/:userId/expenses/:id` | Supprimer une dépense |
| GET | `/:userId/export.csv` | Export comptable CSV |

---

## Cron Jobs

| Fréquence | Action |
|---|---|
| Toutes les 30 min | Révélation des sites prêts + application des modifications en attente |
| Chaque soir à 20h | Résumé quotidien Discord |
| Chaque lundi à 9h | Rapport hebdomadaire Discord |
| Chaque nuit à 3h | Vérification santé des sites |
| 1er du mois à 8h | Rapports mensuels aux clients |

---

## Variables d'environnement

Voir `.env.example` — toutes les variables sont documentées.

---

## Déploiement (Render)

Le backend est déployé sur [Render](https://render.com) :

- **Service** : Web Service
- **Build command** : `npm install`
- **Start command** : `node server.js`
- **Node version** : 20+
- **Variables** : ajoutez chaque ligne du `.env` dans Render → Environment

---

## Webhook Stripe

Dans le dashboard Stripe, configurez le webhook vers :
```
https://creazio-backend.onrender.com/webhook/stripe
```

Événements à écouter :
- `checkout.session.completed`
- `customer.subscription.trial_will_end`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `charge.dispute.created`

---

## Sécurité

- Les routes `/api/admin/*` sont protégées par un header `x-admin-key`
- Les clés secrètes Stripe ne transitent jamais côté frontend
- Les secrets d'intégration (API keys tierces) sont stockés dans une table dédiée `integration_secrets`
- RGPD : suppression complète des données sur demande (`/api/admin/delete-account`)
- Modération automatique du contenu avant génération

---

Créazio · [creazio.fr](https://creazio.fr)
