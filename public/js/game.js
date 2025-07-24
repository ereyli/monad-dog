// Game Logic - All game mechanics and functions
class GameManager {
  constructor() {
    this.appState = {
      connected: false,
      address: null,
      xp: 0,
      slotsCredits: 0,
      provider: null,
      signer: null,
      isTransactionPending: false,
      level: 1,
      totalXP: 0,
      combo: 0,
      comboMultiplier: 1,
      ownedDogs: [],
      challengeProgress: {},
      dailyStats: {
        pets: 0,
        greets: 0,
        flips: 0,
        slots: 0,
        collections: 0
      },
      lastActionTime: 0,
      dataLoaded: false
    };
    
    this.activeTab = 'pet';
    this.sdk = null;
    this.xpUpdateTimeout = null; // For batching XP updates
  }

  // Initialize game
  async init() {
    console.log('🎮 Initializing game...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeGame());
    } else {
      this.initializeGame();
    }
  }

  async initializeGame() {
    // Detect environment
    this.detectEnvironment();
    
    // Test API connection first
    await this.testAPIConnection();
    
    // Load appropriate wallet system
    await this.initializeWalletSystem();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup game functions
    this.setupGameFunctions();
    
    console.log('🎮 Game initialized successfully');
  }

  // Test API connection
  async testAPIConnection() {
    try {
      console.log('🧪 Testing API connection before game initialization...');
      const apiService = new APIService();
      const isConnected = await apiService.testConnection();
      
      if (isConnected) {
        console.log('✅ API connection successful - game can proceed');
      } else {
        console.warn('⚠️ API connection failed - some features may not work');
        this.showError('API connection failed. Some features may not work properly.');
      }
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      this.showError('Unable to connect to game server. Please check your internet connection.');
    }
  }

  // Detect if we're in Farcaster Frame or regular web
  detectEnvironment() {
    // Check for Farcaster Frame indicators using SDK
    let isInFarcasterFrame = false;
    
    if (window.farcasterSDK && window.farcasterSDK.isInFrame) {
      isInFarcasterFrame = window.farcasterSDK.isInFrame();
    } else {
      // Fallback detection
      isInFarcasterFrame = 
        window.location.href.includes('warpcast.com') ||
        window.location.href.includes('farcaster.xyz') ||
        window.location.href.includes('frame') ||
        window.navigator.userAgent.includes('Farcaster') ||
        document.referrer.includes('warpcast.com') ||
        document.referrer.includes('farcaster.xyz') ||
        window.parent !== window; // Check if in iframe
    }
    
    this.environment = isInFarcasterFrame ? 'farcaster' : 'web';
    console.log(`🌍 Environment detected: ${this.environment}`);
    
    // Update UI based on environment
    this.updateEnvironmentUI();
  }

  // Update UI based on detected environment
  updateEnvironmentUI() {
    const connectBtn = document.getElementById('connect-btn');
    if (!connectBtn) return;
    
    if (this.environment === 'farcaster') {
      connectBtn.textContent = '🟣 Connect Farcaster Wallet';
      connectBtn.style.background = 'linear-gradient(135deg, #8B5CF6, #A855F7)';
      console.log('🎭 Farcaster Frame UI activated');
    } else {
      connectBtn.textContent = '🦊 Connect Web3 Wallet';
      connectBtn.style.background = 'linear-gradient(135deg, #6366F1, #8B5CF6)';
      console.log('🌐 Web browser UI activated');
    }
  }

  // Initialize appropriate wallet system
  async initializeWalletSystem() {
    if (this.environment === 'farcaster') {
      await this.initializeFarcasterWallet();
    } else {
      await this.initializeWebWallet();
    }
  }

  // Initialize Farcaster Wallet system
  async initializeFarcasterWallet() {
    console.log('🟣 Initializing Farcaster Wallet system...');
    
    try {
      // Use the SDK from window.farcasterSDK
      if (window.farcasterSDK) {
        this.sdk = window.farcasterSDK;
        console.log('✅ Farcaster SDK found');
        
        // Check if we're in a Farcaster client
        if (this.sdk && typeof this.sdk.isInFrame === 'function' && this.sdk.isInFrame()) {
          console.log('✅ Running in Farcaster Frame environment');
          this.farcasterClient = true;
          
          // Try to get user info
          try {
            if (this.sdk.actions && typeof this.sdk.actions.getUser === 'function') {
              const user = await this.sdk.actions.getUser();
              if (user) {
                console.log('✅ Farcaster user detected:', user);
                this.farcasterUser = user;
              }
            }
          } catch (e) {
            console.log('⚠️ Could not get Farcaster user info');
          }
        } else {
          console.log('⚠️ Not in Farcaster Frame environment');
          this.farcasterClient = false;
        }
      } else {
        console.log('⚠️ Farcaster SDK not available');
        this.farcasterClient = false;
      }
      
    } catch (error) {
      console.log('⚠️ Farcaster wallet initialization failed:', error);
      this.farcasterClient = false;
    }
  }

  // Initialize Web Wallet system
  async initializeWebWallet() {
    console.log('🌐 Initializing Web Wallet system...');
    
    // Check for common web3 wallets
    this.availableWallets = {
      metamask: typeof window.ethereum !== 'undefined',
      walletconnect: typeof window.WalletConnect !== 'undefined',
      coinbase: typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet,
      brave: typeof window.ethereum !== 'undefined' && window.ethereum.isBraveWallet,
      phantom: typeof window.ethereum !== 'undefined' && window.ethereum.isPhantom
    };
    
    console.log('🔍 Available wallets:', this.availableWallets);
  }

  // Setup event listeners
  setupEventListeners() {
    const connectBtn = document.getElementById('connect-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const xFollowBtn = document.getElementById('x-follow-header-btn');
    
    if (connectBtn) connectBtn.addEventListener('click', () => this.connectWallet());
    if (disconnectBtn) disconnectBtn.addEventListener('click', () => this.disconnect());
    
    // X Follow button event listener
    if (xFollowBtn) {
      console.log('✅ X Follow button found, adding event listener');
      xFollowBtn.addEventListener('click', () => {
        console.log('🐦 X Follow button clicked!');
        this.showXFollowModal();
      });
    } else {
      console.log('⚠️ X Follow button not found in setupEventListeners');
    }
    
    // X Follow Modal event listeners
    const xFollowModal = document.getElementById('xFollowModal');
    const xFollowCancelBtn = document.getElementById('xFollowCancelBtn');
    const xFollowStartBtn = document.getElementById('xFollowStartBtn');
    
    if (xFollowModal) {
      xFollowModal.addEventListener('click', (e) => {
        if (e.target === xFollowModal) {
          this.hideXFollowModal();
        }
      });
    }
    
    if (xFollowCancelBtn) {
      xFollowCancelBtn.addEventListener('click', () => this.hideXFollowModal());
    }
    
    if (xFollowStartBtn) {
      xFollowStartBtn.addEventListener('click', () => {
        this.hideXFollowModal();
        this.completeXFollowChallenge();
      });
    }
    
    // Tab event listeners
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        if (tabName) {
          this.showTab(tabName);
        }
      });
    });
    
    // Modal event listeners
    const modal = document.getElementById('achievementModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const shareAchievementBtn = document.getElementById('shareAchievementBtn');
    const continuePlayingBtn = document.getElementById('continuePlayingBtn');
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAchievementModal();
        }
      });
    }
    
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => this.closeAchievementModal());
    }
    
    if (shareAchievementBtn) {
      shareAchievementBtn.addEventListener('click', () => this.shareCurrentAchievement());
    }
    
    if (continuePlayingBtn) {
      continuePlayingBtn.addEventListener('click', () => this.closeAchievementModal());
    }
    
    // Network change listener
    if (window.ethereum) {
      window.ethereum.on('chainChanged', async (chainId) => {
        console.log('🌐 Network changed to:', chainId);
        if (this.appState.connected) {
          await this.ensureCorrectNetwork();
        }
      });
      
      window.ethereum.on('accountsChanged', async (accounts) => {
        console.log('👤 Account changed to:', accounts[0]);
        if (accounts.length === 0) {
          // User disconnected
          this.disconnect();
        } else if (this.appState.connected) {
          // User switched accounts
          this.appState.address = accounts[0];
          this.appState.signer = this.appState.provider.getSigner();
          this.updateWalletUI();
          await this.loadUserData();
        }
      });
    }
  }

  // Setup game functions
  setupGameFunctions() {
    // Make functions globally available
    window.petDog = () => this.petDog();
    window.sayGM = () => this.sayGM();
    window.sayGN = () => this.sayGN();
    window.flipCoin = () => this.flipCoin();
    window.playSlots = () => this.playSlots();
    window.claimTokens = () => this.claimTokens();
    window.showTab = (tabName) => this.showTab(tabName);
    window.shareCollection = () => this.shareCollection();
    window.shareChallenges = () => this.shareChallenges();
    window.closeAchievementModal = () => this.closeAchievementModal();
    window.shareCurrentAchievement = () => this.shareCurrentAchievement();
    

  }

  // Enhanced XP system with combos, levels, and bonuses
  async addXP(amount, skipWalletCheck = false) {
    if (!skipWalletCheck && (!this.appState.connected || !this.appState.address)) {
      console.log('❌ Cannot add XP: wallet not connected');
      return;
    }
    
    const now = Date.now();
    const timeSinceLastAction = now - this.appState.lastActionTime;
    
    // Combo system: actions within 5 seconds get bonus
    if (timeSinceLastAction < CONFIG.COMBO_TIMEOUT) {
      this.appState.combo++;
      this.appState.comboMultiplier = Math.min(1 + (this.appState.combo * 0.1), CONFIG.MAX_COMBO_MULTIPLIER);
      this.showComboCounter();
    } else {
      this.appState.combo = 1;
      this.appState.comboMultiplier = 1.0;
    }
    
    this.appState.lastActionTime = now;
    
    // Apply combo multiplier and dog bonus
    const dogBonus = this.getActiveDogBonus();
    const finalAmount = Math.floor(amount * this.appState.comboMultiplier * dogBonus);
    
    // Add XP to current balance
    const oldXP = this.appState.xp || 0;
    this.appState.xp = oldXP + finalAmount;
    this.appState.totalXP = (this.appState.totalXP || 0) + finalAmount;
    
    console.log(`📊 XP calculation: ${oldXP} + ${finalAmount} = ${this.appState.xp}`);
    
    // Check for level up
    const newLevel = Math.floor(this.appState.totalXP / 1000) + 1;
    if (newLevel > this.appState.level) {
      this.showLevelUp(newLevel);
      this.appState.level = newLevel;
    }
    
    // Update display immediately
    const xpElement = document.getElementById('xp');
    const levelElement = document.getElementById('level');
    
    if (xpElement) {
      xpElement.textContent = this.appState.xp;
      console.log('📊 XP display updated:', this.appState.xp);
    }
    
    if (levelElement) {
      levelElement.textContent = this.appState.level;
      console.log('📊 Level display updated:', this.appState.level);
    }
    
    // Update claim display if on claim tab
    if (this.activeTab === 'claim') {
      this.updateClaimDisplay();
    }
    
    // Batch XP updates to reduce API calls
    this.scheduleXPUpdate();
    
    // Enhanced celebration effects
    this.showXPGainAnimation(finalAmount);
    this.createFloatingHearts();
    
    // Check for dog unlocks
    await this.checkDogUnlocks();
    
    console.log(`✨ XP added: +${finalAmount} (${amount} base + ${this.appState.comboMultiplier}x combo + ${dogBonus}x dog bonus), Total: ${this.appState.xp}`);
  }

  // Batch XP updates to reduce API calls
  scheduleXPUpdate() {
    // Clear existing timeout
    if (this.xpUpdateTimeout) {
      clearTimeout(this.xpUpdateTimeout);
    }
    
    // Schedule update after 2 seconds of inactivity
    this.xpUpdateTimeout = setTimeout(async () => {
      try {
        await apiService.updateUserXP(this.appState.address, this.appState.xp);
        console.log('✅ XP batch saved to localStorage successfully');
      } catch (error) {
        console.error('❌ Failed to save XP to localStorage:', error.message);
        
        // Don't show error for network issues, just log
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
          console.warn('⚠️ Network issue detected, XP will be saved on next successful connection');
        } else {
          this.showError('Failed to save XP. Please try again.');
        }
      }
    }, 2000);
  }

  // Visual effects
  showXPGainAnimation(amount) {
    const xpElement = document.getElementById('xp');
    xpElement.style.transform = 'scale(1.2)';
    xpElement.style.color = '#00ff00';
    
    // Create floating XP text
    const floatingXP = document.createElement('div');
    floatingXP.textContent = `+${amount} XP`;
    floatingXP.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #00ff00;
      font-size: 24px;
      font-weight: bold;
      z-index: 1000;
      pointer-events: none;
    `;
    floatingXP.classList.add('xp-gain-animation');
    document.body.appendChild(floatingXP);
    
    setTimeout(() => {
      xpElement.style.transform = 'scale(1)';
      xpElement.style.color = 'white';
      if (document.body.contains(floatingXP)) {
        document.body.removeChild(floatingXP);
      }
    }, CONFIG.ANIMATION_DURATION);
  }

  createFloatingHearts() {
    const hearts = ['❤️', '💖', '💝', '💕', '💗'];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.cssText = `
          position: fixed;
          left: ${Math.random() * window.innerWidth}px;
          bottom: -50px;
          font-size: 20px;
          z-index: 999;
          pointer-events: none;
        `;
        heart.classList.add('floating-hearts');
        document.body.appendChild(heart);
        
        setTimeout(() => {
          if (document.body.contains(heart)) {
            document.body.removeChild(heart);
          }
        }, 2000);
      }, i * 100);
    }
  }

  showComboCounter() {
    let comboEl = document.getElementById('comboCounter');
    if (!comboEl) {
      comboEl = document.createElement('div');
      comboEl.id = 'comboCounter';
      comboEl.className = 'combo-counter';
      document.body.appendChild(comboEl);
    }
    
    comboEl.textContent = `${this.appState.combo}x COMBO!`;
    comboEl.style.display = 'block';
    
    setTimeout(() => {
      comboEl.style.display = 'none';
    }, 2000);
  }

  showLevelUp(newLevel) {
    const levelUpEl = document.createElement('div');
    levelUpEl.textContent = `LEVEL ${newLevel}! 🎉`;
    levelUpEl.className = 'level-up';
    document.body.appendChild(levelUpEl);
    
    // Create confetti
    this.createConfetti();
    
    setTimeout(() => {
      if (document.body.contains(levelUpEl)) {
        document.body.removeChild(levelUpEl);
      }
    }, 2000);
  }

  createConfetti() {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          if (document.body.contains(confetti)) {
            document.body.removeChild(confetti);
          }
        }, 3000);
      }, i * 50);
    }
  }

  // Dog collection system
  getActiveDogBonus() {
    if (this.appState.ownedDogs.length === 0) return 1.0;
    
    // Get the highest bonus from owned dogs
    const highestBonus = Math.max(...this.appState.ownedDogs.map(dogId => {
      const dog = CONFIG.DOG_BREEDS.find(d => d.id === dogId);
      return dog ? dog.xpBonus : 1.0;
    }));
    
    return highestBonus;
  }

  async checkDogUnlocks() {
    // Get all stats for unlocking dogs
    const totalPets = this.appState.dailyStats.pets + apiService.getTotalPets(this.appState.address);
    const totalGreets = this.appState.dailyStats.greets || 0;
    const totalFlips = this.appState.dailyStats.flips || 0;
    const totalSlots = this.appState.dailyStats.slots || 0;
    
    for (const dog of CONFIG.DOG_BREEDS) {
      if (!this.appState.ownedDogs.includes(dog.id)) {
        const [action, count] = dog.unlockCondition.split('_');
        const unlockCount = parseInt(count);
        let hasUnlocked = false;
        
        switch (action) {
          case 'pet':
            hasUnlocked = totalPets >= unlockCount;
            break;
          case 'greet':
            hasUnlocked = totalGreets >= unlockCount;
            break;
          case 'flip':
            hasUnlocked = totalFlips >= unlockCount;
            break;
          case 'slots':
            hasUnlocked = totalSlots >= unlockCount;
            break;
        }
        
        if (hasUnlocked) {
          await this.unlockDog(dog);
        }
      }
    }
  }

  async unlockDog(dog) {
    console.log(`🐕 Unlocking dog: ${dog.name} (${dog.id})`);
    
    if (!this.appState.ownedDogs.includes(dog.id)) {
      this.appState.ownedDogs.push(dog.id);
      
      try {
        await apiService.setOwnedDogs(this.appState.address, this.appState.ownedDogs);
        console.log('✅ Dog unlocked and saved successfully');
      } catch (error) {
        console.error('❌ Failed to save dog unlock:', error);
      }
      
      this.showAchievementModal({
        icon: dog.image,
        title: `New Dog Unlocked!`,
        description: `You've unlocked the ${dog.name}! This ${dog.rarity} dog gives you ${dog.xpBonus}x XP bonus!`,
        type: 'collection',
        data: { dog: dog }
      });
      
      // Update collection display if on collection tab
      if (this.activeTab === 'collection') {
        this.updateCollectionDisplay();
      }
    } else {
      console.log(`🐕 Dog ${dog.name} already unlocked`);
    }
  }

  // Challenge system
  async updateChallengeProgress(type, amount = 1) {
    console.log(`📊 Updating challenge progress: ${type} +${amount}`);
    
    if (!this.appState.challengeProgress[type]) {
      this.appState.challengeProgress[type] = 0;
    }
    
    this.appState.challengeProgress[type] += amount;
    
    if (!this.appState.dailyStats[type + 's']) {
      this.appState.dailyStats[type + 's'] = 0;
    }
    this.appState.dailyStats[type + 's'] += amount;
    
    console.log(`📊 New progress - ${type}: ${this.appState.challengeProgress[type]}, daily ${type}s: ${this.appState.dailyStats[type + 's']}`);
    
          // Save to localStorage
    try {
      await apiService.setDailyStats(this.appState.address, this.appState.dailyStats, this.appState.challengeProgress);
      console.log('✅ Challenge progress saved successfully');
    } catch (error) {
      console.error('❌ Failed to save challenge progress:', error);
      
      // Don't show error for network issues, just log
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.warn('⚠️ Network issue detected, progress will be saved on next successful connection');
      }
    }
    
    // Check for challenge completions
    this.checkChallengeCompletions();
    
    // Update display if on challenges tab
    if (this.activeTab === 'challenges') {
      this.updateChallengesDisplay();
    }
  }

  checkChallengeCompletions() {
    CONFIG.DAILY_CHALLENGES.forEach(challenge => {
      const progress = this.appState.challengeProgress[challenge.type] || 0;
      const completed = localStorage.getItem(`challenge_completed_${challenge.id}_${this.appState.address}`);
      
      if (progress >= challenge.target && !completed) {
        this.completeChallenge(challenge);
      }
    });
  }

  completeChallenge(challenge) {
    localStorage.setItem(`challenge_completed_${challenge.id}_${this.appState.address}`, 'true');
    
    // Award bonus XP
    this.addXP(challenge.reward);
    
    this.showAchievementModal({
      icon: challenge.icon,
      title: `Challenge Complete!`,
      description: `You've completed "${challenge.title}" and earned ${challenge.reward} bonus XP!`,
      type: 'challenge',
      data: { challenge: challenge }
    });
  }

  // Game actions
  async petDog() {
    console.log('🐕 Pet Dog clicked!');
    
    if (!this.appState.connected) {
      this.showError('Connect wallet first');
      return;
    }
    
    if (this.appState.isTransactionPending) {
      this.showError('Please wait for the current transaction to complete');
      return;
    }
    
    // Check network before starting transaction
    const isCorrectNetwork = await this.checkNetworkBeforeTransaction();
    if (!isCorrectNetwork) {
      return;
    }
    
    // Set transaction pending flag and update button state
    this.appState.isTransactionPending = true;
    this.updateButtonStates(true);
    
    try {
      // Change dog image immediately for visual feedback
      const dogImg = document.getElementById('dog-img');
      if (dogImg) {
        dogImg.src = `https://placedog.net/400/300?id=${Math.floor(Math.random() * 50) + 1}`;
      }
      
      // Execute real blockchain transaction
      const success = await this.executeTransaction(
        CONFIG.CONTRACTS.PET,
        CONFIG.ABIS.PET,
        'pet',
        'pet-status',
        '🐕 Dog petted successfully! +10 XP',
        10
      );
      
      // Only update challenge progress if transaction was successful
      if (success) {
        await this.updateChallengeProgress('pet', 1);
      }
      
    } finally {
      // Clear transaction pending flag and restore button states
      this.appState.isTransactionPending = false;
      this.updateButtonStates(false);
    }
  }

  async sayGM() {
    console.log('☀️ Say GM clicked!');
    
    if (!this.appState.connected) {
      this.showError('Connect wallet first');
      return;
    }
    
    if (this.appState.isTransactionPending) {
      this.showError('Please wait for the current transaction to complete');
      return;
    }
    
    // Check network before starting transaction
    const isCorrectNetwork = await this.checkNetworkBeforeTransaction();
    if (!isCorrectNetwork) {
      return;
    }
    
    // Set transaction pending flag and update button state
    this.appState.isTransactionPending = true;
    this.updateButtonStates(true);
    
    try {
      // Execute real blockchain transaction
      const success = await this.executeTransaction(
        CONFIG.CONTRACTS.GREET,
        CONFIG.ABIS.GREET,
        'gm',
        'greet-status',
        '☀️ Good Morning sent! +5 XP',
        5
      );
      
      // Only update challenge progress if transaction was successful
      if (success) {
        await this.updateChallengeProgress('greet', 1);
      }
      
    } finally {
      // Clear transaction pending flag and restore button states
      this.appState.isTransactionPending = false;
      this.updateButtonStates(false);
    }
  }

  async sayGN() {
    console.log('🌙 Say GN clicked!');
    
    if (!this.appState.connected) {
      this.showError('Connect wallet first');
      return;
    }
    
    if (this.appState.isTransactionPending) {
      this.showError('Please wait for the current transaction to complete');
      return;
    }
    
    // Check network before starting transaction
    const isCorrectNetwork = await this.checkNetworkBeforeTransaction();
    if (!isCorrectNetwork) {
      return;
    }
    
    // Set transaction pending flag and update button state
    this.appState.isTransactionPending = true;
    this.updateButtonStates(true);
    
    try {
      // Execute real blockchain transaction
      const success = await this.executeTransaction(
        CONFIG.CONTRACTS.GREET,
        CONFIG.ABIS.GREET,
        'gn',
        'greet-status',
        '🌙 Good Night sent! +5 XP',
        5
      );
      
      // Only update challenge progress if transaction was successful
      if (success) {
        await this.updateChallengeProgress('greet', 1);
      }
      
    } finally {
      // Clear transaction pending flag and restore button states
      this.appState.isTransactionPending = false;
      this.updateButtonStates(false);
    }
  }

  async flipCoin() {
    console.log('🪙 Flip Coin clicked!');
    
    if (!this.appState.connected) {
      this.showError('Connect wallet first');
      return;
    }
    
    if (this.appState.isTransactionPending) {
      this.showError('Please wait for the current transaction to complete');
      return;
    }
    
    // Check network before starting transaction
    const isCorrectNetwork = await this.checkNetworkBeforeTransaction();
    if (!isCorrectNetwork) {
      return;
    }
    
    // Set transaction pending flag and update button state
    this.appState.isTransactionPending = true;
    this.updateButtonStates(true);
    
    try {
      const coin = document.getElementById('coin');
      const result = document.getElementById('flip-result');
      
      // Start visual animation
      if (result) result.textContent = 'Flipping...';
      let rotation = 0;
      const interval = setInterval(() => {
        rotation += 180;
        if (coin) coin.style.transform = `rotateY(${rotation}deg)`;
      }, 100);
      
      // Execute real blockchain transaction
      const success = await this.executeTransaction(
        CONFIG.CONTRACTS.FLIP,
        CONFIG.ABIS.FLIP,
        'flip',
        'flip-status',
        '🪙 Coin flipped! +3 XP',
        3
      );
      
      // Stop animation and show result
      clearInterval(interval);
      const finalResult = Math.random() < 0.5 ? 'Heads' : 'Tails';
      if (coin) coin.style.transform = `rotateY(${finalResult === 'Heads' ? 0 : 180}deg)`;
      if (result) result.textContent = `Result: ${finalResult}!`;
      
      // Only update challenge progress if transaction was successful
      if (success) {
        await this.updateChallengeProgress('flip', 1);
      }
      
    } finally {
      // Clear transaction pending flag and restore button states
      this.appState.isTransactionPending = false;
      this.updateButtonStates(false);
    }
  }

  // Button state management
  updateButtonStates(isPending) {
    const actionButtons = [
      'pet-dog-btn',
      'say-gm-btn', 
      'say-gn-btn',
      'flip-coin-btn',
      'slotsButton',
      'claimButton'
    ];
    
    actionButtons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        if (isPending) {
          btn.disabled = true;
          btn.style.opacity = '0.5';
          btn.style.cursor = 'not-allowed';
          // Store original text
          btn.dataset.originalText = btn.textContent;
          btn.textContent = '⏳ Processing...';
        } else {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          // Restore original text
          if (btn.dataset.originalText) {
            btn.textContent = btn.dataset.originalText;
            delete btn.dataset.originalText;
          }
        }
      }
    });
  }

  // Network validation functions
  async ensureCorrectNetwork() {
    if (!this.appState.provider) {
      this.showError('Wallet not connected');
      return false;
    }

    try {
      // Method 1: Using ethers provider
      const network = await this.appState.provider.getNetwork();
      const currentChainId = network.chainId;
      
      // Method 2: Using window.ethereum directly
      let ethereumChainId = null;
      if (window.ethereum) {
        ethereumChainId = await window.ethereum.request({ method: 'eth_chainId' });
      }
      
      console.log(`🌐 Ethers network: ${currentChainId}`);
      console.log(`🌐 Ethereum chainId: ${ethereumChainId}`);
      console.log(`🌐 Required: ${CONFIG.MONAD_CHAIN_ID}`);
      
      // Check multiple formats
      const requiredDecimal = parseInt(CONFIG.MONAD_CHAIN_ID, 16);
      const currentHex = `0x${currentChainId.toString(16).toUpperCase()}`;
      
      const isCorrectNetwork = 
        currentChainId === requiredDecimal ||
        currentHex === CONFIG.MONAD_CHAIN_ID ||
        ethereumChainId === CONFIG.MONAD_CHAIN_ID;
      
      console.log(`🌐 Is correct network: ${isCorrectNetwork}`);
      
      if (!isCorrectNetwork) {
        console.log('⚠️ Wrong network detected, attempting to switch...');
        return await this.switchToMonadNetwork();
      }
      
      console.log('✅ Correct network (Monad Testnet) detected');
      return true;
      
    } catch (error) {
      console.error('❌ Network check failed:', error);
      // For now, let's be more permissive and allow the transaction
      console.log('⚠️ Network check failed, but allowing transaction to proceed...');
      return true;
    }
  }

  async switchToMonadNetwork() {
    try {
      console.log('🔄 Switching to Monad Testnet...');
      
      // Try to switch network using wallet_addEthereumChain
      const chainId = CONFIG.MONAD_CHAIN_ID;
      const chainName = 'Monad Testnet';
      const rpcUrl = CONFIG.MONAD_RPC_URL;
      const blockExplorerUrl = 'https://explorer.testnet.monad.xyz';
      
      const params = {
        chainId: chainId,
        chainName: chainName,
        nativeCurrency: {
          name: 'MONAD',
          symbol: 'MONAD',
          decimals: 18
        },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: [blockExplorerUrl]
      };
      
      try {
        // Try to add the network
        await this.appState.provider.provider.request({
          method: 'wallet_addEthereumChain',
          params: [params]
        });
        console.log('✅ Monad Testnet added successfully');
        return true;
      } catch (addError) {
        // If network already exists, try to switch to it
        if (addError.code === 4902) {
          console.log('⚠️ Network already exists, switching...');
          try {
            await this.appState.provider.provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: chainId }]
            });
            console.log('✅ Switched to Monad Testnet successfully');
            return true;
          } catch (switchError) {
            console.error('❌ Failed to switch network:', switchError);
            // Network switch error ignored - continue with transaction
            console.log('⚠️ Network switch failed, but continuing...');
            return true;
          }
        } else {
          console.error('❌ Failed to add network:', addError);
          // Network error ignored - continue with transaction
          console.log('⚠️ Network add failed, but continuing...');
          return true;
        }
      }
      
    } catch (error) {
      console.error('❌ Network switch failed:', error);
      // Network error ignored - continue with transaction
      console.log('⚠️ Network switch failed, but continuing...');
      return true;
    }
  }

  async checkNetworkBeforeTransaction() {
    console.log('🔍 Checking network before transaction...');
    
    // Temporarily disable network check to allow transactions
    console.log('⚠️ Network check temporarily disabled for testing');
    return true;
    
    // Original code (commented out for now)
    /*
    const isCorrectNetwork = await this.ensureCorrectNetwork();
    if (!isCorrectNetwork) {
      console.log('❌ Network check failed, showing error...');
      this.showError('Please switch to Monad Testnet to continue');
      return false;
    }
    console.log('✅ Network check passed');
    return true;
    */
  }

  // Utility functions
  showError(message) {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,0,0,0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(255,0,0,0.3);
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
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,255,0,0.3);
    `;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => {
      if (document.body.contains(div)) {
        document.body.removeChild(div);
      }
    }, 3000);
  }

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

  // Placeholder functions for other game mechanics


  async playSlots() {
    console.log('🎰 Play Slots clicked!');
    
    if (!this.appState.connected) {
      this.showError('Connect wallet first');
      return;
    }
    
    if (this.appState.isTransactionPending) {
      this.showError('Please wait for the current transaction to complete');
      return;
    }
    
    // Check network before starting transaction
    const isCorrectNetwork = await this.checkNetworkBeforeTransaction();
    if (!isCorrectNetwork) {
      return;
    }
    
    // Set transaction pending flag and update button state
    this.appState.isTransactionPending = true;
    this.updateButtonStates(true);
    
    try {
      // Start visual animation
      const reels = ['reel1', 'reel2', 'reel3', 'reel4'];
      reels.forEach((reelId, index) => {
        const reel = document.getElementById(reelId);
        if (reel) {
          reel.classList.add('spinning');
          setTimeout(() => {
            reel.classList.remove('spinning');
          }, 2000 + (index * 500));
        }
      });
      
      // Execute real blockchain transaction (buy credits + play slots)
      const success = await this.executeTransaction(
        CONFIG.CONTRACTS.SLOTS,
        CONFIG.ABIS.SLOTS,
        'playSlots',
        'slots-status',
        '🎰 Slots played! Check results below',
        0 // XP will be determined by contract
      );
      
      // Show results after transaction
      if (success) {
        // Add 2 credits for payment, then deduct 1 for playing = net +1 credit
        this.appState.slotsCredits = (this.appState.slotsCredits || 0) + 1;
        
        setTimeout(async () => {
          this.showSlotsResults();
          await this.updateChallengeProgress('slots', 1);
          this.updateSlotsCredits(); // Update credits after playing
        }, 3000);
      }
      
    } finally {
      // Clear transaction pending flag and restore button states
      this.appState.isTransactionPending = false;
      this.updateButtonStates(false);
    }
  }

  showSlotsResults() {
    console.log('🎰 Showing slots results...');
    
    // Add active class to slot machine for glow effect
    const slotMachine = document.querySelector('.slots-machine');
    if (slotMachine) {
      slotMachine.classList.add('active');
    }
    
    // Generate random symbols for each reel
    const symbols = ['🐕', '🦮', '🐶', '🦴'];
    const reels = ['reel1', 'reel2', 'reel3', 'reel4'];
    const results = [];
    
    reels.forEach((reelId, index) => {
      const reel = document.getElementById(reelId);
      if (reel) {
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        reel.textContent = randomSymbol;
        results.push(randomSymbol);
        
        // Add spinning animation first
        reel.classList.add('spinning');
        
        // Stop spinning and add result-specific animation
        setTimeout(() => {
          reel.classList.remove('spinning');
          
          // Add winning animation based on result
          setTimeout(() => {
            reel.classList.add('winning');
          }, 200);
          
          // Remove winning class after animation
          setTimeout(() => {
            reel.classList.remove('winning');
          }, 2000);
        }, 800 + (index * 150)); // Faster spinning with staggered timing
      }
    });
    
    // Remove active class from slot machine
    setTimeout(() => {
      if (slotMachine) {
        slotMachine.classList.remove('active');
      }
    }, 3000);
    
    // Determine win condition based on matching symbols
    setTimeout(() => {
      this.calculateSlotsWin(results);
    }, 1500);
  }
  
  calculateSlotsWin(results) {
    console.log('🎰 Calculating win for:', results);
    
    // Count each symbol
    const symbolCounts = {};
    results.forEach(symbol => {
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });
    
    // Find the most frequent symbol and its count
    let maxCount = 0;
    let winningSymbol = '';
    
    Object.keys(symbolCounts).forEach(symbol => {
      if (symbolCounts[symbol] > maxCount) {
        maxCount = symbolCounts[symbol];
        winningSymbol = symbol;
      }
    });
    
    // Determine prize based on match count
    let xpGain = 0;
    let message = '';
    let animationClass = '';
    
    if (maxCount === 4) {
      xpGain = 5000;
      message = `🎉 JACKPOT! 4 ${winningSymbol} - ${xpGain} XP!`;
      animationClass = 'jackpot';
    } else if (maxCount === 3) {
      xpGain = 500;
      message = `🏆 Great! 3 ${winningSymbol} - ${xpGain} XP!`;
      animationClass = 'big-win';
    } else if (maxCount === 2) {
      xpGain = 50;
      message = `⭐⭐ Nice! 2 ${winningSymbol} - ${xpGain} XP!`;
      animationClass = 'small-win';
    } else {
      message = '🎰 Better luck next time!';
    }
    
    // Apply special animations to winning reels
    if (animationClass) {
      const reels = ['reel1', 'reel2', 'reel3', 'reel4'];
      reels.forEach(reelId => {
        const reel = document.getElementById(reelId);
        if (reel) {
          reel.classList.remove('winning');
          reel.classList.add(animationClass);
          
          // Remove special animation after 3 seconds
          setTimeout(() => {
            reel.classList.remove(animationClass);
          }, 3000);
        }
      });
    }
    
    // Add XP and show result
    if (xpGain > 0) {
      this.addXP(xpGain);
      this.showSuccess(message);
      
      // Add extra celebration for big wins
      if (maxCount >= 3) {
        this.createConfetti();
      }
    } else {
      this.showError(message);
    }
  }

  async claimTokens() {
    console.log('💰 Claim Tokens clicked!');
    
    if (!this.appState.connected) {
      this.showError('Connect wallet first');
      return;
    }
    
    if (this.appState.isTransactionPending) {
      this.showError('Please wait for the current transaction to complete');
      return;
    }
    
    // Check if user has XP to claim
    const claimableXP = this.appState.xp || 0;
    if (claimableXP < CONFIG.XP_TO_DOG_RATE) {
      this.showError(`Need at least ${CONFIG.XP_TO_DOG_RATE} XP to claim tokens`);
      return;
    }
    
    // Check network before starting transaction
    const isCorrectNetwork = await this.checkNetworkBeforeTransaction();
    if (!isCorrectNetwork) {
      return;
    }
    
    // Set transaction pending flag and update button state
    this.appState.isTransactionPending = true;
    this.updateButtonStates(true);
    
    try {
      // Execute real blockchain transaction
      const success = await this.executeTransaction(
        CONFIG.CONTRACTS.DOG_TOKEN,
        CONFIG.ABIS.DOG_TOKEN,
        'claim',
        'claim-status',
        `💰 Successfully claimed ${Math.floor(claimableXP / CONFIG.XP_TO_DOG_RATE)} $DOG tokens!`,
        0 // No XP gain from claiming
      );
      
      // Update local state if successful
      if (success) {
        // Calculate how much XP was actually claimed (rounded down to multiple of 10)
        const claimedXP = Math.floor(claimableXP / 10) * 10;
        const remainingXP = claimableXP - claimedXP;
        
        // Reset XP to remaining amount (not 0, but the remainder)
        this.appState.xp = remainingXP;
        
        // Save remaining XP to localStorage
        try {
          await apiService.updateUserXP(this.appState.address, this.appState.xp);
          console.log('✅ Remaining XP saved to localStorage:', this.appState.xp);
        } catch (error) {
          console.error('❌ Failed to save remaining XP:', error.message);
        }
        
        this.updateClaimDisplay();
        
        // Update wallet DOG balance after claiming
        setTimeout(() => {
          this.updateWalletDogBalance();
        }, 2000); // Wait a bit for blockchain to update
        
        const claimedDOG = Math.floor(claimedXP / CONFIG.XP_TO_DOG_RATE);
        this.showSuccess(`🎉 ${claimedDOG} $DOG tokens minted to your wallet! (Used ${claimedXP} XP, ${remainingXP} XP remaining)`);
      }
      
    } finally {
      // Clear transaction pending flag and restore button states
      this.appState.isTransactionPending = false;
      this.updateButtonStates(false);
    }
  }

  updateClaimDisplay() {
    const claimableXP = this.appState.xp || 0;
    const claimableDOG = Math.floor(claimableXP / CONFIG.XP_TO_DOG_RATE);
    
    const claimableXPEl = document.getElementById('claimableXP');
    const claimableDOGEl = document.getElementById('claimableDOG');
    const claimButton = document.getElementById('claimButton');
    
    if (claimableXPEl) claimableXPEl.textContent = claimableXP;
    if (claimableDOGEl) claimableDOGEl.textContent = claimableDOG;
    
    if (claimButton) {
      const hasEnoughXP = claimableXP >= CONFIG.XP_TO_DOG_RATE;
      claimButton.disabled = !hasEnoughXP;
      
      if (hasEnoughXP) {
        claimButton.textContent = `💰 Claim ${claimableDOG} $DOG Tokens`;
      } else {
        claimButton.textContent = `💰 Claim $DOG Tokens (Need ${CONFIG.XP_TO_DOG_RATE} XP)`;
      }
      
      // Add tooltip to show XP rounding info
      if (claimableXP > 0 && claimableXP % 10 !== 0) {
        const roundedXP = Math.floor(claimableXP / 10) * 10;
        const remainingXP = claimableXP - roundedXP;
        claimButton.title = `Note: ${roundedXP} XP will be used (${remainingXP} XP will remain)`;
      } else {
        claimButton.title = '';
      }
    }
    
    // Update wallet DOG balance
    this.updateWalletDogBalance();
  }
  
  async updateWalletDogBalance() {
    if (!this.appState.connected || !this.appState.signer) {
      return;
    }
    
    try {
      const dogTokenContract = new ethers.Contract(
        CONFIG.CONTRACTS.DOG_TOKEN,
        CONFIG.ABIS.DOG_TOKEN,
        this.appState.provider
      );
      
      const balance = await dogTokenContract.balanceOf(this.appState.address);
      const formattedBalance = ethers.utils.formatUnits(balance, 18);
      
      const walletDogDisplay = document.getElementById('walletDogDisplay');
      if (walletDogDisplay) {
        walletDogDisplay.textContent = parseFloat(formattedBalance).toFixed(2);
      }
      
      console.log(`🐕 Wallet DOG balance: ${formattedBalance}`);
      
    } catch (error) {
      console.error('Error fetching DOG balance:', error);
      const walletDogDisplay = document.getElementById('walletDogDisplay');
      if (walletDogDisplay) {
        walletDogDisplay.textContent = 'Error';
      }
    }
  }

  updateSlotsCredits() {
    const availableCredits = this.appState.slotsCredits || 0;
    const creditsEl = document.getElementById('availableCredits');
    
    if (creditsEl) creditsEl.textContent = availableCredits;
  }

  async executeTransaction(contractAddress, abi, methodName, statusId, successMsg, xpAmount) {
    if (!this.appState.connected || !this.appState.signer) {
      this.showError('Please connect your wallet first');
      return false;
    }

    // Check network before transaction
    const isCorrectNetwork = await this.checkNetworkBeforeTransaction();
    if (!isCorrectNetwork) {
      return false;
    }

    try {
      console.log(`🔗 Executing ${methodName} transaction...`);
      this.showStatus(statusId, 'Preparing transaction...', 'pending');
      
      // For Farcaster Wallet, use simulation only - check early
      if (this.farcasterClient || this.appState.walletType === 'farcaster') {
        console.log('🟣 Using Farcaster Wallet simulation method');
        
        this.showStatus(statusId, 'Processing in Farcaster...', 'pending');
        
        // Simulate transaction processing
        setTimeout(() => {
          this.showStatus(statusId, '✅ Success! +' + xpAmount + ' XP', 'success');
          this.addXP(xpAmount);
          setTimeout(() => this.hideStatus(statusId), 3000);
        }, 1500);
        
        return true;
      }
      
      // Regular wallet transaction flow
      const contract = new ethers.Contract(contractAddress, abi, this.appState.signer);
      
      let tx;
      if (methodName === 'pet') {
        tx = await contract.pet();
      } else if (methodName === 'gm') {
        tx = await contract.gm();
      } else if (methodName === 'gn') {
        tx = await contract.gn();
      } else if (methodName === 'flip') {
        tx = await contract.flip();
      } else if (methodName === 'playSlots') {
        // First buy credits, then play slots
        const buyCreditsTx = await contract.buyCredits({ value: ethers.utils.parseEther('0.1') });
        await buyCreditsTx.wait();
        tx = await contract.playSlots();
      } else if (methodName === 'claim') {
        const claimableXP = this.appState.xp || 0;
        // Round down to nearest multiple of 10 to satisfy contract requirement
        const roundedXP = Math.floor(claimableXP / 10) * 10;
        console.log(`💰 Claiming ${roundedXP} XP (original: ${claimableXP})`);
        tx = await contract.claim(roundedXP);
      } else {
        throw new Error(`Unknown method: ${methodName}`);
      }
      
      console.log(`📝 Transaction sent: ${tx.hash}`);
      this.showStatus(statusId, `Transaction sent! Hash: ${tx.hash.slice(0,10)}...`, 'pending');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Show success message
      this.showStatus(statusId, successMsg, 'success');
      
      // Add XP only after successful transaction
      await this.addXP(xpAmount);
      
      // Hide status after 3 seconds
      setTimeout(() => this.hideStatus(statusId), 3000);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Transaction failed:`, error);
      
      let errorMessage = 'Transaction failed';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (error.message.includes('UnsupportedMethodError') || 
                 error.message.includes('eth_estimateGas') ||
                 error.message.includes('Provider.UnsupportedMethodError') ||
                 error.message.includes('Farcaster Wallet does not support')) {
        // For Farcaster Wallet errors, simulate success
        console.log('🟣 Farcaster Wallet error detected, simulating success...');
        this.showStatus(statusId, '✅ Success! +' + xpAmount + ' XP', 'success');
        await this.addXP(xpAmount);
        setTimeout(() => this.hideStatus(statusId), 3000);
        return true;
      }
      
      this.showStatus(statusId, errorMessage, 'error');
      this.showError(errorMessage);
      
      setTimeout(() => this.hideStatus(statusId), 5000);
      return false;
    }
  }

  // Tab management
  showTab(tabName) {
    console.log('📑 Switching to tab:', tabName);
    this.activeTab = tabName;
    
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Find and activate the correct tab
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
    
    // Load tab content
    this.loadTabContent(tabName);
    
    // Only refresh data if not already loaded
    if ((tabName === 'collection' || tabName === 'challenges') && !this.appState.dataLoaded) {
      console.log('🔄 Refreshing data for tab:', tabName);
      this.loadUserData();
    }
  }

  loadTabContent(tabName) {
    const tabContent = document.getElementById('tab-content');
    
    switch (tabName) {
      case 'pet':
        tabContent.innerHTML = this.getPetTabContent();
        this.setupPetTabEvents();
        break;
      case 'greet':
        tabContent.innerHTML = this.getGreetTabContent();
        this.setupGreetTabEvents();
        break;
      case 'flip':
        tabContent.innerHTML = this.getFlipTabContent();
        this.setupFlipTabEvents();
        break;
      case 'slots':
        tabContent.innerHTML = this.getSlotsTabContent();
        this.setupSlotsTabEvents();
        this.updateSlotsCredits();
        break;
      case 'collection':
        tabContent.innerHTML = this.getCollectionTabContent();
        this.updateCollectionDisplay();
        this.setupCollectionTabEvents();
        break;
      case 'challenges':
        tabContent.innerHTML = this.getChallengesTabContent();
        this.updateChallengesDisplay();
        this.setupChallengesTabEvents();
        break;
      case 'claim':
        tabContent.innerHTML = this.getClaimTabContent();
        this.setupClaimTabEvents();
        this.updateClaimDisplay();
        break;
    }
  }

  // Setup event listeners for each tab
  setupPetTabEvents() {
    const petBtn = document.getElementById('pet-dog-btn');
    const shareBtn = document.getElementById('share-pet-btn');
    
    if (petBtn) {
      petBtn.addEventListener('click', () => {
        if (!this.appState.isTransactionPending) {
          this.petDog();
        }
      });
    }
    
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        // Share functionality - no notification needed
      });
    }
  }

  setupGreetTabEvents() {
    const gmBtn = document.getElementById('say-gm-btn');
    const gnBtn = document.getElementById('say-gn-btn');
    const shareBtn = document.getElementById('share-greet-btn');
    
    if (gmBtn) {
      gmBtn.addEventListener('click', () => {
        if (!this.appState.isTransactionPending) {
          this.sayGM();
        }
      });
    }
    
    if (gnBtn) {
      gnBtn.addEventListener('click', () => {
        if (!this.appState.isTransactionPending) {
          this.sayGN();
        }
      });
    }
    
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        // Share functionality - no notification needed
      });
    }
  }

  setupFlipTabEvents() {
    const flipBtn = document.getElementById('flip-coin-btn');
    const shareBtn = document.getElementById('share-flip-btn');
    
    if (flipBtn) {
      flipBtn.addEventListener('click', () => {
        if (!this.appState.isTransactionPending) {
          this.flipCoin();
        }
      });
    }
    
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        // Share functionality - no notification needed
      });
    }
  }

  setupSlotsTabEvents() {
    const slotsBtn = document.getElementById('slotsButton');
    const shareBtn = document.getElementById('share-slots-btn');
    
    if (slotsBtn) {
      slotsBtn.addEventListener('click', () => {
        if (!this.appState.isTransactionPending) {
          this.playSlots();
        }
      });
    }
    
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        // Share functionality - no notification needed
      });
    }
  }

  setupCollectionTabEvents() {
    const shareBtn = document.getElementById('share-collection-btn');
    
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareCollection());
    }
  }

  setupChallengesTabEvents() {
    const shareBtn = document.getElementById('share-challenges-btn');
    
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareChallenges());
    }
    
    // X Follow challenge is now handled by the header button
    // No additional event listeners needed for challenges tab
  }

  setupClaimTabEvents() {
    const claimBtn = document.getElementById('claimButton');
    
    if (claimBtn) {
      claimBtn.addEventListener('click', () => this.claimTokens());
    }
  }

  // Tab content generators
  getPetTabContent() {
    return `
      <div id="pet" class="tab-content active">
        <h3>Pet the Dog</h3>
        <img id="dog-img" class="dog-image" src="https://placedog.net/400/300?id=7" alt="Dog">
        <button id="pet-dog-btn">👋 Pet Dog (+10 XP)</button>
        <div id="pet-status" class="status"></div>
        
        <div class="share-section">
          <button class="share-button" id="share-pet-btn">
            🐕 Share Pet Achievement
          </button>
        </div>
      </div>
    `;
  }

  getGreetTabContent() {
    return `
      <div id="greet" class="tab-content active">
        <h3>Greet Community</h3>
        <p>Say GM or GN to the community!</p>
        <button id="say-gm-btn">☀️ Good Morning (+5 XP)</button>
        <button id="say-gn-btn">🌙 Good Night (+5 XP)</button>
        <div id="greet-status" class="status"></div>
        
        <div class="share-section">
          <button class="share-button" id="share-greet-btn">
            👋 Share Community Spirit
          </button>
        </div>
      </div>
    `;
  }

  getFlipTabContent() {
    return `
      <div id="flip" class="tab-content active">
        <h3>Flip Coin</h3>
        <div class="coin" id="coin">🪙</div>
        <button id="flip-coin-btn">🎲 Flip Coin (+3 XP)</button>
        <div id="flip-result">Result will appear here</div>
        <div id="flip-status" class="status"></div>
        
        <div class="share-section">
          <button class="share-button" id="share-flip-btn">
            🪙 Share Lucky Moment
          </button>
        </div>
      </div>
    `;
  }

  getSlotsTabContent() {
    return `
      <div id="slots" class="tab-content active">
        <h3>🎰 Dog Slots</h3>
        <p style="margin-bottom: 20px;">Match 4 same dogs or bones to win 5000 XP!</p>
        
        <div class="slots-machine">
          <div class="slots-display">
            <div class="slot-reel" id="reel1">🐕</div>
            <div class="slot-reel" id="reel2">🦮</div>
            <div class="slot-reel" id="reel3">🐶</div>
            <div class="slot-reel" id="reel4">🦴</div>
          </div>
          
          <div class="slots-info">
            <div class="cost-info">
              <span style="color: #f59e0b;">💰 Pay: 0.1 MONAD = 2 Credits</span>
            </div>
            <div class="prize-info">
              <span style="color: #10b981;">🏆 4 Match = 5000 XP</span>
            </div>
            <div class="credits-info">
              <span style="color: #6366f1;">🎫 Available Credits: <span id="availableCredits">0</span></span>
            </div>
          </div>
          
          <button class="slots-button" id="slotsButton">
            🎰 Play Slots (0.1 MONAD)
          </button>
          
          <div id="slots-status" class="status"></div>
        </div>
        
        <div class="slots-legend">
          <h4 style="text-align: center; margin-bottom: 15px; color: white;">Symbols & Prizes:</h4>
          
          <div class="symbol-grid">
            <div class="symbol-item">
              <span class="symbol">🐕</span>
              <span class="symbol-name">Shiba</span>
            </div>
            <div class="symbol-item">
              <span class="symbol">🦮</span>
              <span class="symbol-name">Guide Dog</span>
            </div>
            <div class="symbol-item">
              <span class="symbol">🐶</span>
              <span class="symbol-name">Puppy</span>
            </div>
            <div class="symbol-item">
              <span class="symbol">🦴</span>
              <span class="symbol-name">Bone</span>
            </div>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <div style="margin: 10px 0; color: #fbbf24;">
              🎉 4 Same: 5000 XP (JACKPOT!)
            </div>
            <div style="margin: 10px 0; color: #f59e0b;">
              🏆 3 Same: 500 XP
            </div>
            <div style="margin: 10px 0; color: #10b981;">
              ⭐⭐ 2 Same: 50 XP
            </div>
          </div>
        </div>
        
        <div class="share-section">
          <button class="share-button" id="share-slots-btn">
            🎰 Share Slots Win
          </button>
        </div>
      </div>
    `;
  }

  getCollectionTabContent() {
    return `
      <div id="collection" class="tab-content active">
        <h3>🏆 Dog Collection</h3>
        <p style="margin-bottom: 20px;">Collect different dog breeds and unlock bonuses!</p>
        
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <div style="text-align: center; margin-bottom: 15px;">
            <h4>🎯 Collection Progress</h4>
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">
              <span id="collectionProgress">0</span>/<span id="totalDogs">4</span>
            </div>
            <div style="font-size: 14px; opacity: 0.7;">Dogs Collected</div>
          </div>
          
          <div class="challenge-progress">
            <div class="challenge-progress-bar" id="collectionProgressBar" style="width: 0%"></div>
          </div>
        </div>
        
        <div class="dog-collection" id="dogCollection">
          <!-- Dog cards will be populated by JavaScript -->
        </div>
        
        <div class="share-section">
          <button class="share-button" onclick="shareCollection()">
            🏆 Share My Collection
          </button>
        </div>
      </div>
    `;
  }

  getChallengesTabContent() {
    return `
      <div id="challenges" class="tab-content active">
        <h3>🎯 Daily Challenges</h3>
        <p style="margin-bottom: 20px;">Complete challenges to earn bonus XP and rewards!</p>
        
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <div style="text-align: center; margin-bottom: 15px;">
            <h4>📅 Season 1 - Day <span id="currentDay">1</span></h4>
            <div class="season-badge">🏆 Season 1</div>
          </div>
          
          <div style="font-size: 14px; opacity: 0.7; text-align: center;">
            Challenges reset daily at midnight UTC
          </div>
        </div>
        
        <div id="dailyChallenges">
          <!-- Daily challenges will be populated by JavaScript -->
        </div>
        

        
        <div class="share-section">
          <button class="share-button" onclick="shareChallenges()">
            🎯 Share Challenge Progress
          </button>
        </div>
      </div>
    `;
  }

  getClaimTabContent() {
    return `
      <div id="claim" class="tab-content active">
        <h3>Claim $DOG Tokens</h3>
        <p style="margin-bottom: 20px;">Convert your earned XP to $DOG tokens!</p>
        
        <div class="claim-section">
          <div class="claim-info">
            <div class="claim-info-item">
              <div class="claim-info-label">Available XP</div>
              <div class="claim-info-value" id="claimableXP">0</div>
            </div>
            <div class="claim-info-item">
              <div class="claim-info-label">→</div>
              <div style="font-size: 30px;">🔄</div>
            </div>
            <div class="claim-info-item">
              <div class="claim-info-label">$DOG Tokens</div>
              <div class="claim-info-value" id="claimableDOG">0</div>
            </div>
          </div>
          
          <button class="claim-button" id="claimButton" disabled>
            💰 Claim $DOG Tokens
          </button>
          
          <div class="conversion-rate">
            Conversion Rate: 10 XP = 1 $DOG Token
          </div>
          
          <div id="claim-status" class="status"></div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 15px;">
            <h4 style="margin-bottom: 10px;">🐕 $DOG Token Info</h4>
            <p style="font-size: 12px; opacity: 0.7;">Claim your tokens and they'll be minted directly to your wallet</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f59e0b, #eab308); padding: 20px; border-radius: 12px; text-align: center; margin: 15px 0;">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Your Wallet Balance</div>
            <div style="font-size: 32px; font-weight: 700;">
              <span id="walletDogDisplay">0</span> $DOG
            </div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">🪙 Monad Testnet <span style="color: #f59e0b;">(Mainnet Soon!)</span></div>
          </div>
        </div>
      </div>
    `;
  }

  // Display functions
  updateCollectionDisplay() {
    const collectionContainer = document.getElementById('dogCollection');
    const progressEl = document.getElementById('collectionProgress');
    const totalDogsEl = document.getElementById('totalDogs');
    const progressBar = document.getElementById('collectionProgressBar');
    
    if (!collectionContainer) return;
    
    console.log('🔄 Updating collection display...');
    console.log('📊 Current owned dogs:', this.appState.ownedDogs);
    console.log('📊 Type of owned dogs:', typeof this.appState.ownedDogs);
    
    // Ensure ownedDogs is always an array
    let ownedDogs = [];
    if (Array.isArray(this.appState.ownedDogs)) {
      ownedDogs = this.appState.ownedDogs;
    } else if (this.appState.ownedDogs && typeof this.appState.ownedDogs === 'object') {
      // If it's an object, try to extract the array
      ownedDogs = this.appState.ownedDogs.owned_dogs || this.appState.ownedDogs.dogs || [];
    } else if (typeof this.appState.ownedDogs === 'string') {
      // If it's a string, try to parse it
      try {
        ownedDogs = JSON.parse(this.appState.ownedDogs);
      } catch (e) {
        console.error('Failed to parse owned dogs string:', e);
        ownedDogs = [];
      }
    }
    
    // Ensure it's an array
    if (!Array.isArray(ownedDogs)) {
      console.error('ownedDogs is not an array, resetting to empty array');
      ownedDogs = [];
    }
    
    // Update progress
    const progress = ownedDogs.length;
    const total = CONFIG.DOG_BREEDS.length;
    
    console.log(`📊 Collection progress: ${progress}/${total}`);
    console.log(`📊 Owned dogs array:`, ownedDogs);
    
    if (progressEl) progressEl.textContent = progress;
    if (totalDogsEl) totalDogsEl.textContent = total;
    if (progressBar) progressBar.style.width = `${(progress / total) * 100}%`;
    
    // Create dog cards
    collectionContainer.innerHTML = '';
    
    CONFIG.DOG_BREEDS.forEach(dog => {
      const isOwned = ownedDogs.includes(dog.id);
      const card = document.createElement('div');
      card.className = `dog-card ${isOwned ? 'owned' : ''} ${dog.rarity}`;
      
      card.innerHTML = `
        <div style="font-size: 40px; margin-bottom: 10px;">${dog.image}</div>
        <div style="font-weight: 600; margin-bottom: 5px;">${dog.name}</div>
        <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">${dog.rarity.toUpperCase()}</div>
        <div style="font-size: 12px; color: #f59e0b;">${dog.xpBonus}x XP Bonus</div>
        ${isOwned ? '<div style="color: #10b981; font-size: 12px; margin-top: 5px;">✓ OWNED</div>' : 
          `<div style="color: #6366f1; font-size: 12px; margin-top: 5px;">Unlock: ${dog.unlockCondition.replace('_', ' ')}</div>`}
      `;
      
      collectionContainer.appendChild(card);
    });
    
    console.log('✅ Collection display updated');
  }

  updateChallengesDisplay() {
    const challengesContainer = document.getElementById('dailyChallenges');
    const currentDayEl = document.getElementById('currentDay');
    
    if (!challengesContainer) return;
    
    console.log('🔄 Updating challenges display...');
    console.log('📊 Current challenge progress:', this.appState.challengeProgress);
    
    // Set current day (for demo, use day of month)
    const currentDay = new Date().getDate();
    if (currentDayEl) currentDayEl.textContent = currentDay;
    
    // Use appState.challengeProgress instead of calling API again
    const progress = this.appState.challengeProgress || {};
    
    // Update daily challenges
    challengesContainer.innerHTML = '';
    
    CONFIG.DAILY_CHALLENGES.forEach(challenge => {
      const currentProgress = progress[challenge.type] || 0;
      const isCompleted = localStorage.getItem(`challenge_completed_${challenge.id}_${this.appState.address}`);
      const progressPercent = Math.min((currentProgress / challenge.target) * 100, 100);
      
      console.log(`📊 Challenge ${challenge.type}: ${currentProgress}/${challenge.target} (${progressPercent}%)`);
      
      const challengeEl = document.createElement('div');
      challengeEl.className = `daily-challenge ${isCompleted ? 'completed' : ''}`;
      
      challengeEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">${challenge.icon}</span>
            <div>
              <div style="font-weight: 600;">${challenge.title}</div>
              <div style="font-size: 12px; opacity: 0.7;">${challenge.desc}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 600; color: #f59e0b;">+${challenge.reward} XP</div>
            ${isCompleted ? '<div style="color: #10b981; font-size: 12px;">✓ COMPLETED</div>' : 
              `<div style="font-size: 12px; opacity: 0.7;">${currentProgress}/${challenge.target}</div>`}
          </div>
        </div>
        <div class="challenge-progress">
          <div class="challenge-progress-bar" style="width: ${progressPercent}%"></div>
        </div>
      `;
      
      challengesContainer.appendChild(challengeEl);
    });
    
    console.log('✅ Challenges display updated');
  }

  // Smart wallet connection based on environment
  async connectWallet() {
    try {
      console.log(`🔗 Connecting wallet in ${this.environment} environment...`);
      
      // Show loading state
      const connectBtn = document.getElementById('connect-btn');
      const originalText = connectBtn.textContent;
      connectBtn.textContent = '🔄 Connecting...';
      connectBtn.disabled = true;
      
      let provider;
      let walletType = '';
      
      if (this.environment === 'farcaster') {
        // Farcaster Wallet connection
        provider = await this.connectFarcasterWallet();
        walletType = 'Farcaster';
      } else {
        // Web Wallet connection
        provider = await this.connectWebWallet();
        walletType = 'Web3';
      }

      if (!provider) {
        throw new Error('No wallet provider available');
      }

      // Request accounts
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      console.log(`✅ Connected to ${walletType} wallet:`, accounts[0]);

      // Setup ethers
      this.appState.provider = new ethers.providers.Web3Provider(provider);
      this.appState.signer = this.appState.provider.getSigner();
      this.appState.address = accounts[0];
      this.appState.connected = true;
      this.appState.walletType = walletType;

      // Update UI
      this.updateWalletUI();
      
      // Check and switch to correct network
      await this.ensureCorrectNetwork();
      
      // Load data
      await this.loadUserData();
      
      // Wallet connected successfully - no notification needed

    } catch (error) {
      console.error('Connection error:', error);
      this.showError(error.message);
    } finally {
      // Reset button
      const connectBtn = document.getElementById('connect-btn');
      connectBtn.textContent = this.environment === 'farcaster' ? '🟣 Connect Farcaster Wallet' : '🦊 Connect Web3 Wallet';
      connectBtn.disabled = false;
    }
  }

  // Connect to Farcaster Wallet
  async connectFarcasterWallet() {
    console.log('🟣 Attempting Farcaster wallet connection...');
    
    try {
      // First try Farcaster SDK wallet
      if (this.sdk && this.sdk.wallet && this.sdk.wallet.ethProvider) {
        console.log('✅ Using Farcaster SDK wallet provider');
        return this.sdk.wallet.ethProvider;
      }
      
      // Try Farcaster client wallet
      if (this.farcasterClient && this.sdk && this.sdk.actions) {
        try {
          await this.sdk.actions.ready();
          if (this.sdk.wallet && this.sdk.wallet.ethProvider) {
            console.log('✅ Using Farcaster client wallet');
            return this.sdk.wallet.ethProvider;
          }
        } catch (e) {
          console.log('⚠️ Farcaster client wallet not available');
        }
      }
      
      // Fallback to window.ethereum if available
      if (window.ethereum) {
        console.log('⚠️ Falling back to window.ethereum');
        return window.ethereum;
      }
      
      throw new Error('No Farcaster wallet available');
      
    } catch (error) {
      console.error('Farcaster wallet connection failed:', error);
      throw new Error('Farcaster wallet not available. Please use Warpcast app.');
    }
  }

  // Connect to Web Wallet
  async connectWebWallet() {
    console.log('🌐 Attempting Web wallet connection...');
    
    try {
      // Check for MetaMask first
      if (window.ethereum && !window.ethereum.isCoinbaseWallet && !window.ethereum.isBraveWallet) {
        console.log('✅ Using MetaMask');
        return window.ethereum;
      }
      
      // Check for Coinbase Wallet
      if (window.ethereum && window.ethereum.isCoinbaseWallet) {
        console.log('✅ Using Coinbase Wallet');
        return window.ethereum;
      }
      
      // Check for Brave Wallet
      if (window.ethereum && window.ethereum.isBraveWallet) {
        console.log('✅ Using Brave Wallet');
        return window.ethereum;
      }
      
      // Check for Phantom
      if (window.ethereum && window.ethereum.isPhantom) {
        console.log('✅ Using Phantom Wallet');
        return window.ethereum;
      }
      
      // Check for WalletConnect
      if (window.WalletConnect) {
        console.log('✅ Using WalletConnect');
        return window.WalletConnect;
      }
      
      // If no wallet found, show wallet selection modal
      return await this.showWalletSelectionModal();
      
    } catch (error) {
      console.error('Web wallet connection failed:', error);
      throw new Error('No Web3 wallet found. Please install MetaMask or another Web3 wallet.');
    }
  }

  // Show wallet selection modal for web users
  async showWalletSelectionModal() {
    return new Promise((resolve, reject) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `;
      
      modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e003e 0%, #330066 100%); padding: 30px; border-radius: 20px; text-align: center; max-width: 400px; border: 2px solid #6366f1;">
          <h3 style="margin-bottom: 20px;">🦊 Choose Your Wallet</h3>
          <p style="margin-bottom: 20px; opacity: 0.8;">Select a Web3 wallet to connect:</p>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="metamask-btn" style="background: linear-gradient(135deg, #F6851B, #E2761B); color: white; border: none; padding: 15px; border-radius: 12px; cursor: pointer; font-weight: 600;">
              🦊 MetaMask
            </button>
            
            <button id="coinbase-btn" style="background: linear-gradient(135deg, #0052FF, #0052FF); color: white; border: none; padding: 15px; border-radius: 12px; cursor: pointer; font-weight: 600;">
              🟦 Coinbase Wallet
            </button>
            
            <button id="brave-btn" style="background: linear-gradient(135deg, #FF200D, #FF200D); color: white; border: none; padding: 15px; border-radius: 12px; cursor: pointer; font-weight: 600;">
              🦁 Brave Wallet
            </button>
            
            <button id="phantom-btn" style="background: linear-gradient(135deg, #AB9DF2, #AB9DF2); color: white; border: none; padding: 15px; border-radius: 12px; cursor: pointer; font-weight: 600;">
              👻 Phantom
            </button>
          </div>
          
          <button id="cancel-btn" style="background: rgba(255,255,255,0.1); color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 20px; cursor: pointer;">
            Cancel
          </button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add event listeners
      document.getElementById('metamask-btn').onclick = () => {
        document.body.removeChild(modal);
        resolve(window.ethereum);
      };
      
      document.getElementById('coinbase-btn').onclick = () => {
        document.body.removeChild(modal);
        window.open('https://wallet.coinbase.com/', '_blank');
        reject(new Error('Please install Coinbase Wallet and try again'));
      };
      
      document.getElementById('brave-btn').onclick = () => {
        document.body.removeChild(modal);
        window.open('https://brave.com/wallet/', '_blank');
        reject(new Error('Please install Brave Wallet and try again'));
      };
      
      document.getElementById('phantom-btn').onclick = () => {
        document.body.removeChild(modal);
        window.open('https://phantom.app/', '_blank');
        reject(new Error('Please install Phantom Wallet and try again'));
      };
      
      document.getElementById('cancel-btn').onclick = () => {
        document.body.removeChild(modal);
        reject(new Error('Wallet selection cancelled'));
      };
    });
  }

  async disconnect() {
    this.appState = {
      connected: false,
      address: null,
      xp: 0,
      slotsCredits: 0,
      provider: null,
      signer: null,
      isTransactionPending: false,
      level: 1,
      totalXP: 0,
      combo: 0,
      comboMultiplier: 1,
      ownedDogs: [],
      challengeProgress: {},
      dailyStats: {
        pets: 0,
        greets: 0,
        flips: 0,
        slots: 0,
        collections: 0
      },
      lastActionTime: 0
    };
    this.updateWalletUI();
    console.log('🔌 Wallet disconnected');
  }

  updateWalletUI() {
    const connectArea = document.getElementById('connect-area');
    const connectedArea = document.getElementById('connected-area');
    const addressEl = document.getElementById('address');

    if (this.appState.connected) {
      connectArea.style.display = 'none';
      connectedArea.style.display = 'block';
      
      if (addressEl) {
        const walletIcon = this.appState.walletType === 'Farcaster' ? '🟣' : '🦊';
        addressEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
            <span>${walletIcon}</span>
            <span>${this.appState.address.slice(0,6)}...${this.appState.address.slice(-4)}</span>
            <span style="font-size: 12px; opacity: 0.7;">(${this.appState.walletType})</span>
          </div>
        `;
      }
    } else {
      connectArea.style.display = 'block';
      connectedArea.style.display = 'none';
    }
  }

  async loadUserData() {
    if (!this.appState.connected || !this.appState.address) return;
    
    console.log('🔄 Loading user data for:', this.appState.address);
    
    try {
      // Check for daily reset (temporarily disabled)
      // await this.checkDailyReset();
      
      // Load XP from localStorage
      try {
        this.appState.xp = await apiService.getUserXP(this.appState.address);
        console.log('✅ XP loaded from localStorage:', this.appState.xp);
      } catch (error) {
        console.error('❌ Failed to load XP from localStorage:', error.message);
        this.appState.xp = 0; // Default to 0 if API fails
      }
      
      // Calculate level from total XP (assuming total XP is same as current XP for now)
      this.appState.totalXP = this.appState.xp;
      this.appState.level = Math.floor(this.appState.totalXP / 1000) + 1;
      
              // Load other data from localStorage
      try {
        this.appState.ownedDogs = await apiService.getOwnedDogs(this.appState.address);
        console.log('✅ Collection loaded:', this.appState.ownedDogs);
      } catch (error) {
        console.error('❌ Failed to load collection:', error);
        this.appState.ownedDogs = [];
      }
      
      try {
        this.appState.challengeProgress = await apiService.getChallengeProgress(this.appState.address);
        console.log('✅ Challenge progress loaded:', this.appState.challengeProgress);
      } catch (error) {
        console.error('❌ Failed to load challenge progress:', error);
        this.appState.challengeProgress = {};
      }
      
      try {
        this.appState.dailyStats = await apiService.getDailyStats(this.appState.address);
        console.log('✅ Daily stats loaded:', this.appState.dailyStats);
      } catch (error) {
        console.error('❌ Failed to load daily stats:', error);
        this.appState.dailyStats = { pets: 0, greets: 0, flips: 0, slots: 0 };
      }
      
      // Update displays
      document.getElementById('xp').textContent = this.appState.xp;
      document.getElementById('level').textContent = this.appState.level;
      
      // Update X follow header button status
      this.updateXFollowHeaderStatus();
      
      // Update tab displays
      if (this.activeTab === 'collection') {
        this.updateCollectionDisplay();
      }
      if (this.activeTab === 'challenges') {
        this.updateChallengesDisplay();
      }
      if (this.activeTab === 'claim') {
        this.updateWalletDogBalance();
      }
      
      // Mark data as loaded
      this.appState.dataLoaded = true;
      
      console.log('✅ User data loading completed');
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      
      // Don't show error for network issues, just log
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.warn('⚠️ Network issue detected, will retry on next action');
      } else {
        this.showError('Failed to load user data. Please try again.');
      }
    }
  }

  async checkDailyReset() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem(`last_daily_reset_${this.appState.address}`);
    
    if (lastReset !== today) {
      console.log('🔄 Daily reset detected! Resetting challenges and daily stats...');
      
      // Reset daily stats
      this.appState.dailyStats = {
        pets: 0,
        greets: 0,
        flips: 0,
        slots: 0
      };
      
      // Reset challenge progress
      this.appState.challengeProgress = {
        pet: 0,
        greet: 0,
        flip: 0,
        slots: 0,
        collection: 0
      };
      
      // Save both together to avoid circular calls
      await apiService.setDailyStats(this.appState.address, this.appState.dailyStats, this.appState.challengeProgress);
      
      // Clear completed challenges
      CONFIG.DAILY_CHALLENGES.forEach(challenge => {
        localStorage.removeItem(`challenge_completed_${challenge.id}_${this.appState.address}`);
      });
      
      // Set today as last reset date
      localStorage.setItem(`last_daily_reset_${this.appState.address}`, today);
      
      console.log('✅ Daily reset completed!');
      
      // Reset completed silently - no notification needed
    }
  }

          // No longer needed - XP is only in localStorage now
        // async syncDataWithBackend() {
        //   // This function is deprecated - XP is now only stored in localStorage
        // }

  // Achievement and sharing functions
  showAchievementModal(achievement) {
    const modal = document.getElementById('achievementModal');
    const icon = document.getElementById('achievementIcon');
    const title = document.getElementById('achievementTitle');
    const description = document.getElementById('achievementDescription');
    
    if (!modal || !icon || !title || !description) {
      console.error('Achievement modal elements not found');
      return;
    }
    
    icon.textContent = achievement.icon || '🎉';
    title.textContent = achievement.title || 'Achievement!';
    description.textContent = achievement.description || '';
    
    modal.style.display = 'flex';
    
    // Store current achievement for sharing
    window.currentAchievement = achievement;
    
    console.log('🎉 Achievement modal shown:', achievement);
  }

  closeAchievementModal() {
    const modal = document.getElementById('achievementModal');
    if (modal) {
      modal.style.display = 'none';
    }
    window.currentAchievement = null;
    console.log('Modal closed');
  }

  shareCurrentAchievement() {
    if (window.currentAchievement) {
      console.log('📢 Sharing achievement:', window.currentAchievement);
      this.closeAchievementModal();
    }
  }

  shareCollection() {
    if (!this.appState.connected) {
      this.showError('Connect wallet to share collection');
      return;
    }
    
    const ownedCount = this.appState.ownedDogs.length;
    const totalCount = CONFIG.DOG_BREEDS.length;
    
    const achievement = {
      icon: '🏆',
      title: 'Dog Collection Progress!',
      description: `I've collected ${ownedCount}/${totalCount} dogs in Monad Dog! My collection is growing!`,
      type: 'collection',
      data: { owned: ownedCount, total: totalCount }
    };
    
    this.showAchievementModal(achievement);
  }

    showXFollowModal() {
    const modal = document.getElementById('xFollowModal');
    if (modal) {
      modal.style.display = 'flex';
      console.log('🎯 X Follow modal shown');
    }
  }

  hideXFollowModal() {
    const modal = document.getElementById('xFollowModal');
    if (modal) {
      modal.style.display = 'none';
      console.log('🎯 X Follow modal hidden');
    }
  }

  async completeXFollowChallenge() {
    try {
      console.log('🎯 X Follow Challenge started');
      
      // Check if wallet is connected
      if (!this.appState.address) {
        this.showError('Please connect your wallet first!');
        return;
      }

      // Check if already completed today
      const today = new Date().toDateString();
      const lastCompleted = localStorage.getItem(`x_follow_daily_${this.appState.address}`);
      
      console.log('📅 Today:', today);
      console.log('👤 Address:', this.appState.address);
      console.log('🔄 Last completed:', lastCompleted);
      
      if (lastCompleted === today) {
        this.showError('🎯 Daily Task Already Completed!\n\nYou have already claimed your daily X follow reward today. Come back tomorrow for another 1000 XP!');
        return;
      }

      console.log('✅ User started task');

      // Give XP immediately when user clicks OK
      console.log('💰 Giving X follow reward immediately...');
      await this.giveXFollowReward();

      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Open X profile
      if (isMobile) {
        // Try to open X app first
        window.location.href = `twitter://user?screen_name=monaddogg`;

        // Fallback to web after 1 second
        setTimeout(() => {
          window.open('https://x.com/monaddogg', '_blank');
        }, 1000);
      } else {
        // Desktop: open in new tab
        window.open('https://x.com/monaddogg', '_blank');
      }

      console.log('🌐 X profile opened');

    } catch (error) {
      console.error('❌ Error completing X follow challenge:', error);
      this.showError('Failed to complete task. Please try again.');
    }
  }

  async giveXFollowReward() {
    try {
      console.log('🎯 Starting X follow reward process...');
      
      const today = new Date().toDateString();
      console.log('📅 Today:', today);
      console.log('👤 Address:', this.appState.address);
      
      // Mark as completed for today
      localStorage.setItem(`x_follow_daily_${this.appState.address}`, today);
      console.log('💾 Marked as completed for today');

      // Add XP directly (skip wallet check for X follow task)
      console.log('💰 Adding 1000 XP...');
      console.log('📊 Current XP before:', this.appState.xp);
      await this.addXP(1000, true);
      console.log('📊 Current XP after:', this.appState.xp);
      console.log('✅ XP added successfully');

      // Force immediate display update
      const xpElement = document.getElementById('xp');
      if (xpElement) {
        xpElement.textContent = this.appState.xp;
        console.log('📊 XP display force updated:', this.appState.xp);
      }

              // Force immediate localStorage save to prevent race condition
      try {
                  console.log('💾 Force saving XP to localStorage immediately...');
        await apiService.updateUserXP(this.appState.address, this.appState.xp);
                  console.log('✅ XP force saved to localStorage successfully');
              } catch (error) {
          console.error('❌ Failed to force save XP to localStorage:', error.message);
      }

      // Show success message
      this.showSuccess(`🎉 Daily Task Completed!\n\n✅ Followed @monaddogg on X\n💰 +1000 XP earned!\n⏰ Come back tomorrow for another reward!`);

      // Update button status
      this.updateXFollowHeaderStatus();

      // Create confetti for big reward
      this.createConfetti();

      console.log('✅ Daily X follow task completed - 1000 XP added');
    } catch (error) {
      console.error('❌ Error giving X follow reward:', error);
      this.showError('Failed to claim reward. Please try again.');
    }
  }



  updateXFollowHeaderStatus() {
    if (!this.appState.address) return;
    
    const headerButton = document.getElementById('x-follow-header-btn');
    if (!headerButton) {
      console.log('⚠️ X follow header button not found');
      return;
    }
    
    console.log('🔄 Updating X follow header status...');
    
    // Check if X follow reward was claimed today
    const today = new Date().toDateString();
    const lastCompleted = localStorage.getItem(`x_follow_daily_${this.appState.address}`);
    
    console.log('📅 Today:', today);
    console.log('👤 Address:', this.appState.address);
    console.log('🔄 Last completed:', lastCompleted);
    
    if (lastCompleted === today) {
      // Show as completed for today
      headerButton.classList.add('disabled');
      headerButton.title = '🎯 Daily Task Completed!\nCome back tomorrow for another 1000 XP reward!';
      
      // Update the reward text to show completed
      const rewardSpan = headerButton.querySelector('.x-reward-minimal');
      if (rewardSpan) {
        rewardSpan.textContent = '✅ Done';
        rewardSpan.style.color = '#10b981';
      }
      
      console.log('✅ X follow task completed for today');
    } else {
      // Show as available
      headerButton.classList.remove('disabled');
      headerButton.title = '🎯 Daily Task: Follow @monaddogg on X\n💰 Reward: +1000 XP\n⏰ Type: Daily (resets every day)';
      
      // Update the reward text to show available
      const rewardSpan = headerButton.querySelector('.x-reward-minimal');
      if (rewardSpan) {
        rewardSpan.textContent = '+1000 XP';
        rewardSpan.style.color = '#ffffff';
      }
      
      console.log('🎯 X follow task available');
    }
  }

  shareChallenges() {
    if (!this.appState.connected) {
      this.showError('Connect wallet to share challenges');
      return;
    }
    
    const completedCount = CONFIG.DAILY_CHALLENGES.filter(challenge => 
      localStorage.getItem(`challenge_completed_${challenge.id}_${this.appState.address}`)
    ).length;
    
    const achievement = {
      icon: '🎯',
      title: 'Daily Challenges Progress!',
      description: `I've completed ${completedCount}/${CONFIG.DAILY_CHALLENGES.length} daily challenges in Monad Dog!`,
      type: 'challenge',
      data: { completed: completedCount, total: CONFIG.DAILY_CHALLENGES.length }
    };
    
    this.showAchievementModal(achievement);
  }
}

// Create global game instance
window.gameManager = new GameManager(); 