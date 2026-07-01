import express from 'express';
import { createSupabaseClient } from '../lib/supabase.js';
import { renderSite } from '../engine/render-engine.js';
import { pushToGitHub } from './generate.js';

const router   = express.Router();
const supabase = createSupabaseClient();

// ── GET /api/versions/:projectId ────────────────────────────
router.get('/:projectId', async (req, res) => {
  try {
    const { data: versions } = await supabase
      .from('versions')
      .select('version, instruction, created_at, storage_path')
      .eq('project_id', req.params.projectId)
      .order('version', { ascending: false });
    res.json({ success: true, versions: versions || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/versions/restore ──────────────────────────────
router.post('/restore', async (req, res) => {
  const { projectId, userId, version } = req.body;
  try {
    // Récupérer la version demandée
    const { data: versionData } = await supabase
      .from('versions')
      .select('*')
      .eq('project_id', projectId)
      .eq('version', version)
      .single();
    if (!versionData) return res.status(404).json({ error: 'Version introuvable' });

    const { data: project } = await supabase
      .from('projects').select('*').eq('id', projectId).eq('user_id', userId).single();
    if (!project) return res.status(403).json({ error: 'Non autorisé' });

    const siteData = versionData.site_data;

    // Reconstruire le HTML
    const finalHTML = renderSite(siteData);

    // Sauvegarder comme version courante
    await supabase.storage.from('site-codes')
      .upload(`${projectId}/current/data.json`, JSON.stringify(siteData,null,2),
        { contentType:'application/json', upsert:true });
    await supabase.storage.from('site-codes')
      .upload(`${projectId}/current/index.html`, finalHTML,
        { contentType:'text/html', upsert:true });

    // Enregistrer la restauration comme nouvelle version
    const newVersion = project.version + 1;
    await supabase.from('versions').insert({
      project_id: projectId,
      version: newVersion,
      instruction: `Restauration vers version ${version}`,
      storage_path: `${projectId}/v${newVersion}`,
      site_data: siteData,
      created_at: new Date().toISOString(),
    });

    await supabase.from('projects').update({
      site_data: siteData,
      version: newVersion,
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    await pushToGitHub(project.repo_name, finalHTML, siteData,
      project.name, `Restauration v${version}`, true);

    res.json({ success: true, message: `Version ${version} restaurée`, newVersion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
