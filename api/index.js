// Vercel Serverless Function for API
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = 'https://uhqszfoekqrjtybrwqzt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key-here';

let supabase = null;
let supabaseStatus = 'disconnected';

const initializeSupabase = async () => {
  try {
    console.log('🔧 Initializing Supabase connection...');
    console.log('🔑 URL:', supabaseUrl);
    console.log('🔑 Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Missing');
    
    if (!supabaseKey || supabaseKey === 'your-supabase-anon-key-here') {
      console.log('⚠️ Supabase key not configured');
      supabaseStatus = 'no_credentials';
      return;
    }
    
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
      console.log('🔍 Error details:', error);
      supabaseStatus = 'connection_failed';
      supabase = null;
    } else {
      console.log('✅ Supabase connected successfully');
      supabaseStatus = 'connected';
    }
  } catch (error) {
    console.log('⚠️ Supabase initialization failed:', error.message);
    console.log('🔍 Full error:', error);
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

      if (supabase && supabaseStatus === 'connected') {
        try {
          // Get challenge progress
          const { data: challengeData, error: challengeError } = await supabase
            .from('challenge_progress')
            .select('challenge_id, progress, completed')
            .eq('wallet_address', address.toLowerCase());

          // Get user stats
          const { data: statsData, error: statsError } = await supabase
            .from('user_stats')
            .select('daily_pets, daily_greets, daily_flips, daily_slots, last_reset_date')
            .eq('wallet_address', address.toLowerCase())
            .single();

          if (challengeError && challengeError.code !== 'PGRST116') {
            console.error('Challenge progress error:', challengeError);
          }
          if (statsError && statsError.code !== 'PGRST116') {
            console.error('User stats error:', statsError);
          }

          // Convert challenge data to progress object
          const progress = {};
          if (challengeData) {
            challengeData.forEach(challenge => {
              progress[challenge.challenge_id] = challenge.progress;
            });
          }

          // Convert stats data to daily_stats object
          const daily_stats = statsData ? {
            pets: statsData.daily_pets || 0,
            greets: statsData.daily_greets || 0,
            flips: statsData.daily_flips || 0,
            slots: statsData.daily_slots || 0
          } : {};

          res.json({
            progress: progress,
            daily_stats: daily_stats,
            last_reset_date: statsData?.last_reset_date || null
          });
        } catch (error) {
          console.error('Challenges fetch error:', error);
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
      return;
    }

    if (path.startsWith('/challenges/') && req.method === 'POST') {
      const address = path.split('/')[2];
      const { progress, daily_stats, last_reset_date } = req.body;
      
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({ error: 'Invalid wallet address' });
        return;
      }

      if (supabase && supabaseStatus === 'connected') {
        try {
          // Update challenge progress
          if (progress && typeof progress === 'object') {
            for (const [challengeId, challengeProgress] of Object.entries(progress)) {
              const { error } = await supabase
                .from('challenge_progress')
                .upsert({
                  wallet_address: address.toLowerCase(),
                  challenge_id: challengeId,
                  progress: challengeProgress,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'wallet_address,challenge_id'
                });
              
              if (error) {
                console.error(`Challenge progress update error for ${challengeId}:`, error);
              }
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
                last_reset_date: last_reset_date ? new Date(last_reset_date) : new Date(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'wallet_address'
              });
            
            if (error) {
              console.error('User stats update error:', error);
            }
          }

          console.log(`📝 Challenge progress update for ${address}:`, { progress, daily_stats, last_reset_date });
          
          res.json({ 
            success: true, 
            progress: progress || {},
            daily_stats: daily_stats || {},
            last_reset_date: last_reset_date || new Date().toDateString()
          });
        } catch (error) {
          console.error('Challenges update error:', error);
          res.status(500).json({ error: 'Failed to update challenges' });
        }
      } else {
        res.json({ 
          success: true, 
          progress: progress || {},
          daily_stats: daily_stats || {},
          last_reset_date: last_reset_date || new Date().toDateString()
        });
      }
      return;
    }

    // Collection endpoints
    if (path.startsWith('/collection/') && req.method === 'GET') {
      const address = path.split('/')[2];
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({ error: 'Invalid wallet address' });
        return;
      }

      if (supabase && supabaseStatus === 'connected') {
        try {
          const { data, error } = await supabase
            .from('dog_collection')
            .select('dog_id, unlocked_at')
            .eq('wallet_address', address.toLowerCase())
            .order('unlocked_at', { ascending: true });

          if (error) {
            console.error('Collection fetch error:', error);
          }

          // Convert to array of dog IDs
          const dogs = data ? data.map(item => item.dog_id) : [];
          
          console.log(`📦 Collection request for ${address}:`, dogs);
          res.json(dogs);
        } catch (error) {
          console.error('Collection fetch error:', error);
          res.json([]);
        }
      } else {
        res.json([]);
      }
      return;
    }

    if (path.startsWith('/collection/') && req.method === 'POST') {
      const address = path.split('/')[2];
      const { dogs } = req.body;
      
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({ error: 'Invalid wallet address' });
        return;
      }

      if (supabase && supabaseStatus === 'connected') {
        try {
          // Clear existing collection
          const { error: deleteError } = await supabase
            .from('dog_collection')
            .delete()
            .eq('wallet_address', address.toLowerCase());

          if (deleteError) {
            console.error('Collection delete error:', deleteError);
          }

          // Insert new dogs
          if (dogs && Array.isArray(dogs) && dogs.length > 0) {
            const dogRecords = dogs.map(dogId => ({
              wallet_address: address.toLowerCase(),
              dog_id: dogId,
              unlocked_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase
              .from('dog_collection')
              .insert(dogRecords);

            if (insertError) {
              console.error('Collection insert error:', insertError);
            }
          }

          console.log(`📦 Collection update for ${address}:`, { dogs });
          
          res.json({ 
            success: true, 
            dogs: dogs || []
          });
        } catch (error) {
          console.error('Collection update error:', error);
          res.status(500).json({ error: 'Failed to update collection' });
        }
      } else {
        res.json({ 
          success: true, 
          dogs: dogs || []
        });
      }
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