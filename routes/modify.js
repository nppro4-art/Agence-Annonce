import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { renderSite } from '../engine/render-engine.js';
import { pushToGitHub } from './generate.js';
import { notifyDiscord } from '../server.js';
import { moderateContent } from '../services/moderation.js';
import { computeModifyApplyDate } from '../services/team.js';
import { analyzeInspirationUrl, buildInspirationPrompt } from '../services/url-analyzer.js';

const router    = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const MODIFY_PROMPT = `Tu es le moteur de modification de sites web de Créazio.

Tu reçois un JSON de données de site et une instruction de modification en langage naturel.
Tu modifies UNIQUEMENT le JSON selon l'instruction. Tu retournes le JSON complet modifié.

RÈGLES :
1. Ne modifie QUE ce qui est demandé dans l'instruction
2. Conserve tout le reste intact
3. Si l'instruction ajoute une section, ajoute-la dans pages.home.components ET crée les données correspondantes
4. Pour "plus premium/luxe" : ajuste les couleurs vers des tons sombres et des accents dorés
5. Pour "plus coloré/moderne" : utilise des couleurs vives et contemporaines
6. Retourne UNIQUEMENT le JSON valide, sans markdown ni explication
7. Si une URL d'inspiration est fournie dans l'instruction, adapte la palette de couleurs et/ou la structure de sections selon l'analyse fournie — sans copier le contenu`;

// ── POST /api/modify ────────────────────────────────────────
router.post('/', async (req, res) => {
  const { projectId, userId, instruction } = req.body;
  if (!projectId || !userId || !instruction) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }
  try {
    // Modération
    const mod = await moderateContent(instruction);
    if (!mod.safe) return res.status(400).json({ error: 'Contenu inapproprié', message: mod.reason });

    // Récupérer le projet
    const { data: project } = await supabase
      .from('projects').select('*').eq('id', projectId).eq('user_id', userId).single();
    if (!project) return res.status(404).json({ error: 'Projet introuvable' });

    // Récupérer le JSON actuel depuis Storage
    const { data: jsonFile } = await supabase.storage
      .from('site-codes').download(`${projectId}/current/data.json`);
    const currentJSON = JSON.parse(await jsonFile.text());

    // Détecter et analyser une URL d'inspiration dans l'instruction
    let inspirationContext = '';
    const urlMatch = instruction.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      console.log(`[MODIFY INSPIRATION] Analyse de ${urlMatch[0]}`);
      const profile = await analyzeInspirationUrl(urlMatch[0]);
      inspirationContext = buildInspirationPrompt(profile);
    }

    // Modifier via Claude
    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: MODIFY_PROMPT,
      messages: [{
        role: 'user',
        content: `JSON actuel :\n${JSON.stringify(currentJSON, null, 2)}\n\nInstruction : ${instruction}${inspirationContext ? '\n\n' + inspirationContext : ''}\n\nRetourne le JSON modifié complet.`,
      }],
    });

    let modifiedJSON;
    try {
      const raw = aiRes.content[0].text.trim()
        .replace(/^```json\s*/i,'').replace(/```\s*$/,'');
      modifiedJSON = JSON.parse(raw);
    } catch {
      throw new Error('JSON modifié invalide');
    }

    // Mettre à jour la version
    const newVersion = (project.version || 1) + 1;
    modifiedJSON.meta = {
      ...modifiedJSON.meta,
      updated_at: new Date().toISOString(),
      version: newVersion,
    };

    // Reconstruire le HTML
    const finalHTML = renderSite(modifiedJSON);

    // Injecter les snippets d'intégration
    const intSnippets = buildIntegrationSnippets(modifiedJSON);
    const htmlFinal = finalHTML.replace('</body>', `${intSnippets}\n</body>`);

    // Sauvegarder dans Storage
    await supabase.storage.from('site-codes')
      .upload(`${projectId}/current/data.json`, JSON.stringify(modifiedJSON,null,2),
        { contentType:'application/json', upsert:true });
    await supabase.storage.from('site-codes')
      .upload(`${projectId}/current/index.html`, htmlFinal,
        { contentType:'text/html', upsert:true });
    await supabase.storage.from('site-codes')
      .upload(`${projectId}/v${newVersion}/data.json`, JSON.stringify(modifiedJSON,null,2),
        { contentType:'application/json', upsert:true });

    // Enregistrer version — avec délai d'application simulé (24-72h)
    const applyAt = computeModifyApplyDate();
    await supabase.from('versions').insert({
      project_id: projectId,
      version: newVersion,
      instruction,
      storage_path: `${projectId}/v${newVersion}`,
      site_data: modifiedJSON,
      apply_at: applyAt.toISOString(),
      applied: false,
    });

    // Mettre à jour projet — déployé techniquement, mais le dashboard
    // affiche "Modification en cours" jusqu'à apply_at (cf. cron)
    await supabase.from('projects').update({
      site_data: modifiedJSON,
      version: newVersion,
      client_status: 'modifying',
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    // Push GitHub → Vercel redéploie auto
    await pushToGitHub(project.repo_name, htmlFinal, modifiedJSON,
      project.name, `Modification : ${instruction}`, true);

    res.json({
      success: true,
      siteData: modifiedJSON,
      version: newVersion,
      message: 'Modification reçue — notre équipe applique les changements, vous recevrez un email de confirmation sous 24 à 72h.',
      applyAt: applyAt.toISOString(),
    });

  } catch (err) {
    console.error('[MODIFY]', err.message);
    await notifyDiscord('ERREURS_SYSTEME', `❌ Erreur modify: ${err.message}`, 0xcc0000);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/modify/preview/:projectId ──────────────────────
router.get('/preview/:projectId', async (req, res) => {
  try {
    const { data: file } = await supabase.storage
      .from('site-codes').download(`${req.params.projectId}/current/index.html`);
    const html = await file.text();
    res.setHeader('Content-Type','text/html');
    res.send(html);
  } catch (err) {
    res.status(404).json({ error: 'Aperçu introuvable' });
  }
});

function buildIntegrationSnippets(siteData) {
  const ints = siteData?.integrations || {};
  const snippets = [];
  if (ints.google_analytics?.enabled) {
    snippets.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${ints.google_analytics.measurement_id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ints.google_analytics.measurement_id}');</script>`);
  }
  if (ints.facebook_pixel?.enabled) {
    snippets.push(`<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${ints.facebook_pixel.pixel_id}');fbq('track','PageView');</script>`);
  }
  if (ints.whatsapp?.enabled) {
    const phone = ints.whatsapp.phone.replace(/[^0-9]/g,'');
    snippets.push(`<a href="https://wa.me/${phone}" target="_blank" rel="noopener" style="position:fixed;bottom:24px;right:24px;z-index:999;background:#25d366;color:white;width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 4px 20px rgba(37,211,102,.4);text-decoration:none">💬</a>`);
  }
  if (ints.tawk?.enabled) {
    snippets.push(`<script type="text/javascript">var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src='https://embed.tawk.to/${ints.tawk.property_id}/${ints.tawk.widget_id||'default'}';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0)})();</script>`);
  }
  if (ints.hotjar?.enabled) {
    snippets.push(`<script>(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${ints.hotjar.hjid},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r)})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');</script>`);
  }
  return snippets.join('\n');
}

export default router;
