import { defineChain } from 'viem';

export const genlayerStudionet = defineChain({
  id: 61999,
  name: 'GenLayer Studionet',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://studio.genlayer.com/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'GenLayer Studio Explorer',
      url: 'https://explorer-studio.genlayer.com',
    },
  },
});
