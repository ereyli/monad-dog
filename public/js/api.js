// API Service for Monad Dog App
// Now uses localStorage instead of Supabase for reliability

class APIService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.offlineMode = false;
    this.pendingUpdates = new Map();
    this.lastUpdate = {};
    this.cache = new Map();
    this.connectionTestInterval = null;
  }

  // Check if currently in offline mode
  isOffline() {
    return this.offlineMode;
  }

  // Enable offline mode
  enableOfflineMode() {
    if (!this.offlineMode) {
      this.offlineMode = true;
      console.log('🔄 Offline mode enabled - using localStorage');
      this.startConnectionTest();
    }
  }

  // Disable offline mode
  disableOfflineMode() {
    if (this.offlineMode) {
      this.offlineMode = false;
      console.log('🔄 Offline mode disabled - using API');
      this.stopConnectionTest();
    }
  }

  // Start periodic connection test
  startConnectionTest() {
    if (this.connectionTestInterval) {
      clearInterval(this.connectionTestInterval);
    }
    
    this.connectionTestInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.baseURL}/health`);
        if (response.ok) {
          console.log('🔄 API connection restored');
          this.disableOfflineMode();
          await this.syncPendingUpdates();
        }
      } catch (error) {
        // API still down, stay in offline mode
      }
    }, 30000); // Check every 30 seconds
  }

  // Stop connection test
  stopConnectionTest() {
    if (this.connectionTestInterval) {
      clearInterval(this.connectionTestInterval);
      this.connectionTestInterval = null;
    }
  }

  // Get data from local storage
  getLocalData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.warn('Failed to get local data:', error);
      return defaultValue;
    }
  }

  // Set data to local storage
  setLocalData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Failed to set local data:', error);
      return false;
    }
  }

  // Get user XP - ONLY from localStorage
  async getUserXP(address) {
    const localXP = this.getLocalData(`xp_${address}`, 0);
    console.log('📦 XP loaded from localStorage:', localXP);
    return localXP;
  }

  // Update user XP - ONLY to localStorage
  async updateUserXP(address, xp) {
    this.setLocalData(`xp_${address}`, xp);
    console.log('💾 XP saved to localStorage:', xp);
    return { success: true, xp: xp };
  }

  // Get user stats
  async getUserStats(address) {
    return this.getLocalData(`stats_${address}`, {});
  }

  // Get leaderboard
  async getLeaderboard() {
    return this.getLocalData('leaderboard', []);
  }

  // Health check
  async healthCheck() {
    return { status: 'ok', localStorage: true };
  }

  // Collection methods - ONLY from localStorage
  async getOwnedDogs(address) {
    const localDogs = this.getLocalData(`collection_${address}`, []);
    console.log('📦 Collection loaded from localStorage:', localDogs);
    return localDogs;
  }

  async setOwnedDogs(address, dogs) {
    this.setLocalData(`collection_${address}`, dogs);
    console.log('💾 Collection saved to localStorage:', dogs);
    return { success: true, dogs: dogs };
  }

  // Challenge progress methods - ONLY from localStorage
  async getChallengeProgress(address) {
    const localProgress = this.getLocalData(`challenges_${address}`, {});
    console.log('📦 Challenge progress loaded from localStorage:', localProgress);
    return localProgress;
  }

  async setChallengeProgress(address, progress, dailyStats = null) {
    this.setLocalData(`challenges_${address}`, progress);
    console.log('💾 Challenge progress saved to localStorage:', progress);
    return { success: true, progress: progress };
  }

  // Daily stats methods - ONLY from localStorage
  async getDailyStats(address) {
    const localStats = this.getLocalData(`daily_stats_${address}`, {});
    console.log('📦 Daily stats loaded from localStorage:', localStats);
    return localStats;
  }

  async setDailyStats(address, stats, progress = null) {
    this.setLocalData(`daily_stats_${address}`, stats);
    console.log('💾 Daily stats saved to localStorage:', stats);
    return { success: true, stats: stats };
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

  // Test API connection (simplified)
  async testConnection() {
    console.log('🧪 Testing localStorage connection...');
    return true; // localStorage is always available
  }

  // Sync pending updates (not needed for localStorage)
  async syncPendingUpdates() {
    console.log('📦 No pending updates to sync (localStorage mode)');
    return;
  }
}

// Create global API instance
window.apiService = new APIService();