import { supabase } from "../lib/supabase";
import {cancelOrder} from "../lib/genlayer";

export async function cancelAgreement(
    walletAddress,
    agreementId,
    orderId,
    handleConnect
) {
    const result = await cancelOrder(
        walletAddress,
        agreementId,
        handleConnect
    );

    console.log("cancelOrder result:", result);

    if (result?.success !== true) {
        return result;
    }

    // Update agreement in Supabase
    const { error: agreementError } = await supabase
        .from("agreements")
        .update({
            status: "CANCELLED",
            escrow_status: "UNFUNDED",
        })
        .eq("agreement_id", agreementId);

    if (agreementError) {
        console.error(
            "Failed to update agreement:",
            agreementError
        );

        return {
            success: false,
            status: "DB_UPDATE_FAILED",
            errorMessage:
                "Order was cancelled, but the agreement update failed.",
        };
    }

    // Update order in Supabase
    const { error: orderError } = await supabase
        .from("orders")
        .update({
            status: "CANCELLED",
        })
        .eq("order_id", orderId);

    if (orderError) {
        console.error(
            "Failed to update order:",
            orderError
        );

        return {
            success: false,
            status: "DB_UPDATE_FAILED",
            errorMessage:
                "Agreement was cancelled, but the order update failed.",
        };
    }

    return result;
}
