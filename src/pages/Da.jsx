import { useEffect, useState, useMemo } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaCog, FaExchangeAlt, FaArrowRight, FaRegClone, FaDollarSign, FaFileInvoiceDollar, FaSignOutAlt, FaUser, FaBell, FaWallet, FaCoins, FaCheckCircle, FaClock, FaHistory, FaPaperPlane } from 'react-icons/fa';
import DashboardHeader from '../components/DashboardHeader.jsx';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import {getMyOrders} from '../services/orders';
import CreateOrder from '../components/CreateOrder.jsx';
import Orders from "../components/GetOrders";

import Footer from '../components/Footer.jsx';

import jopay from '../images/jopay.jpg';

function DashboardBody() {

    const [isOrder, setIsOrder] = useState(false);
    const [orders, setOrders] = useState([]);

    const { user, setUser } = useUser();

    const {isConnected, address, disconnect, chainId, } = useWallet();
    console.log("dashboard user", user);
    useEffect(() => {

        if (!isConnected || !address) {
            return;
        }

        initializeUser(address, setUser);

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

    if(!user) {
        return (
            <p>Loading...</p>
        );
    }
    return (
        <div className="my_dashboard_2">
            <div className="intro_section">
                <p>Joy Ogbu</p>
                <h2>My Dashboard</h2>
                <small>Manage agreements, escrow and consensus-based resolutions</small>
                
                <div className="intro_2">
                    <button type="button" className="create_order" onClick={openOrder}>Create Order</button>
                    {isOrder && <CreateOrder closeOrder={closeOrder} /> }
                </div>
                <br />
                <div className="order_summary">
                    <h4 className="order_heading">My Activity</h4>
                    <div className="order_stats">
                        <div className="_stat">
                            <div className="order_img"><FaFileInvoiceDollar /></div>

                            <p className="_text">Total created</p>
                            <p className="_number">{stats.totalOrders}</p>
                        </div>
                        <div className="_stat">
                            <div className="order_img"><FaDollarSign /></div>

                            <p className="text">Total settled</p>
                            <p className="number">{stats.totalSettled}</p>
                        </div>

                        <div className="_stat">
                            <div className="order_img"><FaClock /></div>

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
                        orders.map(order => (
                            
                            <div className="order_item">
                           
                                <small>Date created: </small>
                                <span>{formatDate(order?.created_at)}</span><br />
                                
                          
                                <small>Amount: </small>
                                <span>{order?.budget} {" "} {order.currency}</span><br />
                                <small>Deadline: </small>
                                <span>{" "}{formatDate(order?.deadline)}</span><br />
                                <small>Order status: </small>
                                <span>{order?.status}</span><br />
                                <small>Contract status: </small>
                                {order?.agreements?.[0]?.status && (
                                    <span>{order?.agreements?.[0]?.escrow_status}</span>
                                )}
                                

                                {order?.agreements?.[0]?.escrow_status === "UNFUNDED" && !deadlinePassed(order.deadline) && (
                                    <button type="button" onClick={() => navigate(`/agreement/${agreement.agreement_id}`)} > Fund Escrow </button>
                                )}

                                {order.agreements?.[0]?.escrow_status === "FUNDED" && deadlinePassed(order.deadline) && order.agreements.status === "FUNDED" && (
                                    <button onClick={() => navigate(`/claim/${order.agreements.agreement_id}`)}>Claim Funds </button>
                                )}

                            </div>
                        ))
                    )}
                       
                </div>
                
                <br />
                <div className="order_closing">
                    <input type="text" placeholder="Search orders" />
                    <br /><br />
                    <button className="view_all">View all Orders</button><br />
                    <br />
                </div>
            </div>
        </div>
    );
}

function Dashboard() {
    return (
        <div>
            <DashboardHeader />
            <DashboardBody />
            <Footer />
        </div>
    )
}

export default Dashboard;
