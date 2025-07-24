import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

// Monad network configuration
const monadNetwork = {
  id: 1337,
  name: 'Monad',
  network: 'monad',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MONAD',
  },
  rpcUrls: {
    public: { http: ['https://rpc.monad.xyz'] },
    default: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    etherscan: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
}

export const config = createConfig({
  chains: [monadNetwork, base],
  transports: {
    [monadNetwork.id]: http(),
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector()
  ]
})

// Export for use in other files
window.wagmiConfig = config 