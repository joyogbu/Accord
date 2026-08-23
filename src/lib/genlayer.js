import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ACCORD_CONTRACT_ADDRESS } from "../config/contract";

export const genlayerReadClient = createClient({
  chain: studionet,
});

export async function agreementExists(agreementId) {
  return await genlayerReadClient.readContract({
    address: ACCORD_CONTRACT_ADDRESS,
    functionName: "agreement_exists",
    args: [agreementId],
  });
}



/*export function createGenLayerReadClient() {
    return createClient({
        chain: studionet,
    });
}

export function createGenLayerWriteClient(address) {
    return createClient({
        chain: studionet,
        account: address,
        provider: window.ethereum,
    });
}*/
