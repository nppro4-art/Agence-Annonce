/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  STATS PUBLIQUES — pour preuve sociale (pricing.html, etc.)  ║
 * ║  Aucune donnée sensible : uniquement des compteurs globaux.  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
import express from 'express';
import { createSupabaseClient } from '../lib/supabase.js';

const router   = express.Router();
const supabase = createSupabaseClient();

router.get('/public', async (req, res) => {
  try {
    const [sites, clients] = await Promise.all([
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan_active', true),
    ]);

    res.json({
      success: true,
      sites_created: sites.count || 0,
      active_clients: clients.count || 0,
    });
  } catch (err) {
    // En cas d'erreur, on renvoie 0 plutôt qu'une erreur — la page pricing
    // doit pouvoir s'afficher même si Supabase est temporairement indisponible.
    res.json({ success: true, sites_created: 0, active_clients: 0 });
  }
});

export default router;
