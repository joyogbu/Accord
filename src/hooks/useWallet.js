import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';

import { injected } from 'wagmi/connectors';
import { genlayerStudionet } from '../config/genlayer';

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();

  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  async function handleConnect() {
    try {
      if (!isConnected) {
        await connectAsync({
          connector: injected({
            target: 'metaMask',
          }),
        });
      }

      if (chainId !== genlayerStudionet.id) {
        await switchChainAsync({
          chainId: genlayerStudionet.id,
        });
      }
    } catch (error) {
        console.error('Wallet connection failed:', error);
        throw error;
    }
  }

  return {
    handleConnect,
    address,
    isConnected,
    disconnect,
    chainId,
  };
}
