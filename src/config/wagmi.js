import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { genlayerStudionet } from './genlayer';

export const wagmiConfig = createConfig({
  chains: [genlayerStudionet],

  connectors: [
    injected(),
  ],

  transports: {
    [genlayerStudionet.id]: http(
      'https://studio.genlayer.com/api'
    ),
  },
});
