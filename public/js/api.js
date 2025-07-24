// API Service - Handles all backend communication
class APIService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.cache = new Map(); // Simple in-memory cache
    this.lastUpdate = {}; // Track last update time per address
    this.updateQueue = new Map(); // Queue for batched updates
    this.offlineMode = false; // Track if we're in offline mode
    this.pendingUpdates = new Map(); // Store updates when offline
  }

  // Check if we're in offline mode
  isOffline() {
    return this.offlineMode;
  }

  // Enable offline mode
  enableOfflineMode() {
    this.offlineMode = true;
    console.log('🔄 API offline mode enabled - using local storage fallback');
  }

  // Disable offline mode
  disableOfflineMode() {
    this.offlineMode = false;
    console.log('🔄 API online mode restored');
  }

  // Get data from local storage as fallback
  getLocalData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.warn('Failed to get local data:', error);
      return defaultValue;
    }
  }

  // Set data to local storage as fallback
  setLocalData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Failed to set local data:', error);
      return false;
    }
  }

  // Generic request method with retry logic and fallback
  async request(endpoint, options = {}, retries = 3) {
    const endpoints = [
      `${this.baseURL}${endpoint}`,
      // Fallback endpoints if main API is blocked
      `https://monad-snowy.vercel.app/api${endpoint}`,
      `https://monad-snowy.vercel.app/api/v1${endpoint}`
    ];

    for (let endpointIndex = 0; endpointIndex < endpoints.length; endpointIndex++) {
      const baseUrl = endpoints[endpointIndex];
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const url = baseUrl;
          
          // Add cache busting for GET requests with random parameter
          const cacheBuster = `_cb=${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const finalUrl = options.method === 'GET' 
            ? `${url}${url.includes('?') ? '&' : '?'}${cacheBuster}`
            : url;
          
          // Use more ad-blocker-friendly headers
          const requestOptions = {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'User-Agent': 'MonadDogApp/1.0',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
              ...options.headers
            },
            mode: 'cors',
            credentials: 'same-origin',
            ...options
          };

          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          requestOptions.signal = controller.signal;
          
          console.log(`🔄 Trying endpoint ${endpointIndex + 1}/${endpoints.length}, attempt ${attempt}/${retries}: ${finalUrl}`);
          
          const response = await fetch(finalUrl, requestOptions);
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          console.log(`✅ Success with endpoint ${endpointIndex + 1}: ${finalUrl}`);
          return await response.json();
        } catch (error) {
          console.warn(`❌ Endpoint ${endpointIndex + 1}, attempt ${attempt}/${retries} failed:`, error.message);
          
          // Check if it's a blocking error
          if (error.message.includes('ERR_BLOCKED_BY_CLIENT') || 
              error.message.includes('Failed to fetch') ||
              error.message.includes('ERR_NETWORK') ||
              error.name === 'AbortError') {
            console.warn('⚠️ Request blocked by client (ad blocker?) or timed out, will retry...');
          }
          
          // If it's the last attempt for this endpoint, try the next endpoint
          if (attempt === retries) {
            if (endpointIndex < endpoints.length - 1) {
              console.log(`🔄 Switching to fallback endpoint ${endpointIndex + 2}/${endpoints.length}`);
              break; // Try next endpoint
            } else {
              console.error('API request failed after all endpoints and retries:', error);
              throw error;
            }
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }
  }

  // Sync pending updates when API becomes available
  async syncPendingUpdates() {
    if (this.pendingUpdates.size === 0) {
      console.log('📦 No pending updates to sync');
      return;
    }

    console.log(`🔄 Syncing ${this.pendingUpdates.size} pending updates...`);
    
    const updates = Array.from(this.pendingUpdates.values());
    this.pendingUpdates.clear();
    
    for (const update of updates) {
      try {
        await this.updateUserXP(update.address, update.xp);
        console.log(`✅ Synced XP update for ${update.address}`);
      } catch (error) {
        console.error(`❌ Failed to sync XP update for ${update.address}:`, error);
        // Re-queue failed updates
        this.pendingUpdates.set(`xp_${update.address}`, update);
      }
    }
    
    console.log(`🔄 Sync completed. ${this.pendingUpdates.size} updates remaining.`);
  }

  // Test API connection
  async testConnection() {
    try {
      console.log('🧪 Testing API connection...');
      const result = await this.request('/health');
      console.log('✅ API connection successful:', result);
      
      // If we were in offline mode, try to sync pending updates
      if (this.offlineMode) {
        this.disableOfflineMode();
        await this.syncPendingUpdates();
      }
      
      return true;
    } catch (error) {
      console.error('❌ API connection failed:', error);
      
      // Enable offline mode if API is blocked
      if (error.message.includes('ERR_BLOCKED_BY_CLIENT') || 
          error.message.includes('Failed to fetch')) {
        this.enableOfflineMode();
      }
      
      return false;
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
    
    // If in offline mode, use local storage
    if (this.offlineMode) {
      const localXP = this.getLocalData(`xp_${address}`, 0);
      console.log('📦 XP loaded from local storage (offline mode)');
      return localXP;
    }
    
    try {
      const result = await this.request(`/xp/${address}`);
      const xp = result.xp || 0;
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: xp,
        timestamp: now
      });
      
      // Also save to local storage as backup
      this.setLocalData(`xp_${address}`, xp);
      
      console.log('✅ XP loaded from Supabase and cached');
      return xp;
    } catch (error) {
      console.error('Failed to get XP from Supabase:', error);
      
      // Enable offline mode if API is blocked
      if (error.message.includes('ERR_BLOCKED_BY_CLIENT') || 
          error.message.includes('Failed to fetch')) {
        this.enableOfflineMode();
      }
      
      // Try to get from local storage as fallback
      const localXP = this.getLocalData(`xp_${address}`, 0);
      console.log('📦 XP loaded from local storage (fallback)');
      return localXP;
    }
  }

  // Update user XP - ONLY to Supabase with rate limiting
  async updateUserXP(address, xp) {
    const now = Date.now();
    const lastUpdate = this.lastUpdate[address] || 0;
    
    // Rate limiting: max 1 update per second per address
    if (now - lastUpdate < 1000) {
      console.log('⏱️ Rate limiting XP update');
      return;
    }
    
    // If in offline mode, save locally and queue for later
    if (this.offlineMode) {
      this.setLocalData(`xp_${address}`, xp);
      this.pendingUpdates.set(`xp_${address}`, { address, xp, timestamp: now });
      console.log('💾 XP saved locally (offline mode)');
      return;
    }
    
    try {
      const result = await this.request(`/xp/${address}`, {
        method: 'PUT',
        body: JSON.stringify({ xp })
      });
      
      this.lastUpdate[address] = now;
      
      // Update cache
      this.cache.set(`xp_${address}`, {
        data: xp,
        timestamp: now
      });
      
      // Also save to local storage as backup
      this.setLocalData(`xp_${address}`, xp);
      
      console.log('✅ XP updated in Supabase');
      return result;
    } catch (error) {
      console.error('Failed to update XP in Supabase:', error);
      
      // Enable offline mode if API is blocked
      if (error.message.includes('ERR_BLOCKED_BY_CLIENT') || 
          error.message.includes('Failed to fetch')) {
        this.enableOfflineMode();
      }
      
      // Save locally as fallback
      this.setLocalData(`xp_${address}`, xp);
      this.pendingUpdates.set(`xp_${address}`, { address, xp, timestamp: now });
      console.log('💾 XP saved locally (fallback)');
      
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
      return {}; // Return empty object if API fails
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
      return {}; // Return empty object if API fails
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