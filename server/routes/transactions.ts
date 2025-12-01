import express from 'express';
import { supabase } from '../lib/clients.ts';
import { authenticateToken } from './auth.ts';
import { validateBody } from '../middleware/validation.ts';
import { transactionSchema } from '../middleware/validation.ts';
import type { Transaction, TransactionCategory, TransactionType, TransactionStatus } from '../../shared/types.ts';

const router: express.Router = express.Router();

// Get all transactions for authenticated user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new transaction
router.post('/', authenticateToken, validateBody(transactionSchema), async (req: any, res) => {
  try {
    const { amount, category, type, description, proof_url, status, transaction_date } = req.body;

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: req.user.userId,
        amount,
        category,
        type,
        status,
        description,
        proof_url,
        transaction_date: transaction_date || new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update transaction
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { amount, category, type, description, proof_url, status } = req.body;

    // Verify transaction belongs to user
    const { data: existingTransaction, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({
        amount,
        category,
        type,
        description,
        proof_url,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return res.status(500).json({ error: 'Failed to update transaction' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Verify transaction belongs to user
    const { data: existingTransaction, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return res.status(500).json({ error: 'Failed to delete transaction' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const profileType = req.user.profileType;

    // Get current month transactions
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', `${currentMonth}-01`)
      .lt('transaction_date', `${currentMonth}-31`);

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }

    // Calculate stats based on profile type
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const profit = totalIncome - totalExpenses;

    // Profile-specific calculations
    let balanceReceivable = 0;
    let dailyAllowanceAvailable = 0;
    let dailyAllowanceUsed = 0;
    let commissionBase = 0;

    if (profileType === 'TAC') {
      // TAC: Calculate balance receivable from pending income
      balanceReceivable = income
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    } else if (profileType === 'CLT') {
      // CLT: Calculate daily allowance usage
      const dailyAllowanceTransactions = transactions.filter(t => t.category === 'diaria');
      dailyAllowanceUsed = dailyAllowanceTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      // Assume daily allowance is set in user settings, default to R$ 150/day
      const dailyAllowancePerDay = 150;
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      dailyAllowanceAvailable = (daysInMonth * dailyAllowancePerDay) - dailyAllowanceUsed;
    } else if (profileType === 'COMISSIONADO') {
      // Comissionado: Calculate commission base
      commissionBase = profit; // Simplified: profit as commission base
    }

    res.json({
      total_income: totalIncome,
      total_expenses: totalExpenses,
      profit,
      balance_receivable: balanceReceivable,
      daily_allowance_available: dailyAllowanceAvailable,
      daily_allowance_used: dailyAllowanceUsed,
      commission_base: commissionBase
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
