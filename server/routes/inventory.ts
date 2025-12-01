import express from 'express';
import multer from 'multer';
import { supabase } from '../lib/clients.ts';
import { authenticateToken } from './auth.ts';
import type { VisualInventoryItem } from '../../shared/types.ts';

const router: express.Router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all inventory items for authenticated user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const { data, error } = await supabase
      .from('visual_inventory')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory items:', error);
      return res.status(500).json({ error: 'Failed to fetch inventory items' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload inventory item with photo
router.post('/upload', authenticateToken, upload.single('photo'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    const { description } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    // Generate unique filename
    const fileName = `${userId}/${Date.now()}-${file.originalname}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('inventory-photos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return res.status(500).json({ error: 'Failed to upload photo' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('inventory-photos')
      .getPublicUrl(fileName);

    // Create inventory item record
    const { data, error } = await supabase
      .from('visual_inventory')
      .insert([{
        user_id: userId,
        photo_url: publicUrl,
        ai_tags: [],
        description
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory item:', error);
      return res.status(500).json({ error: 'Failed to create inventory item' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error uploading inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory item with AI tags
router.put('/:id/ai-tags', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { ai_tags } = req.body;

    // Verify inventory item belongs to user
    const { data: existingItem, error: checkError } = await supabase
      .from('visual_inventory')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !existingItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const { data, error } = await supabase
      .from('visual_inventory')
      .update({
        ai_tags: ai_tags || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating AI tags:', error);
      return res.status(500).json({ error: 'Failed to update AI tags' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating AI tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Verify inventory item belongs to user
    const { data: existingItem, error: checkError } = await supabase
      .from('visual_inventory')
      .select('id, photo_url')
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !existingItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Delete from storage
    const fileName = existingItem.photo_url.split('/').pop();
    if (fileName) {
      const { error: storageError } = await supabase.storage
        .from('inventory-photos')
        .remove([`${req.user.userId}/${fileName}`]);

      if (storageError) {
        console.error('Error deleting photo from storage:', storageError);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('visual_inventory')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inventory item:', error);
      return res.status(500).json({ error: 'Failed to delete inventory item' });
    }

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
