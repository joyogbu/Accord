import { supabase } from "../lib/supabase";

export async function getMyOrders(userId) {
    const { data:user, error:userError } = await supabase
        .from("orders")
        .select(`
            *,
            agreements (
                agreement_id,
                status,
                escrow_status,
                amount
            )
        `)

        .eq("customer_id", userId)
        .order("created_at", { ascending: false });

    if (userError) {
        throw userError;
    }

    return user;
}

export async function getOpenOrders() {
    const { data:user, error:userError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "OPEN")
        .order("created_at", { ascending: false });

    if (userError) {
        throw userError;
    }

    return user;
}

export async function getOrder(orderId) {
    const {data: order, error:orderError} = await supabase
        .from("orders")
        .select(`*, users(user_wallet)`)
        .eq("order_id", orderId)
        .single();

    if (orderError) {
        throw orderError;
    }
    return order;
}

export async function getAgreements(userId) {
    const {data: agreements, error:agreementError} = await supabase
        .from("agreements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (agreementError) {
        throw agreementError;
    }
    return agreements;
}

export async function getMyAgreement(agreementId) {
    const {data: myAgreement, error: myAgreementError} = await supabase
        .from("agreements")
        .select("*")
        .eq("agreement_id", agreementId)
        .single();

    if (myAgreementError) {
        throw myAgreementError;
    }
    return myAgreement;
}

export async function getSubmissions(userId) {
    const {data: mySubmissions, error: myError} = await supabase
        .from("submissions")
        .select(`
            evidence_id,
            created_at,
            evidence_url,
            result,
            reason,
            submission_hash,
            agreement:agreements (
                agreement_id,
                created_at,
                description,
                amount,
                currency,
                requirements
            )
    
        `)
        .eq("user_id", userId)
       // .eq("status", "EVIDENCE_SUBMITTED")
        .order("created_at", { ascending: false });

    if (myError) {
        throw myError;
    }
    return mySubmissions;
}
