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

  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

    async function handleConnect(connector) {
        try {

            let activeChainId = chainId;

            if (!isConnected) {
                if (!connector) {
                    throw new Error('No wallet connector available.');
                }
                /*await connectAsync({
                connector: injected({
                    target: 'metaMask',
                }),
                });*/

                const connection = await connectAsync({ connector });
                activeChainId = connection.chainId;

                //const connector = connectors[0];
              

                //await connectAsync({ connector });
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
    connectors,
    address,
    isConnected,
    disconnect,
    chainId,
  };
}
