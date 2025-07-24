require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with custom CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
        "https://esm.sh",
        "https://unpkg.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://monad-dog.vercel.app",
        "https://placedog.net"
      ],
      connectSrc: [
        "'self'",
        "https://testnet-rpc.monad.xyz",
        "https://uhqszfoekqrjtybrwqzt.supabase.co"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://monad-dog.vercel.app', 'https://your-production-domain.vercel.app', 'http://localhost:3000']
    : ['http://localhost:8000', 'http://localhost:3000', 'http://localhost:3001', 'https://monad-dog.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'User-Agent', 'Accept', 'Accept-Language'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add security headers with more permissive settings for development
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add CORS headers for preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires, User-Agent, Accept, Accept-Language');
    res.status(200).end();
    return;
  }
  
  next();
});
app.use(express.json());

// General rate limiting (disabled for development)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased for development
  message: { error: 'Too many requests' }
});

// XP-specific rate limiting (more strict)
const xpLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // Increased for development
  message: { error: 'Too many XP updates' },
  keyGenerator: (req) => {
    // Use IP + wallet address for more granular rate limiting
    return `${req.ip}_${req.params.address || req.body.wallet_address || 'unknown'}`;
  }
});

// Enable rate limiting for production
if (process.env.NODE_ENV === 'production') {
  app.use(limiter);
  console.log('🛡️ Rate limiting enabled for production');
} else {
  console.log('⚠️ Rate limiting disabled for development');
}

// Initialize Supabase (with fallback)
let supabase = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://uhqszfoekqrjtybrwqzt.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey && supabaseKey !== 'your-supabase-anon-key-here') {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase connected');
    console.log('🔑 Using key:', supabaseKey.substring(0, 20) + '...');
  } else {
    console.log('⚠️ Supabase credentials missing, using fallback mode');
    console.log('🔑 URL:', supabaseUrl);
    console.log('🔑 Key length:', supabaseKey ? supabaseKey.length : 0);
  }
} catch (error) {
  console.log('⚠️ Supabase connection failed, using fallback mode:', error.message);
}

// Input validation middleware
const validateWalletAddress = (req, res, next) => {
  const address = req.params.address || req.body.wallet_address;
  
  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }
  
  // Basic Ethereum address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }
  
  next();
};

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase: !!supabase ? 'connected' : 'disconnected'
  });
});

// Add request logging for debugging
app.use('/api', (req, res, next) => {
  console.log(`📡 API Request: ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// XP endpoints with better error handling
app.get('/api/xp/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    if (supabase) {
      console.log('🔍 Fetching XP for address:', address);
      const { data, error } = await supabase
        .from('user_xp')
        .select('xp, updated_at')
        .eq('wallet_address', address.toLowerCase())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('📊 XP data:', data);
      res.json({
        xp: data?.xp || 0,
        updated_at: data?.updated_at || null
      });
    } else {
      console.log('⚠️ Supabase not available, using fallback');
      // Fallback: return 0 XP if Supabase not available
      res.json({
        xp: 0,
        updated_at: null
      });
    }
  } catch (error) {
    console.error('Error fetching XP:', error);
    // Return fallback response instead of error
    res.json({
      xp: 0,
      updated_at: null
    });
  }
});

// Update user XP (with rate limiting)
app.post('/api/xp/:address', xpLimiter, async (req, res) => {
  try {
    const { address } = req.params;
    const { xp } = req.body;
    
    if (typeof xp !== 'number' || xp < 0) {
      return res.status(400).json({ error: 'Invalid XP amount' });
    }
    
    if (supabase) {
      const { error } = await supabase
        .from('user_xp')
        .upsert({
          wallet_address: address.toLowerCase(),
          xp: xp,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_address'
        });
      
      if (error) throw error;
    }
    
    res.json({ success: true, xp: xp });
  } catch (error) {
    console.error('Error updating XP:', error);
    // Return fallback response instead of error
    res.json({ success: true, xp: xp });
  }
});

// Get user stats
app.get('/api/stats/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    let xp = 0;
    
    if (supabase) {
      // Get XP from Supabase
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('xp')
        .eq('wallet_address', address.toLowerCase())
        .single();
      
      xp = xpData?.xp || 0;
    }
    
    // Get daily stats (from localStorage equivalent)
    const dailyStats = {
      pets: 0,
      greets: 0,
      flips: 0,
      slots: 0,
      collections: 0
    };
    
    res.json({
      xp: xp,
      daily_stats: dailyStats,
      level: Math.floor(xp / 1000) + 1
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Return fallback response instead of error
    res.json({
      xp: 0,
      daily_stats: {},
      level: 1
    });
  }
});

// Get user collection (owned dogs)
app.get('/api/collection/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (supabase) {
      try {
        // Get all owned dogs for this wallet
        const { data, error } = await supabase
          .from('dog_collection')
          .select('dog_id, unlocked_at')
          .eq('wallet_address', address.toLowerCase());
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        // Convert to array of dog IDs
        const ownedDogs = data ? data.map(item => item.dog_id) : [];
        
        console.log(`📊 Collection API - Wallet: ${address}, Dogs: ${ownedDogs.length}`);
        
        res.json({
          owned_dogs: ownedDogs,
          total_pets: 0, // Will be updated separately
          last_updated: data && data.length > 0 ? data[0].unlocked_at : null
        });
      } catch (tableError) {
        console.log('Table does not exist, returning empty collection');
        res.json({
          owned_dogs: [],
          total_pets: 0,
          last_updated: null
        });
      }
    } else {
      res.json({
        owned_dogs: [],
        total_pets: 0,
        last_updated: null
      });
    }
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Update user collection
app.post('/api/collection/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { owned_dogs, total_pets } = req.body;
    
    if (supabase && owned_dogs && Array.isArray(owned_dogs)) {
      // First, get existing dogs for this wallet
      const { data: existingDogs } = await supabase
        .from('dog_collection')
        .select('dog_id')
        .eq('wallet_address', address.toLowerCase());
      
      const existingDogIds = existingDogs ? existingDogs.map(item => item.dog_id) : [];
      
      // Find new dogs to add
      const newDogs = owned_dogs.filter(dogId => !existingDogIds.includes(dogId));
      
      // Add new dogs
      if (newDogs.length > 0) {
        const dogsToInsert = newDogs.map(dogId => ({
          wallet_address: address.toLowerCase(),
          dog_id: dogId,
          unlocked_at: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('dog_collection')
          .insert(dogsToInsert);
        
        if (error) throw error;
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Get user challenges progress
app.get('/api/challenges/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (supabase) {
      try {
        // Get challenge progress for this wallet
        const { data, error } = await supabase
          .from('challenge_progress')
          .select('challenge_id, progress, completed, completed_at')
          .eq('wallet_address', address.toLowerCase());
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        // Convert to progress object
        const progress = {};
        const completedChallenges = [];
        
        if (data) {
          data.forEach(item => {
            progress[item.challenge_id] = item.progress;
            if (item.completed) {
              completedChallenges.push(item.challenge_id);
            }
          });
        }
        
        // Get user stats for daily stats
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('daily_pets, daily_greets, daily_flips, daily_slots, last_reset_date')
          .eq('wallet_address', address.toLowerCase())
          .single();
        
        const dailyStats = {
          pets: statsData?.daily_pets || 0,
          greets: statsData?.daily_greets || 0,
          flips: statsData?.daily_flips || 0,
          slots: statsData?.daily_slots || 0
        };
        
        res.json({
          progress: progress,
          daily_stats: dailyStats,
          last_reset_date: statsData?.last_reset_date || null
        });
      } catch (tableError) {
        console.log('Tables do not exist, returning empty challenges');
        res.json({
          progress: {},
          daily_stats: {},
          last_reset_date: null
        });
      }
    } else {
      res.json({
        progress: {},
        daily_stats: {},
        last_reset_date: null
      });
    }
  } catch (error) {
    console.error('Error fetching challenges:', error);
    // Return fallback response instead of error
    res.json({
      progress: {},
      daily_stats: {},
      last_reset_date: null
    });
  }
});

// Update user challenges progress
app.post('/api/challenges/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { progress, daily_stats, last_reset_date } = req.body;
    
    if (supabase) {
      // Update or insert challenge progress
      if (progress && typeof progress === 'object') {
        for (const [challengeId, progressValue] of Object.entries(progress)) {
          const { error } = await supabase
            .from('challenge_progress')
            .upsert({
              wallet_address: address.toLowerCase(),
              challenge_id: challengeId,
              progress: progressValue,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'wallet_address,challenge_id'
            });
          
          if (error) throw error;
        }
      }
      
      // Update user stats
      if (daily_stats && typeof daily_stats === 'object') {
        const { error } = await supabase
          .from('user_stats')
          .upsert({
            wallet_address: address.toLowerCase(),
            daily_pets: daily_stats.pets || 0,
            daily_greets: daily_stats.greets || 0,
            daily_flips: daily_stats.flips || 0,
            daily_slots: daily_stats.slots || 0,
            last_reset_date: last_reset_date || new Date().toDateString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'wallet_address'
          });
        
        if (error) throw error;
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating challenges:', error);
    res.status(500).json({ error: 'Failed to update challenges' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('user_xp')
        .select('wallet_address, xp, updated_at')
        .order('xp', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      res.json(data || []);
    } else {
      // Fallback: return empty leaderboard
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Clean test data (for development only)
app.delete('/api/cleanup/test-data', async (req, res) => {
  try {
    if (supabase) {
      console.log('🧹 Cleaning up test data...');
      
      // Delete test wallet data from all tables
      const testWallet = '0x1234567890123456789012345678901234567890';
      
      // Clean dog_collection
      const { error: collectionError } = await supabase
        .from('dog_collection')
        .delete()
        .eq('wallet_address', testWallet.toLowerCase());
      
      if (collectionError) console.error('Error cleaning collection:', collectionError);
      
      // Clean challenge_progress
      const { error: challengeError } = await supabase
        .from('challenge_progress')
        .delete()
        .eq('wallet_address', testWallet.toLowerCase());
      
      if (challengeError) console.error('Error cleaning challenges:', challengeError);
      
      // Clean user_stats
      const { error: statsError } = await supabase
        .from('user_stats')
        .delete()
        .eq('wallet_address', testWallet.toLowerCase());
      
      if (statsError) console.error('Error cleaning stats:', statsError);
      
      // Clean user_xp
      const { error: xpError } = await supabase
        .from('user_xp')
        .delete()
        .eq('wallet_address', testWallet.toLowerCase());
      
      if (xpError) console.error('Error cleaning XP:', xpError);
      
      console.log('✅ Test data cleaned successfully');
      res.json({ success: true, message: 'Test data cleaned' });
    } else {
      res.json({ success: false, message: 'Supabase not connected' });
    }
  } catch (error) {
    console.error('Error cleaning test data:', error);
    res.status(500).json({ error: 'Failed to clean test data' });
  }
});

// Serve static files first
app.use(express.static('public'));

// Serve public/index.html for root route
app.get('/', (req, res) => {
  // Add cache busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"${Date.now()}"`
  });
  res.sendFile(__dirname + '/public/index.html');
});

// Serve static files (after routes)
app.use(express.static('public'));

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Monad Dog Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
}); 