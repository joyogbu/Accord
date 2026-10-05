import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus, ExecutionResult } from "genlayer-js/types";
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

export async function getAgreement(agreementId) {
    return await genlayerReadClient.readContract({
      address: ACCORD_CONTRACT_ADDRESS,
      functionName: "get_agreement",
      args: [agreementId],
    });
}

export async function createAgreement(
    walletAddress,
    agreementId,
    payer,
    merchant,
    description,
    requirements,
    amount,
    currency,
    paymentReference,
    deadline,
    handleConnect
) {

    if (!window.ethereum) {
        throw new Error("Wallet provider not found.");
    }

    // Get the chain MetaMask is currently connected to
    //const currentChainId = await window.ethereum.request({
        //method: "eth_chainId",
   // });

    //console.log("current chain", currentChainId);

    const writeClient = createClient({
        chain: studionet,
        account: walletAddress,
        provider: window.ethereum,
    });

    // Make sure MetaMask is on GenLayer Studionet
    //await writeClient.connect("studionet");

    await handleConnect();

    let txHash;

    try {
        txHash = await writeClient.writeContract({
            address: ACCORD_CONTRACT_ADDRESS,
            functionName: "create_agreement",
            args: [
                agreementId,
                payer,
                merchant,
                description,
                requirements,
                amount,
                currency,
                paymentReference,
                BigInt(deadline),
            ],
            value: BigInt(0),
        });

        console.log("create_agreement transaction:", txHash);


    } catch (error) {
        console.error("Transaction submission failed:", error);

        throw new Error(
            error?.shortMessage ||
            error?.message ||
            "Failed to submit agreement transaction."
        );
    }

    // Wait for receipt
    let receipt;
    let errorMessage;
    try {
        receipt = await writeClient.waitForTransactionReceipt({
            hash: txHash,
            status: TransactionStatus.FINALIZED,
        });

        console.log("create_agreement receipt:", receipt);
        console.log("Execution receipt", receipt?.txExecutionResultName);
        console.log("Receipt keys:", Object.keys(receipt || {}));
        console.log("Receipt status:", receipt.status_name);
        console.log("Receipt result:", receipt.result);
        console.log("Receipt result_name:", receipt.result_name);

        errorMessage = receipt.consensus_data?.leader_receipt?.[0]
            ?.result?.payload ||
            "Agreement creation failed.";
    } catch (error) {
        // The transaction was submitted, but we did not receive the finalized receipt within the timeout.
        console.warn("Timed out waiting for transaction receipt:", error);

        // DO NOT submit create_agreement again.
        // The transaction may still be processing.

        try {
            const exists = await agreementExists(agreementId);

            console.log("Agreement exists after timeout:", exists);

            if (exists === true) {
                return {
                    success: true,
                    pending: false,
                    txHash,
                    receipt: null,
                    exists:true,
                    agreementId,
                };
            }else {
                return {
                    success:false,
                    pending:true,
                    exists:false,
                    txHash,
                    receipt,
                    agreementId,
                    errorMessage:errorMessage,
                };
            }


        } catch (checkError) {
            console.error("Agreement existence check failed:", checkError);
        }    
        
        return {
            success: false,
            pending: true,
            txHash,
            receipt: null,
            agreementId,
            errorMessage:errorMessage,
        };
    }

    // A transaction can be finalized by consensus but still have failed contract execution.
    
    const executionResult = receipt.consensus_data?.leader_receipt?.[0]?.execution_result;

    if (receipt.status_name === "FINALIZED" && executionResult === "SUCCESS") {
        // Execution succeeded.
        // Safe to persist the agreement to Supabase.


        console.log("genlayer Agreement created successfully:", agreementId);
        return {
            txHash,
            receipt,
            agreementId,
            success: true,
            pending: false,
        };
    } 

    else if (receipt.status_name === "FINALIZED" && receipt.consensus_data?.leader_receipt?.[0]?.execution_result !== "SUCCESS"
) {
    // Contract execution failed
    //else if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR
// {
        // Contract execution failed.
        // State was not modified.
     

        //const errorMessage = receipt.consensus_data?.leader_receipt?.[0]
            //?.result?.payload ||
            //"Agreement creation failed.";

        console.error(
            "Contract execution failed"
        );

        return {
            success:false,
            errorMessage:errorMessage,
            receipt,
            txHash,
            agreementId,
        };

        // Fetch the execution trace
        const txTrace = await writeClient.getTransactionTrace({hash: txHash,});
        console.log("create_agreement transaction trace:", txTrace);

        // GenLayer UserError
        //if (txTrace.status?.code === 1) {
            //throw new Error(txTrace.status.message || "Contract execution failed.");
        //}

        // Other contract/VM execution error
        //throw new Error(txTrace.status?.message || "Agreement creation failed.");        
        //throw new Error(errorMessage);
    }

    console.warn("Agreement execution result is not yet available.");

    return {
        success: false,
        pending: true,
        txHash,
        receipt: null,
        agreementId,
    };
}

export async function fundAgreement(
    walletAddress,
    agreementId,
    amount,
    handleConnect
) {
    if (!window.ethereum) {
        throw new Error("Wallet provider not found.");
    }

    // Make sure wallet is connected to GenLayer
    await handleConnect();

    const writeClient = createClient({
        chain: studionet,
        account: walletAddress,
        provider: window.ethereum,
    });
    
    console.log("Amount:", amount);

    // Convert agreement amount to wei.
    // Accord stores amount as GEN with 18 decimals.
    const amountWei = BigInt(
        Math.round(Number(amount) * 1e18)
    );

    let txHash;

    try {
        txHash = await writeClient.writeContract({
            address: ACCORD_CONTRACT_ADDRESS,
            functionName: "fund_escrow",
            args: [agreementId],
            value: amountWei,
        });

        console.log("fund_escrow transaction:", txHash);
    } catch (error) {
        console.error("Funding transaction failed:", error);

        throw new Error(
            error?.shortMessage ||
            error?.message ||
            "Failed to submit funding transaction."
        );
    }

    let receipt;

    try {
        receipt = await genlayerReadClient.waitForTransactionReceipt({
            hash: txHash,
        });

        console.log("fund_escrow receipt:", receipt);

        //if (receipt.txExecutionResultName == ExecutionResult.FINISHED_WITH_RETURN) {
        const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0]?.result?.payload;

        console.log("leader receiot", leaderReceipt);
        const executionResult = receipt.consensus_data?.leader_receipt?.[0]?.execution_result;
        const errorPayload = leaderReceipt;

        if (executionResult === "SUCCESS") {
            return {
                success: true,
                txHash,
                receipt,
                leaderReceipt,
                agreementId,
            };
        } else {
            return {
                success:false,
                txHash,
                leaderReceipt,
                receipt,
                agreementId,
                errorMessage: errorPayload || "Transaction execution failed.",
            }
        }
    } catch (error) {
        console.warn("Timed out waiting for funding receipt:", error);
        const transaction = await genlayerReadClient.getTransaction({
            hash: txHash,
        });

        console.log("Transaction:", transaction);

        const agreement = await getAgreement(agreementId);
        console.log("get agreement", agreement);
        if (agreement.status === 'FUNDED') {
            return {
                success: true,
                txHash,
                receipt:null,
                leaderReceipt,
                agreementId,
            };
        }
        return {
            success:false,
            
            txHash,
            receipt:null,
            agreementId,
            leaderReceipt,
        };
    }
}

export async function submitEvidence(
    walletAddress,
    agreementId,
    evidenceUrl,
    handleConnect
) {
    if (!window.ethereum) {
        throw new Error("Wallet provider not found.");
    }

    if (!evidenceUrl.trim()) {
        throw new Error("Evidence URL is required.");
    }

    if (
        !evidenceUrl.startsWith("http://") &&
        !evidenceUrl.startsWith("https://")
    ) {
        throw new Error("Evidence URL must start with http:// or https://");
    }

    await handleConnect();

    const writeClient = createClient({
        chain: studionet,
        account: walletAddress,
        provider: window.ethereum,
    });

    let txHash;

    try {
        txHash = await writeClient.writeContract({
            address: ACCORD_CONTRACT_ADDRESS,
            functionName: "submit_evidence",
            args: [agreementId, evidenceUrl],
        });

        console.log("Evidence transaction:", txHash);
    } catch (error) {
        throw new Error(
            error?.shortMessage ||
            error?.message ||
            "Failed to submit evidence."
        );
    }

    try {
        const receipt =
            await genlayerReadClient.waitForTransactionReceipt({
                hash: txHash,
            });

        console.log("Evidence receipt:", receipt);

        const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];

        const executionResult = leaderReceipt?.execution_result;

        const errorPayload = leaderReceipt?.result?.payload;

        if (executionResult === "SUCCESS") {
            const agreement = await getAgreement(agreementId);

            if (agreement.status === "EVIDENCE_SUBMITTED") {
                return {
                    success: true,
                    txHash,
                    receipt,
                    leaderReceipt,
                    agreementId,
                    status: "EVIDENCE_SUBMITTED",
                };
            }

            return {
                success: false,
                txHash,
                receipt,
                leaderReceipt,
                agreementId,
                status: agreement.status,
            };
        }

        return {
            success: false,
            txHash,
            receipt,
            leaderReceipt,
            agreementId,
            status: "ERROR",
            errorMessage: errorPayload || "Transaction execution failed.",
        };

    } catch (error) {
        console.warn(
            "Timed out waiting for evidence receipt:",
            error
        );

        // Do NOT submit the transaction again.
        // The original transaction may still be processing.

        try {
            const transaction =
                await genlayerReadClient.getTransaction({
                    hash: txHash,
                });

            console.log(
                "Evidence transaction after timeout:",
                transaction
            );
        } catch (transactionError) {
            console.warn(
                "Could not retrieve evidence transaction:",
                transactionError
            );
        }

        // Check the actual agreement state.
        const agreement = await getAgreement(agreementId);

        if (agreement.status === "EVIDENCE_SUBMITTED") {
            return {
                success: true,
                txHash,
                receipt: null,
                agreementId,
                status: "EVIDENCE_SUBMITTED",
            };
        }

        return {
            success: false,
            txHash,
            receipt: null,
            agreementId,
            status: "PENDING",
        };
    }
}


export async function verifyAgreement(
    walletAddress,
    agreementId,
    handleConnect
) {
    if (!window.ethereum) {
        throw new Error("Wallet provider not found.");
    }

    await handleConnect();

    const writeClient = createClient({
        chain: studionet,
        account: walletAddress,
        provider: window.ethereum,
    });

    let txHash;

    // 1. Submit verification transaction
    try {
        txHash = await writeClient.writeContract({
            address: ACCORD_CONTRACT_ADDRESS,
            functionName: "verify_agreement",
            args: [agreementId],
            value: 0n,
        });

        console.log("Verification transaction:", txHash);

    } catch (error) {
        throw new Error(
            error?.shortMessage ||
            error?.message ||
            "Failed to start agreement verification."
        );
    }

    // 2. Wait for GenLayer finalization
    try {
        const receipt =
            await genlayerReadClient.waitForTransactionReceipt({
                hash: txHash,
            });

        console.log("Verification receipt:", receipt);

        const leaderReceipt =
            receipt.consensus_data?.leader_receipt?.[0];

        const executionResult =
            leaderReceipt?.execution_result;

        // Exact UserError / execution error message
        const errorPayload =
            leaderReceipt?.result?.payload;

        // 3. GenLayer execution failed
        if (executionResult === "ERROR") {
            return {
                success: false,
                txHash,
                receipt,
                leaderReceipt,
                agreementId,
                status: "ERROR",
                errorMessage:
                    errorPayload ||
                    "Agreement verification failed to execute.",
            };
        }

        // 4. Transaction finalized successfully
        if (executionResult === "SUCCESS") {
            // Read the agreement from the contract after verification
            const agreement = await getAgreement(agreementId);

            console.log("Agreement after verification:", agreement);

            return {
                success: true,
                txHash,
                receipt,
                leaderReceipt,
                agreementId,
                status: agreement.status,
                verificationResult:
                    agreement.verification_result,
                verificationReason:
                    agreement.verification_reason,
            };
        }

        // 5. Not finalized yet
        /*return {
            success: false,
            txHash,
            receipt,
            leaderReceipt,
            agreementId,
            status: "PENDING",
        };*/

    } catch (error) {
        console.warn(
            "Timed out waiting for verification receipt:",
            error
        );

        // Do NOT submit verification again.
        /*try {
            const transaction =
                await genlayerReadClient.getTransaction({
                    hash: txHash,
                });

            console.log(
                "Verification transaction after timeout:",
                transaction
            );
        } catch (transactionError) {
            console.warn(
                "Could not retrieve verification transaction:",
                transactionError
            );
        }*/

        // The original transaction may still be processing.
        // Check the agreement state before deciding what to return.
        try {
            const agreement = await getAgreement(agreementId);

            console.log("verification result", agreement.verification_result);
            if (
                agreement.verification_result === "FULFILLED" ||
                agreement.verification_result === "REJECTED" ||
                agreement.verification_result === "RETRY"
            ) {
                return {
                    success: true,
                    txHash,
                    receipt: null,
                    agreementId,
                    status: agreement.status,
                    verificationResult:
                    agreement.verification_result,
                    verificationReason:
                    agreement.verification_reason,
                };
            }
            return {
                success:false,
                txHash,
                receipt:null,
                agreementId,
                status:agreement.status,
                status: "PENDING",
                verificationResult: agreement.verification_result,
                verificationReason: agreement.verification_reason,
            }

        } catch (agreementError) {
            console.warn(
                "Could not check agreement after timeout:",
                agreementError
            );
        }

        return {
            success: false,
            txHash,
            receipt: null,
            agreementId,
            status: "PENDING",
       };
    }
}



export async function claimFunds(
    walletAddress,
    agreementId,
    handleConnect
) {
    if (!window.ethereum) {
        throw new Error("Wallet provider not found.");
    }

    await handleConnect();

    const writeClient = createClient({
        chain: studionet,
        account: walletAddress,
        provider: window.ethereum,
    });

    let txHash;

    // 1. Submit refund transaction
    try {
        txHash = await writeClient.writeContract({
            address: ACCORD_CONTRACT_ADDRESS,
            functionName: "refund_after_deadline",
            args: [agreementId],
            value: 0n,
        });
    } catch (error) {
        throw new Error(
            error?.shortMessage ||
            error?.message ||
            "Failed to claim funds."
        );
    }

    // 2. Wait for finalization
    try {
        const receipt =
            await genlayerReadClient.waitForTransactionReceipt({
                hash: txHash,
            });

        const leaderReceipt =
            receipt.consensus_data?.leader_receipt?.[0];

        const executionResult =
            leaderReceipt?.execution_result;

        const errorPayload =
            leaderReceipt?.result?.payload;

        if (executionResult === "ERROR") {
            return {
                success: false,
                txHash,
                receipt,
                status: "ERROR",
                errorMessage:
                    errorPayload ||
                    "Claim funds transaction failed.",
            };
        }

        if (executionResult === "SUCCESS") {
            return {
                success: true,
                txHash,
                receipt,
                agreementId,
                status: "EXPIRED",
                escrowStatus: "REFUNDED",
            };
        }
    } catch (error) {
        console.warn(
            "Timed out waiting for claim transaction:",
            error
        );

        // The transaction may have succeeded even though
        // receipt retrieval failed.
        try {
            const agreement = await getAgreement(agreementId);

            if (
                agreement.status === "EXPIRED" &&
                agreement.escrow_status === "REFUNDED"
            ) {
                return {
                    success: true,
                    txHash,
                    receipt: null,
                    agreementId,
                    status: agreement.status,
                    escrowStatus: agreement.escrow_status,
                };
            }
        } catch (agreementError) {
            console.warn(
                "Could not check agreement after claim error:",
                agreementError
            );
        }

        return {
            success: false,
            txHash,
            receipt: null,
            agreementId,
            status: "PENDING",
        };
    }
}

export async function cancelOrder(
    walletAddress,
    agreementId,
    handleConnect
) {
    if (!window.ethereum) {
        throw new Error("Wallet provider not found.");
    }

    await handleConnect();

    const writeClient = createClient({
        chain: studionet,
        account: walletAddress,
        provider: window.ethereum,
    });

    let txHash;

    // 1. Submit cancellation transaction
    try {
        txHash = await writeClient.writeContract({
            address: ACCORD_CONTRACT_ADDRESS,
            functionName: "cancel_by_payer",
            args: [agreementId],
            value: 0n,
        });
    } catch (error) {
        throw new Error(
            error?.shortMessage ||
            error?.message ||
            "Failed to cancel order."
        );
    }

    // 2. Wait for finalization
    try {
        const receipt =
            await genlayerReadClient.waitForTransactionReceipt({
                hash: txHash,
            });

        const leaderReceipt =
            receipt.consensus_data?.leader_receipt?.[0];

        const executionResult =
            leaderReceipt?.execution_result;

        const errorPayload =
            leaderReceipt?.result?.payload;

        if (executionResult === "ERROR") {
            return {
                success: false,
                txHash,
                status: "FAILED",
                errorMessage:
                    errorPayload ||
                    "Order cancellation failed.",
            };
        }

        if (executionResult === "SUCCESS") {
            return {
                success: true,
                txHash,
                status: "CANCELLED",
                agreementId,
            };
        }

    } catch (error) {
        console.warn(
            "Timed out waiting for cancellation transaction:",
            error
        );

        return {
            success: false,
            txHash,
            status: "PENDING",
            agreementId,
        };
    }
}
