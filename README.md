# 🐕 Monad Dog - Farcaster Mini App

A fun and interactive dog-themed game built for the Monad blockchain, featuring Farcaster integration and daily challenges.

## 🌟 Features

- **🐕 Dog Collection System** - Collect and unlock different dog breeds
- **🎯 Daily Challenges** - Complete tasks for XP rewards
- **🐦 X Follow Task** - Daily 1000 XP reward for following @monaddogg
- **🎮 Interactive Games** - Pet, Greet, Flip, and Slots games
- **💰 $DOG Token System** - Convert XP to $DOG tokens
- **🏆 Level System** - Progress through levels with XP
- **⚡ Combo System** - Bonus XP for rapid actions
- **🟣 Farcaster Integration** - Seamless Farcaster Frame support
- **🌐 Web Browser Support** - MetaMask and Web3 wallet support
- **💾 Local Storage** - All data stored locally in browser

## 🚀 Quick Start

### Prerequisites

- Modern web browser
- Monad Testnet wallet (MetaMask, etc.)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ereyli/monad-dog.git
cd monad-dog
```

2. **Open in browser**
Simply open `public/index.html` in your web browser, or deploy to Vercel for production use.

## 🛠️ Development

### Project Structure

```
monad-dog/
├── public/
│   ├── index.html          # Main application file
│   ├── css/
│   │   └── styles.css      # Application styles
│   └── js/
│       ├── app.js          # Main application logic
│       ├── game.js         # Game mechanics
│       ├── api.js          # Local storage service
│       ├── config.js       # Configuration
│       └── ui.js           # UI utilities
├── package.json            # Dependencies
├── vercel.json            # Vercel deployment config
└── README.md              # This file
```

### Data Storage

All game data is stored locally in the browser using localStorage:
- **XP Points** - Player experience points
- **Dog Collection** - Unlocked dog breeds
- **Challenge Progress** - Daily challenge completion
- **Daily Stats** - Daily activity statistics
- **DOG Token Balance** - Token balances

## 🌐 Deployment

### Vercel Deployment

1. **Connect to Vercel**
```bash
npm install -g vercel
vercel login
```

2. **Deploy**
```bash
vercel --prod
```

3. **Set up custom domain** (optional)
```bash
vercel domains add yourdomain.com
```

### Manual Deployment

Simply upload the `public/` folder to any static hosting service:
- GitHub Pages
- Netlify
- AWS S3
- Any web server

## 🎮 Game Mechanics

### XP System
- **Pet Dog**: 10 XP
- **Say GM/GN**: 5 XP
- **Flip Coin**: 15 XP (win) / 5 XP (lose)
- **Play Slots**: 20-100 XP based on results
- **Daily Challenges**: 300-1000 XP rewards
- **X Follow**: 1000 XP daily

### Dog Collection
Unlock new dog breeds by completing actions:
- **Shiba**: Pet 10 dogs
- **Husky**: Pet 50 dogs
- **Golden Retriever**: Pet 100 dogs
- **Samoyed**: Pet 200 dogs
- And many more!

### Challenges
Complete daily challenges for bonus XP:
- **Pet Master**: Pet 10 dogs today
- **Greet King**: Say GM 5 times
- **Lucky Streak**: Win 3 coin flips
- **Slot Legend**: Play 5 slot games
- **Collection Hunter**: Unlock 2 new dogs

## 🔧 Configuration

### Contract Addresses
All contract addresses are configured in `public/js/config.js`:
- PET Contract: `0xc53abe4c593b9440407f8ac1b346f3f999e6d8ed`
- GREET Contract: `0xbc8b78f3e2348d4b5e0390fe700ce54b59931da4`
- FLIP Contract: `0xc5b2280d1e2f155f9a2be2af7e78190658874106`
- SLOTS Contract: `0xc7011f245aa51fa488783d5b0cfc6e0cba86f6cb`
- DOG Token: `0x1f6649d028c4c146c050a9b224115a01c92a02f3`

### Network Configuration
- **Chain ID**: 10143 (0x279F)
- **RPC URL**: https://testnet-rpc.monad.xyz

## 🐛 Troubleshooting

### Common Issues

1. **Wallet not connecting**
   - Ensure MetaMask is installed
   - Check if you're on Monad Testnet
   - Try refreshing the page

2. **Data not saving**
   - Check browser localStorage support
   - Clear browser cache and try again
   - Ensure JavaScript is enabled

3. **Transactions failing**
   - Check Monad Testnet connection
   - Ensure sufficient test tokens
   - Verify contract addresses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Live Demo**: https://monad-snowy.vercel.app/
- **X (Twitter)**: https://x.com/monaddogg
- **Monad**: https://monad.xyz/
- **Farcaster**: https://farcaster.xyz/ 