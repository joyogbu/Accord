import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import { supabase } from "../lib/supabase";
import {getOrder} from "../services/orders";
import { useWallet } from '../hooks/useWallet';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import DashboardHeader from '../components/DashboardHeader.jsx';
import Footer from '../components/Footer.jsx';
import {fundAgreement} from '../lib/genlayer';
function Agreement() {
    const [myAgreement, setMyAgreement]= useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [funding, setFunding] = useState(false);

    const navigate = useNavigate();
    
    const {handleConnect, isConnected, address, disconnect, chainId, } = useWallet();
    const { setUser } = useUser();

    const {orderId} = useParams();

   
    useEffect(() => {
     
        if (!isConnected || !address) {
            return;                            }
        initializeUser(address, setUser);
        //console.log("user after", user);
        async function loadAgreement() {
            try {
                const {data: agreement, error:agreementError} = await supabase
                    .from("agreements")
                    .select("*")
                    .eq("order_id", orderId)
                    .single();

                if(agreementError) {
                    throw agreementError;
                }

                console.log("my agreement", agreement);
                setMyAgreement(agreement);

            } catch(error) {
                console.error("failed to load agreement", error);
                setError("Failed to load agreement");
            }
        }
        loadAgreement();
    }, [orderId, address, setUser]);

    async function fundEscrow() {
        let result;
        try {
            setMessage("");
            setFunding(true);

            result = await fundAgreement(
                address,
                myAgreement.agreement_id,
                myAgreement.amount,
                handleConnect
            );

            if (result.success) {
                setMessage("Escrow funded successfully.");

                const { error } = await supabase
                    .from("agreements")
                    .update({
                        status: "FUNDED",
                        escrow_status: "FUNDED",
                    })
                    .eq("agreement_id", myAgreement.agreement_id);

                if (error) {
                    console.error("Failed to update agreement:", error);
                    throw error;
                }
            } else {
                setError(result?.errorMessage || "Failed to fund escrow.");
            }
        } catch (error) {
            console.log("fund escrow error", result.leaderReceipt);
            console.error(error);
            setError(error.message || "Failed to fund escrow.");
        } finally {
            setFunding(false);
        }
    }

    function formatDate(date) {
        return new Date(date).toDateString();
    }

    return (
        <div className="page_wrapper">
            <DashboardHeader />

            <div className="fund_agreement">
                <h1>Fund your Order</h1>
                {error && (
                    <div className="toast toast-error">
                        <span className="form_error">error: {error}</span>
                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {message && (
                    <div className="toast toast-success">
                        <span>{message}</span>
                        <button onClick={() => setMessage("")}>×</button>
                    </div>
                )}

                {myAgreement ? (
                    <div className="fund_details">
                        {/*{error && <p className="form_error">{error}</p>}
                        {message && <p className="form_success">{message}</p>}*/}

                        <h3>{myAgreement?.agreement_id}</h3>

                        {/*<div className="customer_order_detail">
                            <small>Date Created</small>
                        <p>
                            Amount: {myAgreement.amount}{" "}
                            {myAgreement.currency}
                        </p>

                        <p>
                            Status: {myAgreement.status}
                        </p>*/}



                        <div className="customer_order_detail">
                                <small>Date Created</small>
                                <span className="order_span">{formatDate(myAgreement?.created_at)}</span>
                            </div>
                            <hr />
                            <div className="customer_order_detail">
                                <small>Deadline</small>
                                <span className="order_span">{formatDate(myAgreement?.deadline)}</span>
                            </div>

                            <hr />
                            <div className="customer_order_detail">
                                <small>Amount</small>
                                <span className="order_span">{myAgreement?.budget} GEN</span>
                            </div>
                            <hr />
                            <div className="customer_order_detail">
                                <small>Requirements</small>
                                <span className="order_span">{myAgreement?.description}</span>
                            </div>
                            <hr />
                            <div className="customer_order_detail">
                                <small>Status</small>
                                <span className="order_span">{myAgreement?.status}</span>
                            </div>
                            <hr />

                            <div className="customer_order_detail">
                                <small>Contract status</small>
                                <span className="order_span">{myAgreement?.escrow_status}</span>
                            </div>
                        <br />
                        <hr />

                        <button type="button" className="fund_btn" onClick={fundEscrow} disabled={ funding || myAgreement?.status !== "CREATED" }>{funding 
                                ? "Processing..."
                                : "Fund Escrow"}
                        </button>
                    </div>
                ) : (
                    <p>Loading agreement...</p>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default Agreement;



