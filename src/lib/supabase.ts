import { createClient } from '@supabase/supabase-js';
import { getAuthToken } from './api';
import { Transaction, FuelLog, VisualInventoryItem, DashboardStats } from '../../shared/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API Client wrapper
export const apiClient = {
  // Auth
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async register(email: string, password: string, profileData: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: profileData,
      },
    });
    if (error) throw error;
    if (!data.session && data.user) {
      const signin = await supabase.auth.signInWithPassword({ email, password });
      if (signin.error) throw signin.error;
      return { user: signin.data.user, session: signin.data.session } as typeof data;
    }
    return data;
  },

  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error || !data) {
      const profile_type = (user.user_metadata as any)?.profile_type || 'TAC';
      const insert = await supabase
        .from('profiles')
        .insert([{ id: user.id, email: user.email, profile_type, settings: {} }])
        .select()
        .single();
      if (insert.error) throw insert.error;
      return insert.data;
    }
    return data;
  },

  async updateProfile(profileData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTransaction(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transactionData, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Fuel Logs
  async getFuelLogs(): Promise<FuelLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createFuelLog(fuelData: Omit<FuelLog, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<FuelLog> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase
      .from('fuel_logs')
      .insert([{ ...fuelData, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteFuelLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('fuel_logs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getFuelStats(): Promise<{
    average_consumption: number;
    total_diesel: number;
    total_arla: number;
    last_full_tank: string | null;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const token = getAuthToken() || '';
    const response = await fetch('/api/fuel-logs/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch fuel stats');
    return response.json();
  },

  // Visual Inventory
  async getVisualInventoryItems(): Promise<VisualInventoryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase
      .from('visual_inventory')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createVisualInventoryItem(itemData: Omit<VisualInventoryItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<VisualInventoryItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase
      .from('visual_inventory')
      .insert([{ ...itemData, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteVisualInventoryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('visual_inventory')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');
    
    const token = getAuthToken() || '';
    const response = await fetch('/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  // AI Features
  async categorizeExpense(description: string): Promise<{ category: string }> {
    const token = getAuthToken() || '';
    const response = await fetch('/api/ai/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        input_type: 'text',
        content: description,
        context: 'expense_categorization'
      }),
    });
    
    if (!response.ok) throw new Error('Failed to categorize expense');
    return response.json();
  },

  async processImageWithAI(file: File): Promise<{
    item_name?: string;
    category?: string;
    description?: string;
    tags?: string[];
  }> {
    // Convert file to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          const token = getAuthToken() || '';
          const response = await fetch('/api/ai/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              input_type: 'image',
              content: base64Data,
              context: 'visual_inventory'
            }),
          });
          
          if (!response.ok) throw new Error('Failed to process image with AI');
          const result = await response.json();
          
          // Map AI response to inventory item format
          resolve({
            item_name: result.name || result.description || 'Item',
            category: mapAIResultToCategory(result.tags || []),
            description: result.description,
            tags: result.tags || []
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // File Upload
  async uploadPhoto(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  },
};

// Helper function to map AI tags to inventory categories
function mapAIResultToCategory(tags: string[]): string {
  const tagString = tags.join(' ').toLowerCase();
  
  if (tagString.includes('ferramenta')) return 'TOOLS';
  if (tagString.includes('peça') || tagString.includes('peça')) return 'SPARE_PARTS';
  if (tagString.includes('segurança') || tagString.includes('capacete') || tagString.includes('colete')) return 'SAFETY';
  if (tagString.includes('documento') || tagString.includes('cnh') || tagString.includes('documento')) return 'DOCUMENTS';
  if (tagString.includes('pessoal') || tagString.includes('roupa') || tagString.includes('higiene')) return 'PERSONAL';
  if (tagString.includes('comida') || tagString.includes('alimento') || tagString.includes('água')) return 'FOOD';
  if (tagString.includes('eletrônico') || tagString.includes('celular') || tagString.includes('gps')) return 'ELECTRONICS';
  
  return 'OTHER';
}

// Auth state change listener
export const setupAuthListener = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
};
