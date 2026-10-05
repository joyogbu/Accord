import {useEffect, useState } from 'react';
import DashboardHeader from '../components/DashboardHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useUser } from "../hooks/UserContext";

import { initializeUser } from "../services/userService";
import { useWallet } from '../hooks/useWallet';
import {getAgreements, getMyOrders} from '../services/orders';
function Profile() {
    const [agreements, setAgreements] = useState([]);
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const { user, setUser } = useUser();
    const {isConnected, address, disconnect, chainId, } = useWallet();

    const trimAddress = `${address?.slice(0, 4)}... ${address?.slice(-4)}`;

    useEffect(() => {
        if (!user?.user_id) {
            return;
        }
        if (!isConnected || !address) {            return;
        }
        initializeUser(address, setUser);
        if(!user) {
            navigate("/");
        }
    }, [isConnected, address, user?.user_id]);

    useEffect(() => {
        async function loadAgreements() {
            try {
                setError("");
                
                const data = await getAgreements(user.user_id);
                console.log("agreements for profile", data);
                console.log("user in profile page", user?.user_id);
                setAgreements(data);
                console.log("profile agreements", agreements);

            } catch(err) {
                console.log("Loading agreement error", err);
                setError("Failed to load agreements");
            }
        }
        loadAgreements();
    }, [user?.user_id] );


    useEffect(() => {
        async function loadOrders() {
            try {
                setError("");

                const data2 = await getMyOrders(user.user_id);
                console.log("orders for profile", data2);
                
                setOrders(data2);
                console.log("profile orders", orders);

            } catch(error) {
                console.log("Loading agreement error", error);
                setError("Failed to load orders");
            }
        }
        loadOrders();
    }, [user?.user_id] );

    const totalEarned = agreements
        .filter(agreement => agreement.escrow_status === "RELEASED")
        .reduce(
            (total, agreement) => total + Number(agreement.amount), 0 );

    const totalCommitted = orders
    .flatMap(order => order.agreements || [])
    .filter(agreement => agreement.escrow_status === "FUNDED")
    .reduce(
        (total, agreement) => total + Number(agreement.amount || 0),
        0
    );
    {/*const totalCommitted = agreements
        .filter(agreement => agreement.escrow_status === "FUNDED")
        .reduce(
            (total, agreement) => total + Number(agreement.amount), 0 );*/}

    function formatDate(date) {              return new Date(date).toDateString();                                 }

    return (
        <div className="page_wrapper">
            <DashboardHeader />
            <div className="profile_page">
                <h2>My Profile</h2>
                <div className="id_div">
                    <h3>{user?.user_name}</h3>
                    <span>{trimAddress}</span><br />
                </div>
                <br />
                <div className="role_div">
                    <span className="id_heading">{user?.role}</span><br />
                    <small>Role</small>
                </div>
                <br />
                <h3>My Standing</h3>
                {user?.role == "MERCHANT" && (
                    <div className="profile_standing">
                        <div className="profile_item">
                            <p>{totalEarned} GEN</p>
                            <span>Total  earned</span>
                        </div>
                        <div className="profile_item">
                            <p>{formatDate(user?.created_at)}</p>
                            <span>Date Joined</span>
                        </div>
                    </div>
                )}

                {user?.role == "CUSTOMER" && (
                    <div className="profile_standing">
                        <div className="profile_item">
                            <p>{totalCommitted} GEN</p>
                            <span>Total Committed</span>
                        </div>
                        <div className="profile_item">
                            <p>{formatDate(user?.created_at)}</p>
                            <span>Date Joined</span>
                        </div>
                    </div>                             )}


            </div>
            <Footer />
        </div>
        
    );
}
export default Profile;
