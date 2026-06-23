/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  COMPTABILITÉ SIMPLIFIÉE                                       ║
 * ║                                                                 ║
 * ║  - Revenus  : factures Stripe payées (table `invoices`,        ║
 * ║               déjà alimentée par generateAndStoreInvoice)       ║
 * ║  - Dépenses : saisies manuelles par le client (table `expenses`)║
 * ║  - Vue combinée mensuelle + export CSV pour le comptable        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router   = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const EXPENSE_CATEGORIES = [
  'fournitures', 'logiciel', 'marketing', 'déplacement',
  'loyer', 'matériel', 'sous-traitance', 'autre',
];

// ── GET /api/finance/:userId/summary ────────────────────────
// Vue d'ensemble : revenus (factures Stripe) + dépenses (manuelles)
// regroupés par mois, plus les totaux globaux.
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;

    const [invoicesRes, expensesRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('user_id', userId).eq('status', 'paid').order('created_at', { ascending: true }),
      supabase.from('expenses').select('*').eq('user_id', userId).order('expense_date', { ascending: true }),
    ]);

    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];

    // Regroupement par mois (clé "YYYY-MM")
    const monthly = {};
    const monthKey = d => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    invoices.forEach(inv => {
      const key = monthKey(inv.created_at);
      monthly[key] = monthly[key] || { revenue: 0, expenses: 0 };
      monthly[key].revenue += Number(inv.amount);
    });

    expenses.forEach(exp => {
      const key = monthKey(exp.expense_date);
      monthly[key] = monthly[key] || { revenue: 0, expenses: 0 };
      monthly[key].expenses += Number(exp.amount);
    });

    const months = Object.keys(monthly).sort();
    const chart = months.map(key => ({
      month: key,
      revenue: round2(monthly[key].revenue),
      expenses: round2(monthly[key].expenses),
      net: round2(monthly[key].revenue - monthly[key].expenses),
    }));

    const totalRevenue  = round2(invoices.reduce((s, i) => s + Number(i.amount), 0));
    const totalExpenses = round2(expenses.reduce((s, e) => s + Number(e.amount), 0));

    res.json({
      success: true,
      totals: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        net: round2(totalRevenue - totalExpenses),
      },
      chart,
      recent_invoices: invoices.slice(-10).reverse(),
      recent_expenses: expenses.slice(-10).reverse(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/finance/:userId/expenses ───────────────────────
router.get('/:userId/expenses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('expense_date', { ascending: false });
    if (error) throw error;
    res.json({ success: true, expenses: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/finance/:userId/expenses ──────────────────────
router.post('/:userId/expenses', async (req, res) => {
  try {
    const { label, amount, category, expense_date, notes } = req.body;
    if (!label || !amount) return res.status(400).json({ error: 'label et amount requis' });

    const cat = EXPENSE_CATEGORIES.includes(category) ? category : 'autre';

    const { data, error } = await supabase.from('expenses').insert({
      user_id: req.params.userId,
      label,
      amount: Number(amount),
      category: cat,
      expense_date: expense_date || new Date().toISOString().slice(0, 10),
      notes: notes || null,
    }).select().single();

    if (error) throw error;
    res.json({ success: true, expense: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/finance/:userId/expenses/:id ────────────────
router.delete('/:userId/expenses/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.params.userId); // sécurité : un client ne peut supprimer que ses propres dépenses
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/finance/:userId/export.csv ─────────────────────
// Export combiné revenus + dépenses pour le comptable.
router.get('/:userId/export.csv', async (req, res) => {
  try {
    const { userId } = req.params;

    const [invoicesRes, expensesRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('user_id', userId).eq('status', 'paid'),
      supabase.from('expenses').select('*').eq('user_id', userId),
    ]);

    const rows = [['Date', 'Type', 'Libellé', 'Catégorie', 'Montant (€)']];

    (invoicesRes.data || []).forEach(inv => {
      rows.push([
        new Date(inv.created_at).toISOString().slice(0, 10),
        'Revenu',
        `Facture ${inv.invoice_number || inv.stripe_invoice_id}`,
        'Abonnement Créazio',
        Number(inv.amount).toFixed(2),
      ]);
    });

    (expensesRes.data || []).forEach(exp => {
      rows.push([
        exp.expense_date,
        'Dépense',
        exp.label,
        exp.category,
        (-Number(exp.amount)).toFixed(2),
      ]);
    });

    // Tri chronologique
    rows.slice(1).sort((a, b) => a[0].localeCompare(b[0]));

    const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="creazio-comptabilite-${userId}.csv"`);
    res.send('\uFEFF' + csv); // BOM pour Excel/accents
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ──────────────────────────────────────────────────
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function csvEscape(val) {
  const s = String(val ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default router;
