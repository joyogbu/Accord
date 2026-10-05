import { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaCog, FaEdit, FaExchangeAlt, FaArrowRight, FaRegClone, FaDollarSign, FaFileInvoiceDollar, FaSignOutAlt, FaUser, FaBell, FaWallet, FaCoins, FaCheckCircle, FaClock, FaHistory, FaPaperPlane, FaChevronDown } from 'react-icons/fa';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";

import CreateOrder from '../components/CreateOrder.jsx';
import Orders from "../components/GetOrders";

import Footer from '../components/Footer.jsx';

import accord from '../images/accord.png';

function DashboardHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdown, setIsDropdown] = useState(false);
    const [isProfile, setIsProfile] = useState(false);
    const [copyWallet, setCopyWallet] =
 useState("");
    const [isCopied, setIsCopied] = useState(false);
    const navigate = useNavigate();
    const {isConnected, address, disconnect, chainId, } = useWallet();

    const { user, setUser } = useUser();

    const trimAddress = `${address?.slice(0, 3)}... `;

    if(!isConnected) {
        navigate("/");
    }

    useEffect(() => {
        if (!isConnected || !address) {
            return;
        }
        initializeUser(address, setUser);
    }, [setUser, isConnected, address]);

    function toggle() {
                setIsOpen(!isOpen);
        }

    function dropNotis() {
            setIsDropdown(!isDropdown);
    }
    function dropProfile() {
        setIsProfile(!isProfile);
    }
    
    const copyAddress = async () => {
        await navigator.clipboard.writeText(address);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 500);
    }

    return (
        <div className="my_dashboard">
            <div id="myModal" className={`notification_div ${isDropdown ? "show_notis" : ""}`}>
                <p>No Notifications</p>
            </div>

            <div id="myProfile" className={`wallet_dropdown ${isProfile ? "show_profile" : ""}`}>
                <p className="wallet_address">{address.toLowerCase()}</p>

                <button className="copy" onClick={ copyAddress }>{isCopied ? "Copied!" : <FaRegClone />} Copy Address</button>
                
                <p><li className="link_flex"><Link to="/profile"><FaUser /></Link><Link to="/profile">View Public Profile</Link></li></p>

                <p><li className="link_flex"><Link to="/settings"><FaEdit /></Link><Link to="/settings">Settings</Link></li></p>
               
                <hr />
                <button type="button" className="wallet_disconnect" onClick={disconnect}>Disconnect</button>
            </div>
            <div className={`my_sidebar ${isOpen ? "open" : "close"}`}>
                <div className="sidebar_flexbox">
                    <div className=" sidebar_logo">
                        <img className="sidebar_img" src={accord} />
                    </div>
                    <button type="button" className="my_sidebar_close_btn" onClick={toggle}>X</button>
                </div>
                <hr />
                <ul className="sidebar_links">
                    <li className="link_flex"><Link to="/"><FaHome /></Link><Link to="/">Home</Link></li>
                    <li className="link_flex"><Link to="/dashboard"><FaHome /></Link><Link to="/dashboard">Dashboard</Link></li>

                    {user?.role === "CUSTOMER" && (
                        <>
                            <li className="link_flex"><Link to="/orders"><FaExchangeAlt /></Link><Link to="/orders">My Orders</Link></li>
                            <li className="link_flex"><Link to="/orders"><FaExchangeAlt /></Link><Link to="/create-order">Create Order</Link></li>
                        </>
                    )}
                    {user?.role === "MERCHANT" && (
                        <>
                         <li className="link_flex"><Link to="/orders"><FaExchangeAlt /></Link><Link to="/orders">Available Orders</Link></li>
                            <li className="link_flex"><Link to="/agreements"><FaExchangeAlt /></Link><Link to="/agreements">My Agreements</Link></li>
                            <li className="link_flex"><Link to="/my-submissions"><FaExchangeAlt /></Link><Link to="/my-submissions">Submissions</Link></li>
                          
                        </>
                    )}
                    
                    <li className="link_flex"><Link to="/protile"><FaUser /></Link><Link to="/profile">Profile</Link></li>
                    <li className="link_flex"><div className="sidebar_btn" type="button" onClick={disconnect}><FaSignOutAlt /></div><button type="button" >Sign Out</button></li>
                </ul>
            </div>

            <div className="my_navbar">
                <div className="navbar_items">
                    <button className="navbar_menu" type="button" onClick={toggle}>☰</button>
                </div>
                <div className="navbar_items navbar_logo">
                    <img className="navar_img" src={accord} />
                </div>
                <div className="navbar_items">
                    <button type="button" className="navbar_notis" onClick={dropNotis}>🔔</button>
                </div>
                <div className="navbar_items _wallet">
                    <div id="navbar_wallet">
                        <span>{trimAddress}</span><span><button onClick={dropProfile} type="button" className="drop_btn"><FaChevronDown /></button></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default DashboardHeader;
