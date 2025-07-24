// Vercel Serverless Function for API
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = 'https://uhqszfoekqrjtybrwqzt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocXN6Zm9la3FyanR5YnJ3cXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI5NzAsImV4cCI6MjA0ODU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

let supabase = null;
let supabaseStatus = 'disconnected';

const initializeSupabase = async () => {
  try {
    console.log('🔧 Initializing Supabase connection...');
    supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const testPromise = supabase
      .from('user_xp')
      .select('count')
      .limit(1);
    
    const { data, error } = await Promise.race([testPromise, timeoutPromise]);
    
    if (error) {
      console.log('⚠️ Supabase connection failed:', error.message);
      supabaseStatus = 'connection_failed';
      supabase = null;
    } else {
      console.log('✅ Supabase connected successfully');
      supabaseStatus = 'connected';
    }
  } catch (error) {
    console.log('⚠️ Supabase initialization failed:', error.message);
    supabaseStatus = 'error';
    supabase = null;
  }
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Accept-Language',
  'Content-Type': 'application/json'
};

// Main handler
module.exports = async (req, res) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200, corsHeaders);
      res.end();
      return;
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const path = pathname.replace('/api', '');

    console.log(`📡 API Request: ${req.method} ${path}`);

    // Initialize Supabase if not already done
    if (!supabase) {
      await initializeSupabase();
    }

    // Health check
    if (path === '/health' && req.method === 'GET') {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        supabase: supabaseStatus,
        version: '1.0.0',
        message: 'API is working!'
      });
      return;
    }

    // Test endpoint
    if (path === '/test' && req.method === 'GET') {
      res.json({
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        supabase_status: supabaseStatus
      });
      return;
    }

    // Test Supabase endpoint
    if (path === '/test-supabase' && req.method === 'GET') {
      if (supabase && supabaseStatus === 'connected') {
        try {
          const { data, error } = await supabase
            .from('user_xp')
            .select('count')
            .limit(1);
          
          if (error) {
            res.json({
              status: 'error',
              message: 'Supabase query failed',
              error: error.message
            });
          } else {
            res.json({
              status: 'success',
              message: 'Supabase is working',
              data: data
            });
          }
        } catch (error) {
          res.json({
            status: 'error',
            message: 'Supabase test failed',
            error: error.message
          });
        }
      } else {
        res.json({
          status: 'disconnected',
          message: 'Supabase not connected',
          supabase_status: supabaseStatus
        });
      }
      return;
    }

    // XP endpoints
    if (path.startsWith('/xp/') && req.method === 'GET') {
      const address = path.split('/')[2];
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({ error: 'Invalid wallet address' });
        return;
      }

      if (supabase && supabaseStatus === 'connected') {
        try {
          const { data, error } = await supabase
            .from('user_xp')
            .select('xp, updated_at')
            .eq('wallet_address', address.toLowerCase())
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error('Supabase error:', error);
          }
          
          res.json({
            xp: data?.xp || 0,
            updated_at: data?.updated_at || null
          });
        } catch (error) {
          console.error('XP fetch error:', error);
          res.json({
            xp: 0,
            updated_at: null
          });
        }
      } else {
        res.json({
          xp: 0,
          updated_at: null
        });
      }
      return;
    }

    if (path.startsWith('/xp/') && req.method === 'POST') {
      const address = path.split('/')[2];
      const { xp } = req.body;
      
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({ error: 'Invalid wallet address' });
        return;
      }

      if (typeof xp !== 'number' || xp < 0) {
        res.status(400).json({ error: 'Invalid XP amount' });
        return;
      }

      if (supabase && supabaseStatus === 'connected') {
        try {
          const { error } = await supabase
            .from('user_xp')
            .upsert({
              wallet_address: address.toLowerCase(),
              xp: xp,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'wallet_address'
            });
          
          if (error) {
            console.error('Supabase error:', error);
          }
        } catch (error) {
          console.error('XP update error:', error);
        }
      }
      
      res.json({ success: true, xp: xp });
      return;
    }

    // Challenges endpoints
    if (path.startsWith('/challenges/') && req.method === 'GET') {
      const address = path.split('/')[2];
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({ error: 'Invalid wallet address' });
        return;
      }

      res.json({
        progress: {},
        daily_stats: {},
        last_reset_date: null
      });
      return;
    }

    // Default response
    res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}; 