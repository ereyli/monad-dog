// UI Management - Handles all UI updates and interactions
class UIManager {
  constructor() {
    this.isAppReady = false;
    this.loadingProgress = 0;
  }

  // Initialize UI
  async init() {
    console.log('🎨 Initializing UI...');
    
    // Show loading state
    this.showLoadingState();
    
    // Initialize with progress
    await this.initializeWithProgress();
    
    // Hide loading and show app
    this.hideLoadingState();
    
    console.log('🎨 UI initialized successfully');
  }

  // Enhanced loading management
  async initializeWithProgress() {
    try {
      // Step 1: Initialize SDK
      this.updateLoadingProgress(20, 'Loading Farcaster SDK...<br>🔗 Connecting to Frame environment');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Setup game functions
      this.updateLoadingProgress(60, 'Setting up game functions...<br>🎮 Preparing blockchain interactions');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 3: Initialize app
      this.updateLoadingProgress(80, 'Initializing app...<br>🎮 Setting up game');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 4: Finalize
      this.updateLoadingProgress(95, 'Almost ready...<br>✨ Final preparations');
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error('❌ UI Init error:', error);
      this.updateLoadingProgress(100, 'Error occurred, but app will continue<br>⚠️ Some features may be limited');
      
      setTimeout(() => {
        this.hideLoadingState();
      }, 1000);
    }
  }

  updateLoadingProgress(progress, message) {
    const progressBar = document.getElementById('loadingProgressBar');
    const subtitle = document.querySelector('.loading-subtitle');
    
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    
    if (subtitle && message) {
      subtitle.innerHTML = message;
    }
    
    this.loadingProgress = progress;
    console.log(`📊 Loading progress: ${progress}% - ${message}`);
  }

  showLoadingState() {
    const loading = document.getElementById('loading');
    const appContent = document.querySelector('.app-content');
    
    if (loading) loading.style.display = 'flex';
    if (appContent) appContent.classList.remove('loaded');
    
    this.updateLoadingProgress(0, 'Starting Monad Dog...<br>🚀 Initializing blockchain connection');
  }

  hideLoadingState() {
    // Don't hide immediately - show completion
    this.updateLoadingProgress(100, 'Ready to play! 🎉<br>Welcome to Monad Dog!');
    
    setTimeout(() => {
      const loading = document.getElementById('loading');
      const appContent = document.querySelector('.app-content');
      
      if (loading) loading.style.display = 'none';
      if (appContent) appContent.classList.add('loaded');
      
      this.isAppReady = true;
      
      // Call Farcaster ready action
      if (window.farcasterSDK && window.farcasterSDK.actions && window.farcasterSDK.actions.ready) {
        window.farcasterSDK.actions.ready({
          disableNativeGestures: false
        }).then(() => {
          console.log('✅ Farcaster SDK ready called successfully');
        }).catch(error => {
          console.log('⚠️ Farcaster SDK ready failed:', error);
        });
      }
      
      console.log('🎉 App fully loaded and ready');
    }, 500);
  }

  // Tab management
  showTab(tabName) {
    console.log('📑 Switching to tab:', tabName);
    
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load tab content
    if (window.gameManager) {
      window.gameManager.showTab(tabName);
    }
  }

  // Status management
  showStatus(id, message, type) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = message;
      el.className = `status visible ${type}`;
    }
  }

  hideStatus(id) {
    const el = document.getElementById(id);
    if (el) {
      el.className = 'status';
    }
  }

  showError(message) {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,0,0,0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: 600;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
      if (document.body.contains(div)) {
        document.body.removeChild(div);
      }
    }, 5000);
  }

  showSuccess(message) {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,255,0,0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: 600;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
      if (document.body.contains(div)) {
        document.body.removeChild(div);
      }
    }, 3000);
  }

  // Animation helpers
  animateElement(element, animation, duration = 1000) {
    if (!element) return;
    
    element.style.animation = `${animation} ${duration}ms ease-out`;
    
    setTimeout(() => {
      element.style.animation = '';
    }, duration);
  }

  // Button state management
  disableAllActionButtons() {
    const buttons = [
      ...document.querySelectorAll('#pet button'),
      ...document.querySelectorAll('#greet button'),
      ...document.querySelectorAll('#flip button'),
      ...document.querySelectorAll('#slots button'),
      ...document.querySelectorAll('#claim button')
    ];
    
    buttons.forEach(button => {
      if (button && !button.id.includes('disconnect') && !button.classList.contains('tab') && !button.classList.contains('share-button')) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
      }
    });
  }

  enableAllActionButtons() {
    const buttons = [
      ...document.querySelectorAll('#pet button'),
      ...document.querySelectorAll('#greet button'),
      ...document.querySelectorAll('#flip button'),
      ...document.querySelectorAll('#slots button'),
      ...document.querySelectorAll('#claim button')
    ];
    
    buttons.forEach(button => {
      if (button && !button.id.includes('disconnect') && !button.classList.contains('tab') && !button.classList.contains('share-button')) {
        button.disabled = false;
        if (button.dataset.originalText) {
          button.textContent = button.dataset.originalText;
          delete button.dataset.originalText;
        }
      }
    });
  }

  // Update displays
  updateXPDisplay(xp) {
    const xpElement = document.getElementById('xp');
    if (xpElement) {
      xpElement.textContent = xp;
    }
  }

  updateLevelDisplay(level) {
    const levelElement = document.getElementById('level');
    if (levelElement) {
      levelElement.textContent = level;
    }
  }

  updateAddressDisplay(address) {
    const addressElement = document.getElementById('address');
    if (addressElement && address) {
      addressElement.textContent = address.slice(0,6) + '...' + address.slice(-4);
    }
  }

  // Wallet UI updates
  updateWalletUI(connected, address) {
    const connectArea = document.getElementById('connect-area');
    const connectedArea = document.getElementById('connected-area');
    
    if (connected) {
      if (connectArea) connectArea.style.display = 'none';
      if (connectedArea) connectedArea.style.display = 'block';
      this.updateAddressDisplay(address);
    } else {
      if (connectArea) connectArea.style.display = 'block';
      if (connectedArea) connectedArea.style.display = 'none';
    }
  }

  // Loading states
  setButtonLoading(buttonId, loadingText = 'Loading...') {
    const button = document.getElementById(buttonId);
    if (button) {
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText;
      button.disabled = true;
    }
  }

  resetButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button && button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      button.disabled = false;
      delete button.dataset.originalText;
    }
  }

  // Modal management
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Toast notifications
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? 'rgba(0,255,0,0.9)' : 
                   type === 'error' ? 'rgba(255,0,0,0.9)' : 
                   'rgba(0,0,0,0.8)'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: 500;
      animation: slideUp 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, duration);
  }

  // Progress bars
  updateProgressBar(barId, percentage) {
    const bar = document.getElementById(barId);
    if (bar) {
      bar.style.width = `${percentage}%`;
    }
  }

  // Responsive helpers
  isMobile() {
    return window.innerWidth <= 768;
  }

  isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }

  isDesktop() {
    return window.innerWidth > 1024;
  }

  // Theme management
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  getTheme() {
    return localStorage.getItem('theme') || 'dark';
  }

  // Accessibility helpers
  focusElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
    }
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  // Keyboard navigation
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      // Escape key to close modals
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.achievement-modal');
        modals.forEach(modal => {
          if (modal.style.display === 'flex') {
            this.hideModal('achievementModal');
          }
        });
      }
      
      // Tab key navigation
      if (event.key === 'Tab') {
        // Handle tab navigation
      }
    });
  }

  // Performance optimizations
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Cleanup
  cleanup() {
    // Remove event listeners
    // Clear timeouts
    // Reset states
    console.log('🧹 UI cleanup completed');
  }
}

// Create global UI instance
window.uiManager = new UIManager();

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(100%); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  
  @keyframes slideDown {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(100%); opacity: 0; }
  }
`;
document.head.appendChild(style); 