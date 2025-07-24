// API Service - Handles all backend communication
class APIService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.cache = new Map(); // Simple in-memory cache
    this.lastUpdate = {}; // Track last update time per address
    this.updateQueue = new Map(); // Queue for batched updates
  }

  // Generic request method with retry logic
  async request(endpoint, options = {}, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const url = `${this.baseURL}${endpoint}`;
        
        // Add cache busting for GET requests
        const finalUrl = options.method === 'GET' 
          ? `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`
          : url;
        
        const response = await fetch(finalUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            ...options.headers
          },
          mode: 'cors',
          credentials: 'same-origin',
          ...options
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.warn(`API request attempt ${attempt}/${retries} failed:`, error.message);
        
        // If it's the last attempt, throw the error
        if (attempt === retries) {
          console.error('API request failed after all retries:', error);
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }

  // Get user XP - ONLY from Supabase with caching
  async getUserXP(address) {
    const cacheKey = `xp_${address}`;
    const now = Date.now();
    
    // Check cache first (5 second cache)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < 5000) {
        console.log('📦 XP loaded from cache');
        return cached.data;
      }
    }
    
    try {
      const result = await this.request(`/xp/${address}`);
      const xp = result.xp || 0;
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: xp,
        timestamp: now
      });
      
      console.log('✅ XP loaded from Supabase and cached');
      return xp;
    } catch (error) {
      console.error('Failed to get XP from Supabase:', error);
      
      // Try localStorage as fallback
      try {
        const localXP = localStorage.getItem(`wallet_xp_${address}`);
        if (localXP) {
          console.log('📦 XP loaded from localStorage fallback');
          return parseInt(localXP) || 0;
        }
      } catch (localError) {
        console.warn('localStorage fallback failed:', localError);
      }
      
      return 0; // Return 0 if all methods fail
    }
  }

  // Update user XP - ONLY to Supabase with rate limiting
  async updateUserXP(address, xp) {
    const now = Date.now();
    const lastUpdate = this.lastUpdate[address] || 0;
    
    // Rate limiting: max 1 update per second per address
    if (now - lastUpdate < 1000) {
      console.log('⏱️ Rate limiting XP update, queuing...');
      this.updateQueue.set(address, xp);
      return { success: true, queued: true };
    }
    
    try {
      const result = await this.request(`/xp/${address}`, {
        method: 'POST',
        body: JSON.stringify({ xp })
      });
      
      // Update cache and timestamp
      this.cache.set(`xp_${address}`, {
        data: xp,
        timestamp: now
      });
      this.lastUpdate[address] = now;
      
      console.log('✅ XP updated in Supabase and cache');
      return result;
    } catch (error) {
      console.error('Failed to update XP in Supabase:', error);
      throw error;
    }
  }

  // Get user stats
  async getUserStats(address) {
    return this.request(`/stats/${address}`);
  }

  // Get leaderboard
  async getLeaderboard() {
    return this.request('/leaderboard');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Collection methods - ONLY from Supabase (like XP)
  async getOwnedDogs(address) {
    const cacheKey = `collection_${address}`;
    const now = Date.now();
    
    // Check cache first (5 second cache)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < 5000) {
        console.log('📦 Collection loaded from cache');
        return cached.data;
      }
    }
    
    try {
      const result = await this.request(`/collection/${address}`);
      console.log('📊 Raw collection result:', result);
      
      // Ensure we return an array
      let ownedDogs = [];
      if (result && result.owned_dogs) {
        if (Array.isArray(result.owned_dogs)) {
          ownedDogs = result.owned_dogs;
        } else if (typeof result.owned_dogs === 'string') {
          try {
            ownedDogs = JSON.parse(result.owned_dogs);
          } catch (e) {
            console.error('Failed to parse owned_dogs string:', e);
            ownedDogs = [];
          }
        }
      }
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: ownedDogs,
        timestamp: now
      });
      
      console.log('✅ Collection loaded from Supabase and cached');
      return ownedDogs;
    } catch (error) {
      console.error('Failed to get collection from Supabase:', error);
      return []; // Return empty array if API fails (like XP)
    }
  }

  async setOwnedDogs(address, dogs) {
    try {
      await this.request(`/collection/${address}`, {
        method: 'POST',
        body: JSON.stringify({ 
          owned_dogs: dogs,
          total_pets: this.getTotalPets(address) || 0
        })
      });
      
      // Update cache
      const cacheKey = `collection_${address}`;
      this.cache.set(cacheKey, {
        data: dogs,
        timestamp: Date.now()
      });
      
      console.log('✅ Collection saved to Supabase and cache updated');
    } catch (error) {
      console.error('Failed to save collection to Supabase:', error);
      throw error; // Throw error like XP does
    }
  }

  // Challenge progress methods - ONLY from Supabase (like XP)
  async getChallengeProgress(address) {
    const cacheKey = `challenges_${address}`;
    const now = Date.now();
    
    // Check cache first (5 second cache)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < 5000) {
        console.log('📦 Challenge progress loaded from cache');
        return cached.data;
      }
    }
    
    try {
      const result = await this.request(`/challenges/${address}`);
      const progress = result.progress || {};
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: progress,
        timestamp: now
      });
      
      console.log('✅ Challenge progress loaded from Supabase and cached');
      return progress;
    } catch (error) {
      console.error('Failed to get challenges from Supabase:', error);
      
      // Try localStorage as fallback
      try {
        const localProgress = localStorage.getItem(`challenge_progress_${address}`);
        if (localProgress) {
          console.log('📦 Challenge progress loaded from localStorage fallback');
          return JSON.parse(localProgress) || {};
        }
      } catch (localError) {
        console.warn('localStorage fallback failed:', localError);
      }
      
      return {}; // Return empty object if all methods fail
    }
  }

  async setChallengeProgress(address, progress) {
    try {
      await this.request(`/challenges/${address}`, {
        method: 'POST',
        body: JSON.stringify({ 
          progress: progress,
          daily_stats: this.getDailyStats(address) || {},
          last_reset_date: new Date().toDateString()
        })
      });
      
      // Update cache
      const cacheKey = `challenges_${address}`;
      this.cache.set(cacheKey, {
        data: progress,
        timestamp: Date.now()
      });
      
      console.log('✅ Challenge progress saved to Supabase and cache updated');
    } catch (error) {
      console.error('Failed to save challenges to Supabase:', error);
      throw error; // Throw error like XP does
    }
  }

  // Daily stats methods - ONLY from Supabase (like XP)
  async getDailyStats(address) {
    const cacheKey = `daily_stats_${address}`;
    const now = Date.now();
    
    // Check cache first (5 second cache)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < 5000) {
        console.log('📦 Daily stats loaded from cache');
        return cached.data;
      }
    }
    
    try {
      const result = await this.request(`/challenges/${address}`);
      const dailyStats = result.daily_stats || {};
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: dailyStats,
        timestamp: now
      });
      
      console.log('✅ Daily stats loaded from Supabase and cached');
      return dailyStats;
    } catch (error) {
      console.error('Failed to get daily stats from Supabase:', error);
      
      // Try localStorage as fallback
      try {
        const localStats = localStorage.getItem(`daily_stats_${address}`);
        if (localStats) {
          console.log('📦 Daily stats loaded from localStorage fallback');
          return JSON.parse(localStats) || {};
        }
      } catch (localError) {
        console.warn('localStorage fallback failed:', localError);
      }
      
      return {}; // Return empty object if all methods fail
    }
  }

  async setDailyStats(address, stats) {
    try {
      await this.request(`/challenges/${address}`, {
        method: 'POST',
        body: JSON.stringify({ 
          progress: this.getChallengeProgress(address) || {},
          daily_stats: stats,
          last_reset_date: new Date().toDateString()
        })
      });
      
      // Update cache
      const cacheKey = `daily_stats_${address}`;
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });
      
      console.log('✅ Daily stats saved to Supabase and cache updated');
    } catch (error) {
      console.error('Failed to save daily stats to Supabase:', error);
      throw error; // Throw error like XP does
    }
  }

  // Get DOG balance from localStorage
  getDogBalance(address) {
    const key = CONFIG.STORAGE_KEYS.DOG_BALANCE + address.toLowerCase();
    return localStorage.getItem(key) || '0';
  }

  setDogBalance(address, balance) {
    const key = CONFIG.STORAGE_KEYS.DOG_BALANCE + address.toLowerCase();
    localStorage.setItem(key, balance);
  }

  // Get total pets from localStorage
  getTotalPets(address) {
    const key = CONFIG.STORAGE_KEYS.TOTAL_PETS + address.toLowerCase();
    return parseInt(localStorage.getItem(key) || '0');
  }

  setTotalPets(address, total) {
    const key = CONFIG.STORAGE_KEYS.TOTAL_PETS + address.toLowerCase();
    localStorage.setItem(key, total.toString());
  }
}

// Create global API instance
window.apiService = new APIService(); 