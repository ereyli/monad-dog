// API Service for Monad Dog App
// Uses localStorage for all data storage

class APIService {
  constructor() {
    // No API base URL needed - localStorage only
    this.offlineMode = false; // Always true now
  }

  // Check if currently in offline mode (always true)
  isOffline() {
    return true; // Always use localStorage
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

  // Get user XP from localStorage
  async getUserXP(address) {
    const localXP = this.getLocalData(`xp_${address}`, 0);
    console.log('📦 XP loaded from localStorage:', localXP);
    return localXP;
  }

  // Update user XP to localStorage
  async updateUserXP(address, xp) {
    this.setLocalData(`xp_${address}`, xp);
    console.log('💾 XP saved to localStorage:', xp);
    return { success: true, xp: xp };
  }

  // Get user stats from localStorage
  async getUserStats(address) {
    return this.getLocalData(`stats_${address}`, {});
  }

  // Get leaderboard from localStorage
  async getLeaderboard() {
    return this.getLocalData('leaderboard', []);
  }

  // Health check (always ok for localStorage)
  async healthCheck() {
    return { status: 'ok', localStorage: true };
  }

  // Collection methods from localStorage
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

  // Challenge progress methods from localStorage
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

  // Daily stats methods from localStorage
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

  // Test connection (always true for localStorage)
  async testConnection() {
    console.log('🧪 Testing localStorage connection...');
    return true; // localStorage is always available
  }
}

// Create global API instance
window.apiService = new APIService();