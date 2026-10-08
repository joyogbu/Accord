import { useEffect, useState, useMemo } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaCog, FaExchangeAlt, FaArrowRight, FaRegClone, FaDollarSign, FaFileInvoiceDollar, FaSignOutAlt, FaUser, FaBell, FaWallet, FaCoins, FaCheckCircle, FaClock, FaHistory, FaPaperPlane } from 'react-icons/fa';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import {getAgreements} from '../services/orders';
import {getOpenOrders} from "../services/orders";
import CreateOrder from '../components/CreateOrder.jsx';
import Orders from "../components/GetOrders";

import Footer from '../components/Footer.jsx';

import jopay from '../images/jopay.jpg';

function DashboardBody() {

    const [isOrder, setIsOrder] = useState(false);
    const [agreements, setAgreements] = useState([]);
    const [openOrders, setOpenOrders] = useState([]);
    const { user, setUser } = useUser();
    const navigate = useNavigate();

    const {isConnected, address, disconnect, chainId, } = useWallet();
    console.log("dashboard user", user);
    useEffect(() => {

        if (!isConnected || !address) {
            return;
        }

        initializeUser(address, setUser);

        if (!user) {
            navigate("/");
        }
        if (user?.role !== "MERCHANT") {
            navigate("/");
        }
        async function loadAgreements() {
            try {
                const data = await getAgreements(user?.user_id);

                //console.log("my data", data);
                if(data) {
                    setAgreements(data);
                    console.log("agreements data", data);
                }

            } catch(error) {
                console.error("failed to load agreements", error);
            }
        }
        loadAgreements();

    }, [isConnected, address, user]);


    useEffect(() => {

        if (!isConnected || !address) {
            return;
        }

        initializeUser(address, setUser);

        async function loadAvailableOrders() {
            try {
                const data = await getOpenOrders();

                //console.log("my data", data);
                if(data) {
                    setOpenOrders(data);
                    console.log("available orders data", data);
                }

            } catch(error) {
                console.error("failed to load available orders", error);
            }
        }
        loadAvailableOrders();

    }, [isConnected, address, user]);


    const stats = useMemo(() => {
        const totalCreated = agreements.length;
        const totalSettled = agreements.filter((agreement) => agreement.status === "FULFILLED").length;
        const totalPending = agreements.filter((agreement) => ["FUNDED", "EVIDENCE_SUBMITTED", "DISPUTED"].includes(agreement.status)
        ).length;

        return {
            totalCreated,
            totalSettled,
            totalPending
        };
    }, [agreements]);

    function formatDate(date) {
        return new Date(date).toDateString();
    }

    function deadlinePassed(date) {
        return new Date(date).getTime() <= Date.now();
    }

    return (
        <div className="my_dashboard_2">
            <div className="intro_section">
                <p>Welcome {user?.user_name}</p>
                <h2>My Merchant Dashboard</h2>
                <small>Manage agreements, escrow and consensus-based resolutions</small>

                <div className="intro_2">
                    <button type="button" className="create_order" onClick={() => navigate("/agreements")}>View Agreements</button>
                  
                </div>
                <br />
                <div className="order_summary">
                    <h4 className="order_heading">My Activity</h4>
                    <div className="order_stats">
                        <div className="_stat">
                            <div className="order_img"><FaFileInvoiceDollar /></div>

                            <p className="_text">Total created</p>
                            <p className="_number">{stats.totalCreated}</p>
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



                <div className="available_orders">
                    <h4>Available Orders</h4>
              
                    {openOrders.filter(order => !deadlinePassed(order?.deadline)).length === 0 ? (
                        <div className="no_orders">
                            <p>No available orders</p>
                        </div>
                    ) : (

                        openOrders.filter(order => !deadlinePassed(order?.deadline)).map((order) => (
                        <div style={{border:"2px solid none"}} key={order.order_id} className="order_item">
                            
                            <div className="customer_order_detail">
                                <small>Date created: </small>
                                <span className="order_span">{formatDate(order.created_at)}</span><br />
                            </div>
                            <hr />
                            <div className="customer_order_detail">
                                <small>Amount: </small>
                                <span className="order_span">{order.budget} {" "} {order.currency}</span><br />
                            </div>
                            <hr />
                            <div className="customer_order_detail">
                                <small>Deadline: </small>
                                <span className="order_span">{formatDate(order.deadline)}</span><br />
                            </div>
                            <hr />
                            <div className="customer_order_detail">
                                <small>Status: </small>
                                <span className="order_span">{order.status}</span><br />
                            </div>
                            <hr />
                            <small>Description: </small><br />
                            <span>{order?.description}</span><br /><br />
                            <button type="button" className="action_button" onClick={() => navigate(`/view-order/${order.order_id}`) }>View details</button>
                            
                        </div>
                    )))}
                </div>
                <br />


                <div className="order_closing">
                    <button className="view_all" onClick={() => navigate("/orders")}>View all Orders</button>
                </div>
                <br />

                <div className="order_history">
                    <h4>My Recent Agreements</h4>
                    <div className="order_img"><FaExchangeAlt /></div>
                    <br />
                    {agreements.length === 0 ? (
                        <div className="order_item">
                            <p><b>No agreements accepted yet.</b></p>
                            <span>Your accepted agreements will show up here</span>
                            <button type="button" className="create_order" onClick={() => navigate("/orders")} >Accept your first Agreements</button>
                        </div>
                    ) : (
                        agreements.map(agreement => (

                            <div className="order_item" key={agreement?.agreement_id}>
                                <div className="customer_order_detail">
                                    <small>Date created: </small>
                                    <span className="order_span">{formatDate(agreement?.created_at)}</span><br />
                                </div>
                                <hr />
                                <div className="customer_order_detail">
                                    <small>Amount: </small>
                                    <span className="order_span">{agreement?.amount} {" "} {agreement.currency}</span><br />
                                </div>
                                <hr />
                                <div className="customer_order_detail">
                                    <small>Deadline: </small>
                                    <span className="order_span">{" "}{formatDate(agreement?.deadline)}</span><br />
                                </div>
                                <hr />
                                <div className="customer_order_detail">
                                    <small>Agreement status: </small>
                                    <span className="order_span">{agreement?.status}</span><br />
                                </div>
                                <hr />
                                <div className="customer_order_detail">
                                    <small>Contract status: </small>
                                    <span className="order_span">{agreement?.escrow_status}</span>
                                </div>
                                <hr />
                                

                                {agreement?.status === "CANCELLED" ? (
                                    <p className="_cancelled order_status">&bull; Cancelled</p>
                                ) : agreement?.status === "REJECTED" ? (
                                    <p className="_rejected order_status">&bull; Rejected</p>
                                ) : agreement?.status === "FULFILLED" ? (
                                    <p className="completed order_status">&bull; Completed</p>
                                ) : agreement?.status === "EXPIRED" ? (
                                    <p className="_expired order_status">&bull; Expired</p>
                                ) : agreement?.status === "EVIDENCE_SUBMITTED" ? (
                                    <><p className="_pending order_status">&bull; Verification in progress</p><button className="action_button check_status" type="button" onClick={() => navigate(`/submit-work/${agreement.agreement_id}`) }>Check Status</button></>
                                ) : agreement?.status === "FUNDED" && deadlinePassed(agreement?.deadline) ? (
                                    <p className="_expired order_status">&bull; Expired</p>
                                ): agreement?.status === "FUNDED" ? (
                                    <p className="_pending order_status">&bull; In-progress</p>
                                ) : agreement?.status === "ACCEPTED" ? (
                                    <p className="_awaiting order_status">&bull; Awaiting payment</p>
                                ) : agreement?.status === "CREATED" && agreement?.escrow_status === "UNFUNDED" ? (
                                    <p className="_awaiting order_status">&bull; Awaiting payment</p>
                                ) : null}

                                {agreement?.escrow_status === "FUNDED" && agreement?.status === "FUNDED" && !deadlinePassed(agreement?.deadline) && (
                                    <button type="button" className="action_button" onClick={() => navigate(`/submit-work/${agreement.agreement_id}`) } >Submit</button>
                                )}

                                {/*{agreements?.escrow_status === "UNFUNDED" && !deadlinePassed(agreement.deadline) && (
                                    <button type="button" onClick={() => navigate(`/agreement/${agreement.agreement_id}`)} > Fund Escrow </button>
                                )}

                                {agreements?.escrow_status === "FUNDED" && deadlinePassed(agreement.deadline) && agreements.status === "FUNDED" && (
                                    <button >Claim Funds </button>
                                )}*/}

                            </div>
                        ))
                    )}

                    <div className="order_closing">
                    <button className="view_all" onClick={() => navigate("/agreements")}>View all Agreements</button><br />
                    <br />
                    </div>

                

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
