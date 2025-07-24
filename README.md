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

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Monad Testnet wallet

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ereyli/monad-dog.git
cd monad-dog
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.template .env
```

Edit `.env` file with your actual values:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
NODE_ENV=development
PORT=3000
```

⚠️ **IMPORTANT**: Never commit `.env` files to version control!

4. **Start the development server**
```bash
npm start
```

5. **Open your browser**
```
http://localhost:3000
```

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
│       ├── api.js          # API service
│       ├── config.js       # Configuration
│       └── ui.js           # UI utilities
├── server.js               # Express backend server
├── package.json            # Dependencies
├── vercel.json            # Vercel deployment config
└── README.md              # This file
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

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

3. **Set Environment Variables in Vercel Dashboard**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
NODE_ENV=production
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Manual Deployment

1. **Build the project**
```bash
npm run build
```

2. **Deploy to your preferred platform**

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_SERVICE_KEY` | Supabase service key | Required |
| `NODE_ENV` | Environment mode | `development` |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms) | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### Smart Contracts

The app uses the following Monad Testnet contracts:

- **Pet Contract**: `0x...`
- **Greet Contract**: `0x...`
- **Flip Contract**: `0x...`
- **Slots Contract**: `0x...`
- **DOG Token**: `0x...`

## 🛡️ Security

### Security Features

- ✅ **Helmet.js** - Content Security Policy
- ✅ **Rate Limiting** - API abuse protection
- ✅ **CORS Protection** - Cross-origin security
- ✅ **Input Validation** - Wallet address validation
- ✅ **Environment Variables** - Secure API key storage

### Security Checklist

- [ ] Set up Supabase Row Level Security (RLS)
- [ ] Configure CORS origins for production
- [ ] Enable rate limiting in production
- [ ] Use service key instead of anon key
- [ ] Set up proper environment variables

## 🎮 Game Mechanics

### XP System

- **Pet Dog**: +10 XP
- **Say GM**: +15 XP
- **Say GN**: +15 XP
- **Flip Coin**: +20 XP
- **Slots**: +50-500 XP (based on winnings)
- **X Follow Task**: +1000 XP (daily)

### Level System

- **Level 1**: 0-999 XP
- **Level 2**: 1000-1999 XP
- **Level 3**: 2000-2999 XP
- And so on...

### Combo System

- Actions within 5 seconds get bonus XP
- Each combo increases multiplier by 10%
- Maximum combo multiplier: 200%

### Dog Collection

- Unlock dogs by completing actions
- Each dog provides 5% XP bonus
- 15 different dog breeds available

## 🔗 Links

- **Live Demo**: [monad-dog.vercel.app](https://monad-dog.vercel.app)
- **Farcaster**: [@monaddogg](https://x.com/monaddogg)
- **Monad**: [monad.xyz](https://monad.xyz)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monad](https://monad.xyz) for the blockchain infrastructure
- [Farcaster](https://farcaster.xyz) for the social protocol
- [Supabase](https://supabase.com) for the backend services
- [Vercel](https://vercel.com) for the hosting platform

---

**Made with ❤️ for the Monad community** 