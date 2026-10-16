import { createConfig, http } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { genlayerStudionet } from './genlayer';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
    chains: [genlayerStudionet],

    connectors: [
        // MetaMask, Rabby, and other compatible injected wallets

        injected(),

        // WalletConnect-compatible mobile and desktop wallets
        walletConnect({
            projectId,
            metadata: {
                name: 'Accord',
                description: 'Warranty protection for agent-to-agent commerce',
                url: 'https://accordpilot.vercel.app',
                icons: [],
            },
        }),

        // Coinbase Wallet
        coinbaseWallet({
            appName: 'Accord',
        }),
    ],

  transports: {
    [genlayerStudionet.id]: http(
      'https://studio.genlayer.com/api'
    ),
  },
});
