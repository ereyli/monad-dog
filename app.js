// Mini App ready when loaded
window.addEventListener('load', async () => {
  console.log('🚀 App loaded successfully');
});

// Wait for Supabase to load
window.addEventListener('DOMContentLoaded', function() {
  // Supabase Configuration
  const SUPABASE_URL = 'https://uhqszfoekqrjtybrwqzt.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocXN6Zm9la3FyanR5YnJ3cXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MDMxNTAsImV4cCI6MjA2NjM3OTE1MH0.gGch8B6AlvGrZTDVjfd0xidVnh_Dsua4qRxbaixBqM0';
  
  // Initialize Supabase
  let supabaseClient;
  if (window.supabase) {
    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
  } else {
    console.error('❌ Supabase not loaded');
  }

  console.log('🚀 Starting app...');
  
  // Initialize the app
  initApp();
});

// Global state 
let appState = {
  connected: false,
  address: null,
  xp: 0,
  totalXP: 0,
  claimedXP: 0,
  provider: null,
  signer: null,
  isTransactionPending: false
};

// Contract addresses and ABIs
const CONTRACTS = {
  PET: "0xc53abe4c593b9440407f8ac1b346f3f999e6d8ed",
  GREET: "0xbc8b78f3e2348d4b5e0390fe700ce54b59931da4",
  FLIP: "0xc5b2280d1e2f155f9a2be2af7e78190658874106",
  DOG_TOKEN: "0x1f6649d028c4c146c050a9b224115a01c92a02f3"
};

const ABIS = {
  PET: ["function pet() public"],
  GREET: ["function gm() public", "function gn() public"],
  FLIP: ["function flip() public"],
  DOG_TOKEN: [
    "function claim(uint256 xpAmount) public",
    "function balanceOf(address account) public view returns (uint256)",
    "function decimals() public view returns (uint8)",
    "function symbol() public view returns (string)",
    "function totalSupply() public view returns (uint256)",
    "function getClaimedXP(address user) public view returns (uint256)",
    "function totalMinted() public view returns (uint256)",
    "event TokensClaimed(address indexed user, uint256 xpAmount, uint256 tokenAmount)"
  ]
};

// XP to DOG token conversion rate
const XP_TO_DOG_RATE = 10;

// Enhanced Loading Management
let loadingProgress = 0;
let isAppReady = false;
let activeTab = 'pet';

function updateLoadingProgress(progress, message) {
  const progressBar = document.getElementById('loadingProgressBar');
  const subtitle = document.querySelector('.loading-subtitle');
  
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  
  if (subtitle && message) {
    subtitle.innerHTML = message;
  }
  
  loadingProgress = progress;
  console.log(`📊 Loading progress: ${progress}% - ${message}`);
}

function showLoadingState() {
  document.getElementById('loading').style.display = 'flex';
  document.querySelector('.app-content').classList.remove('loaded');
  updateLoadingProgress(0, 'Starting Monad Dog...<br>🚀 Initializing blockchain connection');
}

function hideLoadingState() {
  updateLoadingProgress(100, 'Ready to play! 🎉<br>Welcome to Monad Dog!');
  
  setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
    document.querySelector('.app-content').classList.add('loaded');
    isAppReady = true;
    console.log('🎉 App fully loaded and ready');
  }, 500);
}

// Initialize app
async function initApp() {
  console.log('🚀 Initializing app...');
  
  // Hide loading screen immediately
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  // Show app content
  const appContent = document.querySelector('.app-content');
  if (appContent) {
    appContent.classList.add('loaded');
  }
  
  // Wait for ethers to load
  let attempts = 0;
  while (typeof ethers === 'undefined' && attempts < 10) {
    console.log(`⏳ Waiting for ethers to load... (attempt ${attempts + 1}/10)`);
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }
  
  // Check if ethers is loaded
  if (typeof ethers === 'undefined') {
    console.error('❌ Ethers library not loaded after waiting');
    showError('Ethers library failed to load. Please refresh the page.');
    return;
  }
  
  console.log('✅ Ethers library loaded');
  
  // Setup event listeners and game functions
  setupEventListeners();
  setupGameFunctions();
  
  // Initialize slot machine
  initSlotMachine();
  
  // Add MON balance for testing (remove in production)
  monBalance = 1.0;
  updateMonBalance();
  
  // Update network indicator
  updateNetworkIndicator();
  
  console.log('✅ App initialized successfully');
}

// Initialize slot machine
function initSlotMachine() {
  console.log('🎰 Initializing slot machine...');
  resetSlotGrid();
  updateDemoUI();
}

// --- DEMO MOD: Disable backend/contract XP/token fetches ---
function getWalletXP() { return 0; }
function saveWalletXP() { return; }
function getClaimedXPAmount() { return 0; }
function updateXPDisplay() { return; }
function updateTokenBalance() { return; }

function updateMonBalance() {
  const monDisplay = document.getElementById('monBalance');
  if (monDisplay) {
    monDisplay.textContent = monBalance.toFixed(1);
  }
}

// --- Modern Slot Machine Reel Logic ---
// Slot sonucu ağırlıklı random ile belirlenir. Kemik (🦴) çok nadir (~%2), diğer köpekler daha sık gelir.
// 3 kemik veya 3 aynı köpek kombinasyonu istatistiksel olarak 50+ spin'de 1 gelir.

const DOG_SYMBOLS = [
  { key: 'golden', emoji: '🐕', class: 'dog-golden', weight: 22 },
  { key: 'shepherd', emoji: '🐕‍🦺', class: 'dog-shepherd', weight: 22 },
  { key: 'husky', emoji: '🐶', class: 'dog-husky', weight: 22 },
  { key: 'poodle', emoji: '🦮', class: 'dog-poodle', weight: 22 },
  { key: 'bulldog', emoji: '🐩', class: 'dog-bulldog', weight: 10 },
  { key: 'bone', emoji: '🦴', class: 'bone', weight: 2 } // Kemik çok nadir!
];

const REEL_COUNT = 4;
let isSpinning = false;
let monBalance = 1.0;
let xpBalance = 0;
let spinLeft = 10;
let dogBalance = 0;

// --- Sadece Monad ağına izin ver ---
const MONAD_CHAIN_ID = '0x504'; // 1284 decimal

async function ensureMonadNetwork() {
  if (!window.ethereum) return false;
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    console.log('Current chain ID:', chainId);
    
    if (chainId !== MONAD_CHAIN_ID) {
      console.log('Switching to Monad testnet...');
      
      try {
        // Try to switch to Monad testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MONAD_CHAIN_ID }]
        });
        console.log('✅ Switched to Monad testnet');
        return true;
      } catch (switchError) {
        console.log('Switch failed, trying to add network...');
        
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: MONAD_CHAIN_ID,
                chainName: 'Monad Testnet',
                nativeCurrency: {
                  name: 'MON',
                  symbol: 'MON',
                  decimals: 18
                },
                rpcUrls: ['https://rpc.testnet.monad.xyz'],
                blockExplorerUrls: ['https://testnet.monadscan.com']
              }]
            });
            console.log('✅ Added Monad testnet');
            return true;
          } catch (addError) {
            console.error('Failed to add Monad testnet:', addError);
            alert('Please add Monad testnet manually:\nChain ID: 1284\nRPC: https://rpc.testnet.monad.xyz');
            return false;
          }
        } else {
          console.error('Failed to switch to Monad testnet:', switchError);
          alert('Please switch to Monad testnet manually (Chain ID: 1284)');
          return false;
        }
      }
    }
    
    console.log('✅ Already on Monad testnet');
    return true;
  } catch (error) {
    console.error('Network check error:', error);
    return false;
  }
}

// Connect wallet function
async function connectWallet() {
  try {
    console.log('🔗 Connecting wallet...');
    
    if (typeof ethers === 'undefined') {
      throw new Error('Ethers library not loaded. Please refresh the page.');
    }
    
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
      connectBtn.textContent = '🔄 Connecting...';
      connectBtn.disabled = true;
    }
    
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask extension.');
    }
    
    console.log('✅ MetaMask detected');
    
    // Ağ kontrolü
    const isMonad = await ensureMonadNetwork();
    if (!isMonad) return;
    
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }
    
    console.log('✅ Connected to:', accounts[0]);
    
    appState.provider = new ethers.providers.Web3Provider(window.ethereum);
    appState.signer = appState.provider.getSigner();
    appState.address = accounts[0];
    appState.connected = true;
    
    updateWalletUI();
    localStorage.setItem('was_connected', 'true');
    
    // Only call these if we have the functions (demo mode has empty functions)
    if (typeof updateXPDisplay === 'function') {
      updateXPDisplay();
    }
    if (typeof updateTokenBalance === 'function') {
      updateTokenBalance();
    }
    
    if (connectBtn) {
      connectBtn.textContent = '🟣 Connect Wallet';
      connectBtn.disabled = false;
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error);
    showError(error.message);
    
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
      connectBtn.textContent = '🟣 Connect Wallet';
      connectBtn.disabled = false;
    }
  }
}

// Disconnect function
async function disconnect() {
  appState = {
    connected: false,
    address: null,
    xp: 0,
    totalXP: 0,
    claimedXP: 0,
    provider: null,
    signer: null,
    isTransactionPending: false
  };
  
  localStorage.removeItem('was_connected');
  
  updateWalletUI();
  // Only call this if we have the function (demo mode has empty function)
  if (typeof updateXPDisplay === 'function') {
    updateXPDisplay();
  }
  console.log('🔌 Wallet disconnected, XP reset to 0');
}

// Update wallet UI
function updateWalletUI() {
  const connectArea = document.getElementById('connect-area');
  const connectedArea = document.getElementById('connected-area');
  const addressEl = document.getElementById('address');

  if (appState.connected) {
    connectArea.style.display = 'none';
    connectedArea.style.display = 'block';
    addressEl.textContent = appState.address.slice(0,6) + '...' + appState.address.slice(-4);
    updateNetworkIndicator();
  } else {
    connectArea.style.display = 'block';
    connectedArea.style.display = 'none';
    updateNetworkIndicator();
  }
}

// Update network indicator
async function updateNetworkIndicator() {
  const networkEl = document.getElementById('currentNetwork');
  if (!networkEl) return;
  
  if (!window.ethereum) {
    networkEl.textContent = 'No Wallet';
    return;
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId === MONAD_CHAIN_ID) {
      networkEl.textContent = 'Monad Testnet';
      networkEl.style.color = '#00ff00';
    } else {
      networkEl.textContent = 'Wrong Network';
      networkEl.style.color = '#ff0000';
    }
  } catch (error) {
    networkEl.textContent = 'Error';
    networkEl.style.color = '#ff0000';
  }
}

// Add XP function
async function addXP(amount) {
  console.log(`✨ Adding ${amount} XP...`);
  
  if (appState.connected && appState.address) {
    // Connected mode - use main XP system
    appState.totalXP = (appState.totalXP || 0) + amount;
    appState.xp = Math.max(0, appState.totalXP - (appState.claimedXP || 0));
    
    document.getElementById('xp').textContent = appState.xp;
    
    saveWalletXP(appState.address, appState.totalXP);
    
    requestAnimationFrame(() => updateClaimUI());
    
    const xpElement = document.getElementById('xp');
    xpElement.style.transform = 'scale(1.2)';
    xpElement.style.color = '#00ff00';
    
    setTimeout(() => {
      xpElement.style.transform = 'scale(1)';
      xpElement.style.color = 'white';
    }, 500);
    
    console.log(`✨ XP added to ${appState.address}: +${amount}, Total: ${appState.totalXP}, Available: ${appState.xp}`);
  } else {
    // Demo mode - use demo variables
    xpBalance += amount;
    document.getElementById('xp').textContent = xpBalance;
    updateDemoUI();
    
    const xpElement = document.getElementById('xp');
    xpElement.style.transform = 'scale(1.2)';
    xpElement.style.color = '#00ff00';
    
    setTimeout(() => {
      xpElement.style.transform = 'scale(1)';
      xpElement.style.color = 'white';
    }, 500);
    
    console.log(`✨ Demo XP added: +${amount}, Total: ${xpBalance}`);
  }
}

// Show status function
function showStatus(id, message, type) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.className = `status visible ${type}`;
}

// Hide status function
function hideStatus(id) {
  document.getElementById(id).className = 'status';
}

// Show error function
function showError(message) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(255,0,0,0.9);color:white;padding:10px 20px;border-radius:8px;z-index:1000;';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

// Execute transaction function
async function executeTransaction(contractAddress, abi, methodName, statusId, successMsg, xpAmount) {
  if (!appState.connected) {
    showError('Connect wallet first');
    return;
  }

  if (appState.isTransactionPending) {
    showError('Please wait for the current transaction to complete');
    return;
  }

  try {
    console.log('🔗 Starting transaction:', methodName);
    
    showStatus(statusId, 'Preparing transaction...', 'pending');

    const contract = new ethers.Contract(contractAddress, abi, appState.signer);
    
    showStatus(statusId, '🔐 Please confirm in your wallet...', 'pending');

    const tx = await contract[methodName]({
      gasLimit: 100000
    });

    console.log('✅ Transaction sent:', tx.hash);
    showStatus(statusId, `✅ Transaction sent: ${tx.hash.slice(0,10)}...`, 'pending');

    setTimeout(async () => {
      console.log('✅ Transaction assumed successful');
      showStatus(statusId, successMsg, 'success');
      await addXP(xpAmount);
      
      setTimeout(() => {
        hideStatus(statusId);
      }, 3000);
    }, 2000);

  } catch (error) {
    console.error('❌ Transaction error:', error);
    showStatus(statusId, '❌ Transaction failed', 'error');
    
    setTimeout(() => {
      hideStatus(statusId);
    }, 3000);
  }
}

// XP management functions
// REMOVED: Duplicate function declarations - using demo versions from top of file

// Update claim UI
async function updateClaimUI() {
  const claimableXP = appState.xp || 0;
  const claimableDOG = Math.floor(claimableXP / XP_TO_DOG_RATE);
  
  document.getElementById('claimableXP').textContent = claimableXP;
  document.getElementById('claimableDOG').textContent = claimableDOG;
  
  const claimButton = document.getElementById('claimButton');
  if (claimableXP >= XP_TO_DOG_RATE && appState.connected) {
    claimButton.disabled = false;
    claimButton.textContent = `💰 Claim ${claimableDOG} $DOG Tokens`;
  } else {
    claimButton.disabled = true;
    if (!appState.connected) {
      claimButton.textContent = '🔗 Connect Wallet to Claim';
    } else {
      claimButton.textContent = `💰 Need ${XP_TO_DOG_RATE - claimableXP} more XP to claim`;
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  console.log('🔗 Setting up event listeners...');
  
  const connectBtn = document.getElementById('connect-btn');
  if (connectBtn) {
    console.log('✅ Connect button found, adding click listener');
    connectBtn.onclick = function() {
      console.log('🟣 Connect button clicked!');
      connectWallet();
    };
  } else {
    console.error('❌ Connect button not found!');
  }
  
  const disconnectBtn = document.getElementById('disconnect-btn');
  if (disconnectBtn) {
    console.log('✅ Disconnect button found, adding click listener');
    disconnectBtn.onclick = function() {
      console.log('🔌 Disconnect button clicked!');
      disconnect();
    };
  } else {
    console.error('❌ Disconnect button not found!');
  }
  
  if (window.ethereum) {
    console.log('✅ MetaMask detected, adding event listeners');
    window.ethereum.on('accountsChanged', function (accounts) {
      console.log('🔄 Account changed:', accounts);
      if (accounts.length === 0) {
        disconnect();
      } else if (appState.connected && accounts[0] !== appState.address) {
        appState.address = accounts[0];
        updateWalletUI();
        // Only call these if we have the functions (demo mode has empty functions)
        if (typeof updateXPDisplay === 'function') {
          updateXPDisplay();
        }
        if (typeof updateTokenBalance === 'function') {
          updateTokenBalance();
        }
      }
    });
    
    // Listen for network changes
    window.ethereum.on('chainChanged', function (chainId) {
      console.log('🔄 Network changed:', chainId);
      updateNetworkIndicator();
      if (chainId !== MONAD_CHAIN_ID) {
        showError('Please switch to Monad testnet (Chain ID: 1284)');
      }
    });
  } else {
    console.log('⚠️ MetaMask not detected');
  }
}

// Setup game functions
function setupGameFunctions() {
  window.petDog = async function() {
    console.log('🐕 Pet Dog clicked!');
    
    if (!appState.connected) {
      showError('Connect wallet first');
      return;
    }
    
    if (appState.isTransactionPending) {
      showError('Please wait for the current transaction to complete');
      return;
    }
    
    document.getElementById('dog-img').src = `https://placedog.net/400/300?id=${Math.floor(Math.random() * 50) + 1}`;
    
    await executeTransaction(
      CONTRACTS.PET,
      ABIS.PET,
      'pet',
      'pet-status',
      '🐕 Dog petted successfully! +10 XP',
      10
    );
  };

  window.sayGM = async function() {
    console.log('☀️ Say GM clicked!');
    
    if (!appState.connected) {
      showError('Connect wallet first');
      return;
    }
    
    if (appState.isTransactionPending) {
      showError('Please wait for the current transaction to complete');
      return;
    }
    
    await executeTransaction(
      CONTRACTS.GREET,
      ABIS.GREET,
      'gm',
      'greet-status',
      '☀️ Good Morning sent! +5 XP',
      5
    );
  };

  window.sayGN = async function() {
    console.log('🌙 Say GN clicked!');
    
    if (!appState.connected) {
      showError('Connect wallet first');
      return;
    }
    
    if (appState.isTransactionPending) {
      showError('Please wait for the current transaction to complete');
      return;
    }
    
    await executeTransaction(
      CONTRACTS.GREET,
      ABIS.GREET,
      'gn',
      'greet-status',
      '🌙 Good Night sent! +5 XP',
      5
    );
  };

  window.flipCoin = async function() {
    console.log('🪙 Flip Coin clicked!');
    
    if (!appState.connected) {
      showError('Connect wallet first');
      return;
    }
    
    if (appState.isTransactionPending) {
      showError('Please wait for the current transaction to complete');
      return;
    }
    
    const coin = document.getElementById('coin');
    const result = document.getElementById('flip-result');
    
    result.textContent = 'Flipping...';
    let rotation = 0;
    const interval = setInterval(() => {
      rotation += 180;
      coin.style.transform = `rotateY(${rotation}deg)`;
    }, 100);
    
    await executeTransaction(
      CONTRACTS.FLIP,
      ABIS.FLIP,
      'flip',
      'flip-status',
      '🪙 Coin flipped! +3 XP',
      3
    );
    
    setTimeout(() => {
      clearInterval(interval);
      const finalResult = Math.random() < 0.5 ? 'Heads' : 'Tails';
      coin.style.transform = `rotateY(${finalResult === 'Heads' ? 0 : 180}deg)`;
      result.textContent = `Result: ${finalResult}!`;
    }, 3000);
  };

  window.spinSlots = async function() {
    console.log('🎰 Spin Slots clicked!');
    
    if (!appState.connected) {
      showError('Connect wallet first');
      return;
    }
    
    if (appState.isTransactionPending) {
      showError('Please wait for the current transaction to complete');
      return;
    }
    
    await spinSlots();
  };

  window.shareSlotWin = function() {
    shareSlotWin();
  };

  window.showTab = function(tabName) {
    try {
      console.log('📑 Switching to tab:', tabName);
      activeTab = tabName;
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
      });
      event.target.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabName).classList.add('active');
      if (tabName === 'slots') {
        resetSlotGrid();
      }
    } catch (e) {
      alert('App error: ' + e.message);
    }
  };
}

console.log('📱 App script loaded');

function updateDemoUI() {
  const mon = document.getElementById('monBalance');
  if (mon) mon.textContent = monBalance.toFixed(1);
  const xp = document.getElementById('xpBalance');
  if (xp) xp.textContent = xpBalance;
  const spin = document.getElementById('spinLeft');
  if (spin) spin.textContent = spinLeft;
  const xpGlobal = document.getElementById('xp');
  if (xpGlobal) xpGlobal.textContent = xpBalance;
  const walletDog = document.getElementById('walletDogDisplay');
  if (walletDog) walletDog.textContent = dogBalance;
  const claimXP = document.getElementById('claimableXP');
  const claimDOG = document.getElementById('claimableDOG');
  if (claimXP) claimXP.textContent = xpBalance;
  if (claimDOG) claimDOG.textContent = Math.floor(xpBalance / 10);
  const claimBtn = document.getElementById('claimButton');
  if (claimBtn) {
    if (xpBalance >= 10) {
      claimBtn.disabled = false;
      claimBtn.textContent = `💰 Claim ${Math.floor(xpBalance/10)} $DOG Tokens`;
    } else {
      claimBtn.disabled = true;
      claimBtn.textContent = `💰 Need ${10-xpBalance} more XP to claim`;
    }
  }
}

function resetSlotGrid() {
  for (let r = 0; r < REEL_COUNT; r++) {
    const el = document.getElementById(`reel-${r}-1`);
    if (el) {
      el.textContent = '🐕';
      el.className = 'reel-symbol center';
    }
  }
  updateDemoUI();
}

function weightedRandomSymbol() {
  const total = DOG_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let rnd = Math.random() * total;
  for (const s of DOG_SYMBOLS) {
    if (rnd < s.weight) return s;
    rnd -= s.weight;
  }
  return DOG_SYMBOLS[0];
}

async function spinSlots() {
  if (isSpinning) return;
  if (monBalance < 0.1 || spinLeft <= 0) {
    showStatus('slots-status', '❌ Not enough MON or spins left!', 'error');
    return;
  }
  isSpinning = true;
  const spinButton = document.getElementById('spinButton');
  spinButton.disabled = true;
  spinButton.textContent = '🎰 SPINNING...';
  monBalance -= 0.1;
  spinLeft--;
  updateDemoUI();

  // Remove win highlight
  for (let r = 0; r < REEL_COUNT; r++) {
    const el = document.getElementById(`reel-${r}-1`);
    if (el) el.classList.remove('win');
  }

  // Prepare weighted random results for each reel (center symbol is the result)
  const finalSymbols = [];
  for (let r = 0; r < REEL_COUNT; r++) {
    finalSymbols[r] = weightedRandomSymbol();
  }

  // Animate each center symbol with modern effect
  for (let r = 0; r < REEL_COUNT; r++) {
    animateCenterSymbol(r, finalSymbols[r], 900 + r * 350);
  }

  // Wait for all reels to finish
  setTimeout(() => {
    // Settle final symbols
    for (let r = 0; r < REEL_COUNT; r++) {
      const el = document.getElementById(`reel-${r}-1`);
      if (el) {
        el.textContent = finalSymbols[r].emoji;
        el.className = `reel-symbol center ${finalSymbols[r].class}`;
      }
    }
    // Check win (center line)
    const centerLine = finalSymbols.map(s => s.key);
    let winAmount = 0;
    // 4x bone
    if (centerLine.every(k => k === 'bone')) {
      winAmount = 15000;
    } else if (allSame(centerLine)) {
      winAmount = 10000;
    } else if (hasThreeSame(centerLine)) {
      winAmount = 5000;
    }
    if (winAmount > 0) {
      showSlotWin(winAmount);
      // Always use addXP function (handles both connected and demo modes)
      addXP(winAmount);
      // XP göstergesini kesin güncelle
      if (appState.connected && appState.address) {
        if (typeof updateXPDisplay === 'function') updateXPDisplay();
      } else {
        updateDemoUI();
      }
      // Highlight center symbols
      for (let r = 0; r < REEL_COUNT; r++) {
        const el = document.getElementById(`reel-${r}-1`);
        if (el) el.classList.add('win');
      }
    } else {
      showStatus('slots-status', 'Try again! No win this time.', 'info');
      const resultMessage = document.getElementById('slotResultMessage');
      if (resultMessage) resultMessage.textContent = 'No win!';
      const winAmountEl = document.getElementById('slotWinAmount');
      if (winAmountEl) winAmountEl.textContent = '';
    }
    updateDemoUI();
    isSpinning = false;
    spinButton.disabled = false;
    spinButton.textContent = '🎰 SPIN SLOTS';
  }, 1800 + REEL_COUNT * 350);
}

function animateCenterSymbol(reelIndex, finalSymbol, duration) {
  const el = document.getElementById(`reel-${reelIndex}-1`);
  if (!el) return;
  const steps = 24;
  let currentStep = 0;
  let lastIdx = Math.floor(Math.random() * DOG_SYMBOLS.length);
  const ease = t => 1 - Math.pow(1 - t, 2); // easeOutQuad
  clearInterval(el._spinInterval); // Prevent overlapping intervals
  el._spinInterval = setInterval(() => {
    const t = currentStep / steps;
    const speed = 1 - ease(t); // slow down at end
    if (currentStep < steps - 1) {
      lastIdx = (lastIdx + 1 + Math.floor(Math.random()*2)) % DOG_SYMBOLS.length;
      el.textContent = DOG_SYMBOLS[lastIdx].emoji;
      el.className = `reel-symbol center ${DOG_SYMBOLS[lastIdx].class}`;
      el.style.filter = `blur(${2*speed}px)`;
      el.style.opacity = 0.7 + 0.3 * (1-t);
      el.style.transform = `scale(${1 + 0.15*speed})`;
    } else {
      el.textContent = finalSymbol.emoji;
      el.className = `reel-symbol center ${finalSymbol.class}`;
      el.style.filter = '';
      el.style.opacity = 1;
      el.style.transform = 'scale(1)';
      clearInterval(el._spinInterval);
    }
    currentStep++;
  }, duration / steps);
}

function demoClaim() {
  // Use main XP system if connected, otherwise demo variables
  const currentXP = appState.connected ? appState.xp : xpBalance;
  
  if (currentXP < 10) return;
  
  const claimableDOG = Math.floor(currentXP / 10);
  
  if (appState.connected) {
    // Use main system
    appState.claimedXP = (appState.claimedXP || 0) + claimableDOG * 10;
    appState.xp = Math.max(0, appState.totalXP - appState.claimedXP);
    document.getElementById('xp').textContent = appState.xp;
    updateClaimUI();
  } else {
    // Demo mode
    dogBalance += claimableDOG;
    xpBalance = xpBalance % 10;
    updateDemoUI();
  }
  
  const claimStatus = document.getElementById('claim-status');
  if (claimStatus) {
    claimStatus.textContent = `Claimed ${claimableDOG} $DOG tokens!`;
    claimStatus.className = 'status visible success';
  }
}

function allSame(arr) {
  return arr.every(x => x === arr[0]);
}

function hasThreeSame(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i+1; j < arr.length; j++) {
      for (let k = j+1; k < arr.length; k++) {
        if (arr[i] === arr[j] && arr[j] === arr[k]) return true;
      }
    }
  }
  return false;
}

function showSlotWin(amount) {
  showStatus('slots-status', `🎉 BIG WIN! +${amount} XP!`, 'success');
  const resultMessage = document.getElementById('slotResultMessage');
  if (resultMessage) resultMessage.textContent = '🎉 WINNER!';
  const winAmountEl = document.getElementById('slotWinAmount');
  if (winAmountEl) winAmountEl.textContent = `+${amount} XP`;
}

// Attach all main demo functions to window
window.resetSlotGrid = resetSlotGrid;
window.demoClaim = demoClaim;
window.spinSlots = spinSlots; 