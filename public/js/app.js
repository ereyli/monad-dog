// Main App - Coordinates all modules and initializes the application
class MonadDogApp {
  constructor() {
    this.isInitialized = false;
    this.modules = {
      ui: null,
      game: null,
      api: null
    };
  }

  // Initialize the entire application
  async init() {
    try {
      console.log('🚀 Starting Monad Dog App...');
      
      // Initialize UI first
      this.modules.ui = window.uiManager;
      await this.modules.ui.init();
      
      // Initialize Game Manager
      this.modules.game = window.gameManager;
      await this.modules.game.init();
      
      // Initialize API Service
      this.modules.api = window.apiService;
      
      // Setup global event listeners
      this.setupGlobalEventListeners();
      
      // Load initial tab content
      this.modules.game.loadTabContent('pet');
      
      // Setup keyboard navigation
      this.modules.ui.setupKeyboardNavigation();
      
      // Set theme
      const savedTheme = this.modules.ui.getTheme();
      this.modules.ui.setTheme(savedTheme);
      
      this.isInitialized = true;
      console.log('✅ Monad Dog App initialized successfully!');
      
      // Show welcome message
      setTimeout(() => {
        this.modules.ui.showToast('Welcome to Monad Dog! 🐕', 'success', 3000);
      }, 1000);
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.modules.ui.showError('Failed to initialize app. Please refresh the page.');
    }
  }

  // Setup global event listeners
  setupGlobalEventListeners() {
    // Window resize handler
    window.addEventListener('resize', this.modules.ui.debounce(() => {
      this.handleResize();
    }, 250));

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 App backgrounded');
      } else {
        console.log('📱 App foregrounded');
        this.refreshData();
      }
    });

    // Online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Back online');
      this.modules.ui.showToast('Connection restored! 🌐', 'success');
      this.refreshData();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Gone offline');
      this.modules.ui.showToast('Connection lost. Working offline... 📴', 'error');
    });

    // Error handling
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.modules.ui.showError('An unexpected error occurred');
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.modules.ui.showError('An operation failed unexpectedly');
    });
  }

  // Handle window resize
  handleResize() {
    const isMobile = this.modules.ui.isMobile();
    const isTablet = this.modules.ui.isTablet();
    const isDesktop = this.modules.ui.isDesktop();
    
    console.log(`📱 Screen size: ${window.innerWidth}x${window.innerHeight} (${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'})`);
    
    // Adjust UI based on screen size
    if (isMobile) {
      document.body.classList.add('mobile');
      document.body.classList.remove('tablet', 'desktop');
    } else if (isTablet) {
      document.body.classList.add('tablet');
      document.body.classList.remove('mobile', 'desktop');
    } else {
      document.body.classList.add('desktop');
      document.body.classList.remove('mobile', 'tablet');
    }
  }

  // Refresh data when app comes back to foreground
  async refreshData() {
    if (!this.modules.game.appState.connected) return;
    
    try {
      console.log('🔄 Refreshing data...');
      
      // Refresh XP and stats
      await this.modules.game.loadUserData();
      
      // Update displays
      this.modules.ui.updateXPDisplay(this.modules.game.appState.xp);
      this.modules.ui.updateLevelDisplay(this.modules.game.appState.level);
      
      console.log('✅ Data refreshed');
    } catch (error) {
      console.error('❌ Data refresh failed:', error);
    }
  }

  // Get app status
  getStatus() {
    return {
      initialized: this.isInitialized,
      connected: this.modules.game?.appState.connected || false,
      address: this.modules.game?.appState.address || null,
      xp: this.modules.game?.appState.xp || 0,
      level: this.modules.game?.appState.level || 1,
      activeTab: this.modules.game?.activeTab || 'pet'
    };
  }

  // Export functions for global access
  exportGlobalFunctions() {
    // Tab functions
    window.showTab = (tabName) => {
      this.modules.game.showTab(tabName);
    };

    // Game functions
    window.petDog = () => this.modules.game.petDog();
    window.sayGM = () => this.modules.game.sayGM();
    window.sayGN = () => this.modules.game.sayGN();
    window.flipCoin = () => this.modules.game.flipCoin();
    window.playSlots = () => this.modules.game.playSlots();
    window.claimTokens = () => this.modules.game.claimTokens();

    // Wallet functions
    window.connectWallet = () => this.modules.game.connectWallet();
    window.disconnect = () => this.modules.game.disconnect();

    // Sharing functions
    window.shareCollection = () => this.modules.game.shareCollection();
    window.shareChallenges = () => this.modules.game.shareChallenges();
    window.shareCurrentAchievement = () => this.modules.game.shareCurrentAchievement();

    // Modal functions
    window.closeAchievementModal = () => this.modules.game.closeAchievementModal();

    // Legacy sharing functions (for compatibility)
    window.sharePetAchievement = () => {
      this.modules.ui.showToast('Pet achievement shared! 🐕', 'success');
    };
    window.shareGreetAchievement = () => {
      this.modules.ui.showToast('Greet achievement shared! 👋', 'success');
    };
    window.shareFlipAchievement = () => {
      this.modules.ui.showToast('Flip achievement shared! 🪙', 'success');
    };
    window.shareSlotsAchievement = () => {
      this.modules.ui.showToast('Slots achievement shared! 🎰', 'success');
    };
  }

  // Cleanup on page unload
  cleanup() {
    console.log('🧹 Cleaning up Monad Dog App...');
    
    // Cleanup modules
    if (this.modules.ui) this.modules.ui.cleanup();
    if (this.modules.game) this.modules.game.cleanup();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('online', this.refreshData);
    window.removeEventListener('offline', this.refreshData);
    
    console.log('✅ Cleanup completed');
  }
}

// Initialize app when DOM is ready
async function initializeApp() {
  try {
    // Create app instance
    window.monadDogApp = new MonadDogApp();
    
    // Export global functions
    window.monadDogApp.exportGlobalFunctions();
    
    // Initialize the app
    await window.monadDogApp.init();
    
    // Setup cleanup on page unload
    window.addEventListener('beforeunload', () => {
      window.monadDogApp.cleanup();
    });
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255,0,0,0.9);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 10000;
      text-align: center;
    `;
    errorDiv.innerHTML = `
      <h3>❌ App Failed to Load</h3>
      <p>Please refresh the page to try again.</p>
      <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; border: none; border-radius: 4px; background: white; color: red; cursor: pointer;">
        Refresh Page
      </button>
    `;
    document.body.appendChild(errorDiv);
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for debugging
window.MonadDogApp = MonadDogApp;

console.log('📱 Monad Dog App script loaded'); 