/**
 * CRÉAZIO — Route Deploy
 * Gestion GitHub, Vercel et domaines Porkbun
 */

import express from 'express';
import { createSupabaseClient } from '../lib/supabase.js';
import { Octokit } from 'octokit';
import fetch from 'node-fetch';
import { notifyDiscord } from '../server.js';

const router   = express.Router();
const octokit  = new Octokit({ auth: process.env.GITHUB_TOKEN });
const supabase = createSupabaseClient();

// ══════════════════════════════════════════════════════════
//  POST /api/deploy/site — Déployer ou redéployer un site
// ══════════════════════════════════════════════════════════
router.post('/site', async (req, res) => {
  const { projectId, userId, htmlContent, jsonData, commitMessage } = req.body;

  try {
    const { data: project } = await supabase
      .from('projects').select('*').eq('id', projectId).eq('user_id', userId).single();
    if (!project) return res.status(404).json({ error: 'Projet introuvable' });

    const repoName = project.repo_name || `creazio-${projectId}`;
    const owner    = process.env.GITHUB_USERNAME;

    // 1. Créer le repo si besoin
    let repoExists = false;
    try {
      await octokit.rest.repos.get({ owner, repo: repoName });
      repoExists = true;
    } catch {}

    if (!repoExists) {
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        private: true,
        auto_init: false,
        description: `Créazio — ${project.name}`,
      });
      await new Promise(r => setTimeout(r, 2000));
    }

    // 2. Pousser index.html
    await upsertFile(owner, repoName, 'index.html',
      Buffer.from(htmlContent).toString('base64'),
      commitMessage || `Créazio — ${new Date().toISOString()}`
    );

    // 3. Pousser data.json
    if (jsonData) {
      await upsertFile(owner, repoName, 'data.json',
        Buffer.from(JSON.stringify(jsonData, null, 2)).toString('base64'),
        'Créazio — Données du site'
      );
    }

    const repoUrl = `https://github.com/${owner}/${repoName}`;

    // 4. Connecter à Vercel si pas encore fait
    let deployUrl = project.deploy_url;
    if (!deployUrl) {
      deployUrl = await createVercelProject(repoName, owner);
      await supabase.from('projects').update({
        repo_name: repoName,
        repo_url: repoUrl,
        deploy_url: deployUrl,
        status: 'live',
      }).eq('id', projectId);
    }

    // 5. Vérifier le déploiement
    await waitForDeploy(deployUrl);

    await notifyDiscord('SITES_GENERES',
      `🚀 **Site déployé**\n🏷️ ${project.name}\n🌐 ${deployUrl}\n📦 Commit: ${commitMessage?.substring(0,50)}`,
      0x00875a
    );

    res.json({ success: true, repoUrl, deployUrl });

  } catch (err) {
    console.error('[DEPLOY]', err.message);
    await notifyDiscord('ERREURS_SYSTEME', `❌ Erreur déploiement: ${err.message}`, 0xef4444);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  POST /api/deploy/redeploy — Redéploiement forcé
// ══════════════════════════════════════════════════════════
router.post('/redeploy', async (req, res) => {
  const { projectId } = req.body;

  try {
    const { data: project } = await supabase
      .from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ error: 'Projet introuvable' });

    // Récupérer le HTML actuel depuis Storage
    const { data: htmlFile } = await supabase.storage
      .from('site-codes').download(`${projectId}/current/index.html`);
    const html = await htmlFile.text();

    const owner = process.env.GITHUB_USERNAME;
    await upsertFile(owner, project.repo_name, 'index.html',
      Buffer.from(html).toString('base64'),
      `Créazio — Redéploiement ${new Date().toISOString()}`
    );

    await supabase.from('projects').update({
      status: 'live',
      consecutive_failures: 0,
    }).eq('id', projectId);

    res.json({ success: true, message: 'Redéploiement lancé' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  POST /api/deploy/domain — Connecter un domaine personnalisé
// ══════════════════════════════════════════════════════════
router.post('/domain', async (req, res) => {
  const { projectId, userId, domain } = req.body;

  try {
    const { data: project } = await supabase
      .from('projects').select('*').eq('id', projectId).eq('user_id', userId).single();
    if (!project) return res.status(404).json({ error: 'Projet introuvable' });

    // 1. Vérifier disponibilité via Porkbun
    const available = await checkDomainAvailability(domain);

    // 2. Si dispo et plan Pro+, acheter le domaine
    const { data: profile } = await supabase
      .from('profiles').select('plan').eq('id', userId).single();

    let purchased = false;
    if (available && ['pro', 'business'].includes(profile?.plan)) {
      purchased = await purchaseDomain(domain);
    }

    // 3. Connecter le domaine sur Vercel
    if (project.deploy_url && process.env.VERCEL_TOKEN) {
      const projectName = project.repo_name;
      await fetch(`https://api.vercel.com/v9/projects/${projectName}/domains`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      });
    }

    // 4. Mettre à jour le projet
    await supabase.from('projects').update({
      custom_domain: domain,
      deploy_url: `https://${domain}`,
    }).eq('id', projectId);

    res.json({
      success: true,
      domain,
      purchased,
      message: purchased
        ? `Domaine ${domain} acheté et connecté`
        : `Domaine ${domain} connecté (déjà enregistré)`,
      dns_instructions: {
        type: 'CNAME',
        name: 'www',
        value: 'cname.vercel-dns.com',
        note: 'Ajoutez cet enregistrement DNS chez votre registrar si vous avez déjà le domaine.',
      },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  GET /api/deploy/check-domain — Vérifier disponibilité domaine
// ══════════════════════════════════════════════════════════
router.get('/check-domain', async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: 'Domaine requis' });

  try {
    const available = await checkDomainAvailability(domain);
    const suggestions = available ? [] : await getDomainSuggestions(domain);
    res.json({ success: true, domain, available, suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════
async function upsertFile(owner, repo, path, content, message) {
  let sha;
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    sha = data.sha;
  } catch {}

  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo, path, message, content,
    ...(sha ? { sha } : {}),
  });
}

async function createVercelProject(repoName, githubOwner) {
  if (!process.env.VERCEL_TOKEN) return `https://${repoName}.vercel.app`;

  try {
    const res = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        gitRepository: {
          type: 'github',
          repo: `${githubOwner}/${repoName}`,
        },
        framework: null,
      }),
    });
    return `https://${repoName}.vercel.app`;
  } catch {
    return `https://${repoName}.vercel.app`;
  }
}

async function waitForDeploy(deployUrl, maxAttempts = 6) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const res = await fetch(deployUrl, { method: 'HEAD' });
      if (res.ok) return true;
    } catch {}
  }
  return false;
}

async function checkDomainAvailability(domain) {
  if (!process.env.PORKBUN_API_KEY) return true;
  try {
    const res = await fetch('https://porkbun.com/api/json/v3/domain/checkAndGetDomainDetails/' + domain, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.PORKBUN_API_KEY,
        secretapikey: process.env.PORKBUN_SECRET_KEY,
      }),
    });
    const data = await res.json();
    return data.status === 'SUCCESS';
  } catch {
    return true;
  }
}

async function purchaseDomain(domain) {
  if (!process.env.PORKBUN_API_KEY) return false;
  try {
    const res = await fetch('https://porkbun.com/api/json/v3/domain/create/' + domain, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.PORKBUN_API_KEY,
        secretapikey: process.env.PORKBUN_SECRET_KEY,
        years: '1',
      }),
    });
    const data = await res.json();
    return data.status === 'SUCCESS';
  } catch {
    return false;
  }
}

async function getDomainSuggestions(domain) {
  const base = domain.replace('.fr', '').replace('.com', '').replace('.io', '');
  return [
    `${base}-pro.fr`,
    `${base}-web.fr`,
    `${base}.io`,
    `get${base}.fr`,
    `mon-${base}.fr`,
  ];
}

export default router;
