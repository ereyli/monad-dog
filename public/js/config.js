// Configuration file - All constants and settings
const CONFIG = {
  // API Configuration
  API_BASE_URL: 'http://localhost:3000/api',
  
  // Contract addresses
  CONTRACTS: {
    PET: "0xc53abe4c593b9440407f8ac1b346f3f999e6d8ed",
    GREET: "0xbc8b78f3e2348d4b5e0390fe700ce54b59931da4",
    FLIP: "0xc5b2280d1e2f155f9a2be2af7e78190658874106",
    SLOTS: "0xc7011f245aa51fa488783d5b0cfc6e0cba86f6cb",
    DOG_TOKEN: "0x1f6649d028c4c146c050a9b224115a01c92a02f3"
  },

  // Contract ABIs
  ABIS: {
    PET: ["function pet() public"],
    GREET: ["function gm() public", "function gn() public"],
    FLIP: ["function flip() public"],
    SLOTS: [
      "function buyCredits() external payable",
      "function playSlots() external returns (uint8[4])",
      "function getCredits(address player) external view returns (uint256)",
      "function getGameStats() external view returns (uint256, uint256, uint256)",
      "event CreditsPurchased(address indexed player, uint256 credits, uint256 cost)",
      "event GamePlayed(address indexed player, uint8[4] results, uint256 creditsRemaining)",
      "event Jackpot(address indexed player, uint8 symbol, uint256 prize)"
    ],
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
  },

  // Game Configuration
  XP_TO_DOG_RATE: 10, // 10 XP = 1 DOG token
  
  DOG_BREEDS: [
    { id: 'shiba', name: 'Shiba', rarity: 'common', xpBonus: 1.0, image: '🐕', unlockCondition: 'pet_10' },
    { id: 'husky', name: 'Husky', rarity: 'rare', xpBonus: 1.2, image: '🦮', unlockCondition: 'pet_50' },
    { id: 'golden', name: 'Golden Retriever', rarity: 'epic', xpBonus: 1.5, image: '🐕‍🦺', unlockCondition: 'pet_100' },
    { id: 'samoyed', name: 'Samoyed', rarity: 'legendary', xpBonus: 2.0, image: '🐺', unlockCondition: 'pet_200' },
    { id: 'poodle', name: 'Poodle', rarity: 'rare', xpBonus: 1.3, image: '🐩', unlockCondition: 'greet_20' },
    { id: 'bulldog', name: 'Bulldog', rarity: 'epic', xpBonus: 1.6, image: '🐕', unlockCondition: 'greet_50' },
    { id: 'dalmatian', name: 'Dalmatian', rarity: 'legendary', xpBonus: 2.2, image: '🐕', unlockCondition: 'greet_100' },
    { id: 'chihuahua', name: 'Chihuahua', rarity: 'common', xpBonus: 1.1, image: '🐕', unlockCondition: 'flip_10' },
    { id: 'german_shepherd', name: 'German Shepherd', rarity: 'rare', xpBonus: 1.4, image: '🐕', unlockCondition: 'flip_25' },
    { id: 'border_collie', name: 'Border Collie', rarity: 'epic', xpBonus: 1.7, image: '🐕', unlockCondition: 'flip_50' },
    { id: 'great_dane', name: 'Great Dane', rarity: 'legendary', xpBonus: 2.5, image: '🐕', unlockCondition: 'flip_100' },
    { id: 'pomeranian', name: 'Pomeranian', rarity: 'common', xpBonus: 1.1, image: '🐕', unlockCondition: 'slots_5' },
    { id: 'labrador', name: 'Labrador', rarity: 'rare', xpBonus: 1.3, image: '🐕', unlockCondition: 'slots_15' },
    { id: 'saint_bernard', name: 'Saint Bernard', rarity: 'epic', xpBonus: 1.8, image: '🐕', unlockCondition: 'slots_30' },
    { id: 'wolf', name: 'Wolf', rarity: 'mythical', xpBonus: 3.0, image: '🐺', unlockCondition: 'slots_50' }
  ],

  DAILY_CHALLENGES: [
    { id: 'pet_master', title: 'Pet Master', desc: 'Pet 10 dogs today', reward: 500, type: 'pet', target: 10, icon: '🐕' },
    { id: 'greet_king', title: 'Greet King', desc: 'Say GM 5 times', reward: 300, type: 'greet', target: 5, icon: '👋' },
    { id: 'lucky_streak', title: 'Lucky Streak', desc: 'Win 3 coin flips', reward: 400, type: 'flip', target: 3, icon: '🪙' },
    { id: 'slot_legend', title: 'Slot Legend', desc: 'Play 5 slot games', reward: 1000, type: 'slots', target: 5, icon: '🎰' },
    { id: 'collection_hunter', title: 'Collection Hunter', desc: 'Unlock 2 new dogs', reward: 750, type: 'collection', target: 2, icon: '🏆' }
  ],

  // Special one-time challenges
  SPECIAL_CHALLENGES: [
    { 
      id: 'x_follower', 
      title: 'X Follower', 
      desc: 'Follow us on X (Twitter)', 
      reward: 1000, 
      type: 'social', 
      target: 1, 
      icon: '🐦',
      url: 'https://x.com/monaddogg',
      oneTime: true,
      completed: false
    }
  ],

  SEASON_CONFIG: {
    current: 1,
    duration: 30,
    rewards: {
      bronze: { xp: 1000, tokens: 100 },
      silver: { xp: 2500, tokens: 250 },
      gold: { xp: 5000, tokens: 500 },
      diamond: { xp: 10000, tokens: 1000 }
    }
  },

  // Network Configuration
  MONAD_CHAIN_ID: '0x279F', // 10143 in hex
  MONAD_RPC_URL: 'https://testnet-rpc.monad.xyz',
  
  // UI Configuration
  ANIMATION_DURATION: 800,
  COMBO_TIMEOUT: 5000, // 5 seconds
  MAX_COMBO_MULTIPLIER: 2.0,
  
  // Local Storage Keys
  STORAGE_KEYS: {
    XP: 'wallet_xp_',
    OWNED_DOGS: 'owned_dogs_',
    CHALLENGE_PROGRESS: 'challenge_progress_',
    DAILY_STATS: 'daily_stats_',
    DOG_BALANCE: 'dog_balance_',
    TOTAL_PETS: 'total_pets_'
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} 