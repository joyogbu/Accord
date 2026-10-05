import { useEffect, useState } from "react";
import {useNavigate} from 'react-router-dom';
import { supabase } from "../lib/supabase";
import { useWallet } from '../hooks/useWallet';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import {getMyOrders, getOpenOrders} from "../services/orders";
import {claimFunds} from "../lib/genlayer.js";
import { cancelAgreement } from "../services/functions";
import DashboardHeader from '../components/DashboardHeader.jsx';          import Footer from '../components/Footer.jsx';

function Orders() {
    const { user, setUser } = useUser();
    const {isConnected, address, disconnect, chainId, handleConnect, } = useWallet();
    console.log("order page user", user);
    const navigate = useNavigate();
    useEffect(() => {
        if (!isConnected || !address) {
            return;
        }
        initializeUser(address, setUser);
    }, [isConnected, address]);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isClaiming, setIsClaiming] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {

        if (!user?.user_id) {

            return;
        }

        async function loadOrders() {
            try {
                setLoading(true);
                //setError("");

                let data;

                if (user.role === "CUSTOMER") {
                    data = await getMyOrders(user.user_id);
                } else {
                    data = await getOpenOrders();
                }

                setOrders(data);

            } catch (err) {
                console.error("Failed to load orders:", err);
                setError("Failed to load orders.");
            } finally {
                setLoading(false);
            }
        }

        loadOrders();

    }, [user?.user_id, user?.user_role]);

    console.log("my orders", orders);

    function formatDate(date) {
        return new Date(date).toDateString();
    }                                                                         function deadlinePassed(date) {
        return new Date(date).getTime() <= Date.now();
    }

    
    const ordersWithState = orders.map((order) => ({
        ...order,
        claimed: order.agreements?.[0]?.escrow_status === "REFUNDED",

        
    }));

    console.log("order with state", ordersWithState);
    console.log("checking for claimed", ordersWithState[0]?.claimed);


    const handleClaimFunds = async(agreementId) => {
        try {
            setIsClaiming(true);
            setError("");
            setMessage("");

            const result = await claimFunds(
                address,
                agreementId,
                handleConnect
            );

            console.log("claimFunds result:", result);


            if (result?.success !== true) {
                if (result?.status === "PENDING") {
                    setError("Your claim is still being processed. Please check again shortly.");
                } else {
                    setError(result?.errorMessage || "Funds could not be claimed.");
                }
                return;
            }

            if (result?.success === true) {
                const { error } = await supabase
                    .from("agreements")
                    .update({
                        status: "EXPIRED",
                        escrow_status: "REFUNDED",
                    })
                    .eq("agreement_id", agreementId);

                if (error) {
                    console.error("Failed to update agreement:", error
                    );
                    setError("Funds were claimed, but the database update failed.");
                    return;
                }
                setMessage("Funds claimed successfully.");

                // Reload orders so the button/state changes
                //loadOrders();
            }
        } catch (error) {
            console.error("Claim funds error:", error);
            setError(
            error?.message || "Failed to claim funds."
            );
        } finally {
            setIsClaiming(false);
        }
    };


    const handleCancel = async (agreementId, orderId) => {
        try {
            setIsCancelling(true);
            setError("");
            setMessage("");

            const result = await cancelAgreement(
                address,
                agreementId,
                orderId,
                handleConnect
            );

            if (result?.success !== true) {
                if (result?.status === "PENDING") {
                    setError("Your cancellation is still being processed. Please check again shortly.");
                } else {
                    setError(result?.errorMessage || "Order could not be cancelled.");
                }
                return;
            }
            setMessage("Order cancelled successfully.");
            //loadOrders();
        } catch (error) {
            console.error("Cancel order error:", error);
            setError(error?.message || "Failed to cancel order.");
        } finally {
            setIsCancelling(false);
        }
    };
    
    if (!user) {
        return <p>Loading profile...</p>;
    }

    if (loading) {
        return <p>Loading orders...</p>;
    }



    return (
        <div>
            <DashboardHeader />
            <div className="orders">

                <h2>View Available Orders</h2>
                <span>Created orders will appear here</span><br />
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

            {orders.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <>    
                
                <div className="customer_orders">
                    {ordersWithState.map((order) => (
                        <div className="customer_order_item" key={order.order_id}>
                        {/*<div className="customer_order_detail">
                                <h3>{order?.title}</h3>
                                {order?.agreements?.[0]?.status === "REJECTED" && ( <p className="_rejected order_status">Rejected</p> )}
                                {order?.agreements?.[0]?.status === "FULFILLED" && ( <p className="_completed order_status">Completed</p> )}
                                
    {(order?.agreements?.[0]?.status === "EVIDENCE_SUBMITTED" ||
      (order?.status === "ACCEPTED" &&
       order?.agreements?.[0]?.status !== "FULFILLED" &&
       order?.agreements?.[0]?.status !== "REJECTED")) && (
        <p className="_pending order_status">In-progress</p>
    )}
                            </div>*/}
                          
                        {/*<div className="customer_order_detail">
                                <h3>{order?.title}</h3>
                                {order?.agreements?.[0]?.status === "REJECTED" ? (
                                    <p className="_rejected order_status">Rejected</p>
                                ) : order?.agreements?.[0]?.status === "FULFILLED" ? (
                                    <p className="_completed order_status">Completed</p>
                                ) : order?.status === "OPEN" ? (
        <p className="_pending order_status">Open</p>
                                ) : (
        (order?.agreements?.[0]?.status === "EVIDENCE_SUBMITTED" ||
                                order?.status === "ACCEPTED") && (
                                    <p className="_pending order_status">In-progress</p>
                                )
                                )}
                            </div>*/}

                            <div className="customer_order_detail">
                                <h3>{order?.title}</h3>
                                {order?.agreements?.[0]?.status === "REJECTED" ? (
                                    <p className="_rejected order_status">&bull; Rejected</p>
                                ) : order?.agreements?.[0]?.status === "FULFILLED" ? (
                                    <p className="completed order_status">&bull; Completed</p>
                                ) : order?.agreements?.[0]?.status === "EXPIRED" ? (
                                    <p className="_expired order_status">&bull; Expired</p>
                                ) : order?.status === "OPEN" ? (
                                    <p className="_pending order_status">&bull; Waiting for merchant</p>
                                ) : order?.agreements?.[0]?.status === "EVIDENCE_SUBMITTED" ? (
                                    <p className="_pending order_status">&bull; Verification in progress</p>
                                ) : order?.agreements?.[0]?.status === "FUNDED" ? (
                                    <p className="_pending order_status">&bull; In-progress</p>
                                ) : order?.status === "ACCEPTED" ? (
                                    <p className="_awaiting order_status">&bull; Awaiting payment</p>
                                ) : null}
                            </div>
                            <div className="customer_order_detail">
                                <small>Date Created</small>
                                <span className="order_span">{formatDate(order.created_at)}</span>
                            </div>
                            <hr />
                            <div className="customer_order_detail">
                                <small>Deadline</small>
                                <span className="order_span">{formatDate(order.deadline)}</span>
                            </div>
                          
                            <hr />
                            <div className="customer_order_detail">
                                <small>Amount</small>
                                <span className="order_span">{order.budget} GEN</span>
                            </div>
                            <hr />
                            <div className="customer_order_detail">
                                <small>Requirements</small>
                                <span className="order_span">{order.description}</span>
                            </div>
                            <hr />
                            <div className="customer_order_detail">
                                <small>Status</small>
                                <span className="order_span">{order?.status}</span>
                            </div>
                            <hr />

                            <div className="customer_order_detail">
                                <small>Contract status</small>
                                <span className="order_span">{order?.agreements?.[0]?.escrow_status}</span>
                            </div>
                            <hr />
                            <br />
             
                            {order?.status === "ACCEPTED" && order?.agreements?.[0]?.escrow_status  ==="UNFUNDED" && (
                                <div className="status_remark fund">
                                <small>Your order has been accepted. You can now fund escrow</small><br /><br /><button type="button" className="order_action_btns _fund" onClick={() => navigate(`/agreement/${order?.order_id}`)}>Fund</button> <button type="button" className="order_action_btns _cancel" onClick={() => handleCancel(order?.agreements?.[0]?.agreement_id)} >{order?.status === "CANCELLED" ? "Order Cancelled" : isCancelling ? "Canceling..." : "Cancel order"}</button></div>
                            )}
                            {order?.agreements?.[0]?.status === "FUNDED" && (   
                                <div className="status_remark no_action"><small>No action: Waiting for job to complete </small></div>
                            )}

                            {order?.agreements?.[0]?.status === "EVIDENCE_SUBMITTED" && (
                                <div className="status_remark pending"><small>Merchant has submitted proof of work. Verification in progress</small></div>
                            )}
                            {order?.agreements?.[0]?.status === "FULFILLED" && (
                                <div className="status_remark _completed"><small>Your order has been successfully completed and escrowed funds released to the merchant</small></div>
                            )}
                            {order?.agreements?.[0]?.status === "REJECTED" && order?.agreements?.[0]?.escrow_status === "REFUNDED" &&
                                    (
                                <div className="status_remark _failed"><small>Your order was not succesfully completed. Job verification at the merchant side failed. Your escrowed funds has been refunded</small></div>
                            )}
                        {/*<button type="button" className="view_btn" onClick={() => navigate(`/view-order/${order.order_id}`) }>View</button>*/}
                            
                        {/*{order?.status === "ACCEPTED" &&
                                    order?.agreements?.[0]?.escrow_status === "UNFUNDED" && ( <button type="button" className="order_action_btns _cancel" onClick={() => handleCancel(order?.agreements?.[0]?.agreement_id)} >Cancel order</button>)} */} 
                            
                            {order?.status === "OPEN" && !deadlinePassed(order?.deadline) && (
                                <>
                                {user?.role === "CUSTOMER" && (
                                    <div className="status_remark _still"><small>Order is still open and waiting for a merchant</small>
                                    </div>
                                )}

                                {user?.role === "MERCHANT" && (
                                    <div className="status_remark _still">  <button className="view_details_btn" onClick={() => navigate(`/view-order/${order.order_id}`) }>View Details</button></div>
                                )}
                                </>
                            )}



                            {order?.status === "OPEN" && deadlinePassed(order?.deadline) && (
                                <div className="status_remark to_claim"><small>Order has expired</small></div>
                            )}

                            {deadlinePassed(order?.deadline) && order?.agreements?.[0]?.escrow_status === "FUNDED" || order?.claimed && (
                                <div className="to_claim status_remark">
                                    {!order?.claimed && (<small>Your order was not successfully completed before deadline. You can claim a refund. </small>
                                    )}
                    
                                    <button type="button" className="order_action_btns _claim_fund" onClick={() => handleClaimFunds(order.agreements?.[0]?.agreement_id)} disabled={isClaiming || order?.claimed}>{order?.claimed ? "Funds Claimed" : isClaiming ? "Claiming..." : "Claim funds"}</button>

                                </div>
                            )}
                            
                        </div>
                    ))}
                </div>
                </>
            )}

        </div>
        <Footer />
        </div>
    );
}

export default Orders;
