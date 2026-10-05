import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import { supabase } from "../lib/supabase";
import {getOrder} from "../services/orders";

import { useWallet } from '../hooks/useWallet';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import DashboardHeader from '../components/DashboardHeader.jsx';
import Footer from '../components/Footer';
import {createAgreement} from '../lib/genlayer';

function OrderDetails() {
    const {orderId} = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const {handleConnect, isConnected, address, disconnect, chainId, } = useWallet();
    const { user, setUser } = useUser();
   // console.log("my user before", user);
    //console.log("my order", orderId);
    useEffect(() => {
        initializeUser(address, setUser);
        if(!user){
            return;
        }
        //console.log("user after", user);
        async function loadOrder() {
            try {
                const data = await getOrder(orderId);
                
                //console.log("my data", data);
                setOrder(data);
               
            } catch(error) {
                console.error("failed to load order", error);
            } finally {
                setLoading(false);
            }
        }
        if (orderId) {
            loadOrder();
        }
    }, [orderId]);

    //console.log("chain ID", chainId);
    
    function formatDate(date) {
        return new Date(date).toLocaleString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    function generateAgreementId() {
        const randomPart = Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();

        return `AGR-${randomPart}`;
    }

    async function handleForm(e) {
        e.preventDefault();
        setError("");

        if (!order || !user) {
            return;
        }

        const customerWallet = order.users?.user_wallet;
        const merchantWallet = user.user_wallet;
        const deadlineTimestamp = Math.floor(new Date(order.deadline).getTime() / 1000);


        if (!customerWallet) {
            console.error("Customer wallet not found");
            return;
        }

        if (!merchantWallet) {
            console.error("Merchant wallet not found");
            return;
        }

        try {
            setAccepting(true);
            
            setError("");


            // Generate the ID that will identify this agreement in both Supabase and the GenLayer contract.
            const agreementId = generateAgreementId();


            const agreementData = {
                agreement_id:agreementId,
                order_id: order.order_id,
                user_id: user.user_id,
                payer: customerWallet,
                merchant: merchantWallet,
                description: order.title,
                requirements: order.description,
                amount: String(order.budget),
                currency: order.currency,
                payment_reference: order.order_id,
                deadline: new Date(order.deadline).toISOString(),
                status: "CREATED",
                escrow_status: "UNFUNDED"
            };

            console.log("Agreement:", agreementData)
        
            // Create agreement here...
            
            const result = await createAgreement(
                merchantWallet,
                agreementData.agreement_id,
                agreementData.payer,
                agreementData.merchant,
                agreementData.description,
                agreementData.requirements,
                agreementData.amount,
                agreementData.currency,
                agreementData.payment_reference,
                deadlineTimestamp,
                handleConnect
            );

            console.log("Agreement successfully created on GenLayer:", result);

            //if (result.pending) {
                //throw new Error("Agreement was not created on GenLayer.");
                //console.log("Transaction is still pending");
                //setError("Transaction pending");
                //return;
            //}   

            // Only gets here if GenLayer succeeded
            if (result.success || result.exists) {
                setSuccess("Agreement created successfully");
                const { data, error } = await supabase
                    .from("agreements")
                    .insert(agreementData)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                console.log("Agreement saved to Supabase:", data);

                // Update order status
                const { error: orderError } = await supabase
                    .from("orders")
                    .update({
                        status: "ACCEPTED",
                     })
                     .eq("order_id", order.order_id);

                if (orderError) {
                    throw orderError;
                }

                console.log("Order status updated");
            } else {
                setError(result?.errorMessage || "Failed to create Agreement..");
            }
            

            //setSuccess("Agreement created successfully");
            

        } catch (error) {
            console.error("Failed to create agreement:", error);

            setError(error?.message || "Failed to create agreement.");

        } finally {
            setLoading(false);
            setAccepting(false);
        }
    }

    if (loading) {
        return <div>Loading order...</div>;
    }

    if (!order) {
        return <div>Order not found.</div>;
    }

    return (
        <>
        <DashboardHeader />
        <div className="order_details">
            
            <h2>View Order</h2>
            {error && (
                    <div className="toast toast-error">
                        <span className="form_error">error: {error}</span>
                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {success && (
                    <div className="toast toast-success">
                        <span>{success}</span>
                        <button onClick={() => setSuccess("")}>×</button>
                    </div>
                )}
            {/*{error && <p className="form_error">{error}</p>}
            {success && <p className="form_success">{success}</p>}*/}
            <form onSubmit={handleForm}>
                <input placeholder={order?.title} name="order_title" value={order?.title} readOnly /><br /><br />
                <textarea  placeholder={order?.description} value={order?.description} name="order_desc" readOnly /><br /><br />
                <input type="text" placeholder={order?.budget} value={order?.budget} name="order_budget" readOnly /><br /><br />
                <input type="text" placeholder={order?.currency} value={order?.currency} name="order_curr" readOnly /><br /><br />
                <input type="text" placeholder={formatDate(order?.created_at)} value={formatDate(order?.created_at)} name="order_date" readOnly /><br /><br />
                <input type="text" placeholder={order?.users?.user_wallet} value={order?.users?.user_wallet} name="customer_wallet" readOnly /><br /><br />
                <input type="text" placeholder={formatDate(order?.deadline)} value={formatDate(order?.deadline)} name="deadline" readOnly /><br /><br />
                <button type="submit" className="accept_btn" disabled={success || accepting}> {accepting ? "Processing..." : success ? "Agreement Created" :"Accept Order"} </button><br />
            </form>
        </div>
        <Footer />
        </>
    );
}
export default OrderDetails;
