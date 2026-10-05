import { useEffect, useState, useMemo } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaCog, FaExchangeAlt, FaArrowRight, FaRegClone, FaDollarSign, FaFileInvoiceDollar, FaSignOutAlt, FaUser, FaBell, FaWallet, FaCoins, FaCheckCircle, FaClock, FaHistory, FaPaperPlane } from 'react-icons/fa';

import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import {getMyOrders} from '../services/orders';
import CreateOrder from '../components/CreateOrder.jsx';
import { cancelAgreement } from "../services/functions";
import Orders from "../components/GetOrders";
import {claimFunds} from "../lib/genlayer.js";
import jopay from '../images/jopay.jpg';

function DashboardBody() {

    const [isOrder, setIsOrder] = useState(false);
    const [orders, setOrders] = useState([]);
    const [isClaiming, setIsClaiming] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const { user, setUser } = useUser();

    const {isConnected, address, disconnect, chainId, handleConnect, } = useWallet();
    console.log("dashboard user", user);
    useEffect(() => {

        if (!isConnected || !address) {
            return;
        }

        initializeUser(address, setUser);

        if(!user) {
            navigate("/");
        }
        if(user?.role !== "CUSTOMER") {
            navigate("/");
        }
    
        async function loadOrders() {
            try {
                const data = await getMyOrders(user?.user_id);

                //console.log("my data", data);
                if(data) {
                    setOrders(data);
                    console.log("agreements and orders data", data);
                }

            } catch(error) {
                console.error("failed to load orders", error);
            }
        }
        loadOrders();

    }, [isConnected, address, user]);

    const stats = useMemo(() => {
        const totalOrders = orders.length;
        const totalSettled = orders.filter(
            (order) => order.agreements?.[0]?.status === "FULFILLED").length;
        const totalPending = orders.filter(
            (order) =>
            ["FUNDED", "EVIDENCE_SUBMITTED", "DISPUTED"].includes(
                order.agreements?.[0]?.status
            )
        ).length;
        return {
            totalOrders,
            totalSettled,
            totalPending
        };
    }, [orders]);


    const ordersWithState = orders.map((order) => ({
        ...order,
        claimed: order.agreements?.[0]?.escrow_status === "REFUNDED",

    }));

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
                    setError(result?.errorMessage || "Order could not be cancelled.");}
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


    function openOrder() {
        setIsOrder(true);
    }

    function closeOrder() {
        setIsOrder(false);
    }

    function formatDate(date) {
        return new Date(date).toDateString();
    }

    function deadlinePassed(date) {
        return new Date(date).getTime() <= Date.now();
    }

    return (
        <div className="my_dashboard_2">
            <div className="intro_section">
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
                <p>Welcome {user?.user_name}</p>
                <h2>My Customer Dashboard</h2>
                <small>Manage agreements, escrow and consensus-based resolutions</small>

                <div className="intro_2">
                    <button type="button" className="create_order" onClick={() => navigate("/create-order")}>Create Order</button>
                    {/*{isOrder && <CreateOrder closeOrder={closeOrder} /> }*/}
                </div>
                <br />
                <div className="order_summary">
                    <h4 className="order_heading">My Activity</h4>
                    <div className="order_stats">
                        <div className="_stat">
                            <div className="order_img total_created"><FaFileInvoiceDollar /></div>

                            <p className="_text">Total created</p>
                            <p className="_number">{stats.totalOrders}</p>
                        </div>
                        <div className="_stat">
                            <div className="order_img total_settled"><FaDollarSign /></div>

                            <p className="text">Total settled</p>
                            <p className="number">{stats.totalSettled}</p>
                        </div>

                        <div className="_stat">
                            <div className="order_img total_pending"><FaClock /></div>

                            <p className="text">Pending Orders</p>
                            <p className="number">{stats.totalPending}</p>
                        </div>
                    </div>
                </div>
                <br />
                <div className="order_history">
                    <h4>My Orders</h4>
                    <div className="order_img"><FaExchangeAlt /></div>
                    <br />
                    {orders.length === 0 ? (
                        <div className="order_item">
                            <p><b>No orders created yet.</b></p>
                            <span>Your created orders will show up here</span>
                            <button type="button" className="create_order" onClick={openOrder} >Make your first order</button>
                        </div>
                    ) : (
                        ordersWithState.map(order => (

                            <div className="order_item" key={order.order_id}>
                                

                                <div className="customer_order_">
                                <h3>{order?.title}</h3>
                                {order?.agreements?.[0]?.status === "CANCELLED" ? (
                                    <p className="_cancel;led order_status">&bull; Cancelled</p>
                                ) : order?.agreements?.[0]?.status === "REJECTED" ? (
                                    <p className="_rejected order_status">&bull; Rejected</p>
                                ) : order?.agreements?.[0]?.status === "FULFILLED" ? (
                                    <p className="completed order_status">&bull; Completed</p>
                                ) : order?.agreements?.[0]?.status === "EXPIRED" ? (
                                    <p className="_expired order_status">&bull; Expired</p>
                                ) : order?.status === "OPEN" ? (
                                    <p className="_pending order_status">&bull; Waiting for merchant</p>
                                ) : order?.agreements?.[0]?.status === "EVIDENCE_SUBMITTED" ? (
                                    <p className="_pending order_status">&bull; Verification in progress</p>
                                ) : order?.agreements?.[0]?.status === "FUNDED" && deadlinePassed(order?.agreements?.[0]?.deadline) ? (
                                    <p className="_expired order_status">&bull; Expired</p>
                                ) : order?.agreements?.[0]?.status === "FUNDED" ? (
                                    <p className="_pending order_status">&bull; In-progress</p>
                                ) : order?.status === "ACCEPTED" ? (
                                    <p className="_awaiting order_status">&bull; Awaiting payment</p>
                                ) : null}
                            </div>




                            <div className="customer_order_detail">
                                <small>Date created: </small>
                                <span className="order_span">{formatDate(order?.created_at)}</span><br />

                            </div>

                            <div className="customer_order_detail">
                                <small>Amount: </small>
                                <span className="order_span">{order?.budget} {" "} {order.currency}</span><br />
                            </div>
                            <div className="customer_order_detail">
                                <small>Deadline: </small>
                                <span className="order_span">{" "}{formatDate(order?.deadline)}</span><br />
                            </div>
                            <div className="customer_order_detail">
                                <small>Order status: </small>
                                <span className="order_span">{order?.status}</span><br />
                            </div>
                            <div className="customer_order_detail">
                                <small>Contract status: </small>
                                {order?.agreements?.[0]?.status && (
                                    <span className="order_span">{order?.agreements?.[0]?.escrow_status}</span>
                                )}

                            </div>
                                <br /><hr />
                                {order?.status === "ACCEPTED" && order?.agreements?.[0]?.escrow_status  ==="UNFUNDED" && (
                                <div className="status_remark fund">
                                <small>Your order has been accepted. You can now fund escrow</small><br /><br /><button type="button" className="order_action_btns _fund" onClick={() => navigate(`/agreement/${order?.order_id}`)}>Fund</button> <button type="button" className="order_action_btns _cancel" onClick={() => handleCancel(order?.agreements?.[0]?.agreement_id, order?.order_id)} > {order?.status === "CANCELLED" ? "Order Cancelled" : isCancelling ? "Canceling..." : "Cancel order"}</button></div>
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




                            {order?.status === "OPEN" && !deadlinePassed(order?.deadline) && (
                                <div className="status_remark _still"><small>Order is still open and waiting for a merchant</small></div>
                            )}

                            {order?.status === "OPEN" && deadlinePassed(order?.deadline) && (
                                <div className="status_remark _still"><small>Order has expired</small></div>
                            )}

                            {deadlinePassed(order?.deadline) && order?.agreements?.[0]?.escrow_status === "FUNDED" || order?.claimed && (
                                <div className="to_claim status_remark">
                                    {!order?.claimed && (<small>Your order was not successfully completed before deadline. You can claim a refund. </small>
                                    )}

                                    <button type="button" className="order_action_btns _claim_fund" onClick={() => handleClaimFunds(order.agreements?.[0]?.agreement_id)} disabled={isClaiming || order?.claimed}>{order?.claimed ? "Funds Claimed" : isClaiming ? "Claiming..." : "Claim funds"}</button>


                                </div>
                            )}


                            {/* {order?.agreements?.[0]?.escrow_status === "UNFUNDED" && !deadlinePassed(order.deadline) && (
                                    <button type="button" onClick={() => navigate(`/agreement/${order?.order_id}`)} > Fund Escrow </button>
                                )}

                                {order.agreements?.[0]?.escrow_status === "FUNDED" && deadlinePassed(order.deadline) && order.agreements.status === "FUNDED" && (
                                    <button onClick={() => navigate(`/claim/${order.agreements.agreement_id}`)}>Claim Funds </button>
                                )}
                                
                                {deadlinePassed(order.deadline) && (
                                    <button className="expire_btn" type="button" disabled>Expired</button>
                                )}

                                {!deadlinePassed(order.deadline) && order.status === "OPEN" && (
                                    <button className="expire_btn" type="button" disabled>No Action</button>
                                )}*/}
                            </div>
                        ))
                    )}

                </div>

                <br />
                <div className="order_closing">
                   {/*<input type="text" placeholder="Search orders" />
                    <br /><br />*/}
                    <button className="view_all" type="button" onClick={() => navigate("/orders")}>View all Orders</button><br />
                    <br />
                </div>
            </div>
        </div>
    );
}

function Dashboard() {
    return (
        <div>
            
            <DashboardBody />
            
        </div>
    )
}

export default Dashboard;
