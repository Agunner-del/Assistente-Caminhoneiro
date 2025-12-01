import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/clients.ts';
import type { Profile, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/types.ts';
import { validateBody, authLoginSchema, authRegisterSchema } from '../middleware/validation.ts';

const router: express.Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login
router.post('/login', validateBody(authLoginSchema), async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, profileType: user.profile_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        profile_type: user.profile_type,
        settings: user.settings || {},
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token,
      expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register
router.post('/register', validateBody(authRegisterSchema), async (req, res) => {
  try {
    const { email, password, profile_type }: RegisterRequest = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert([{
        email,
        password_hash: passwordHash,
        profile_type,
        settings: {}
      }])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, profileType: newUser.profile_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response: AuthResponse = {
      user: {
        id: newUser.id,
        email: newUser.email,
        profile_type: newUser.profile_type,
        settings: newUser.settings || {},
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      },
      token,
      expires_in: 7 * 24 * 60 * 60
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT token
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Current user profile
router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const profile: Profile = {
      id: data.id,
      email: data.email,
      profile_type: data.profile_type,
      settings: data.settings || {},
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
