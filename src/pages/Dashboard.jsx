import { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaCog, FaExchangeAlt, FaArrowRight, FaRegClone, FaDollarSign, FaFileInvoiceDollar, FaSignOutAlt, FaUser, FaBell, FaWallet, FaCoins, FaCheckCircle, FaClock, FaHistory, FaPaperPlane } from 'react-icons/fa';
import Footer from '../components/Footer.jsx';

import jopay from '../images/jopay.jpg';

function NavBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdown, setIsDropdown] = useState(false);
    const navigate = useNavigate();
    const {isConnected, address, disconnect, chainId, } = useWallet();
    const trimAddress = `${address.slice(0, 3)}...${address.slice(-4)}`;
   
    if(!isConnected) {
        navigate("/");
    }
    function toggle() {
		setIsOpen(!isOpen);
	}

    function dropNotis() {
	    setIsDropdown(!isDropdown);
    }
    return (
        <div className="my_dashboard">
            <div className={`notification_div ${isDropdown ? "show_notis" : ""}`}>
                <p>No Notifications</p>
            </div>

            <div className={`my_sidebar ${isOpen ? "open" : "close"}`}>
                <div className="sidebar_flexbox">
                    <div className=" sidebar_logo">
                        <img className="sidebar_img" src={jopay} />
                    </div>
                    <button type="button" className="my_sidebar_close_btn" onClick={toggle}>X</button>
                </div>
                <hr />
                <ul className="sidebar_links">
				    <li className="link_flex"><Link to="/"><FaHome /></Link><Link to="/">Home</Link></li>
                
				    <li className="link_flex"><Link to="/"><FaHome /></Link><Link to="/">Home</Link></li>

                
				    <li className="link_flex"><Link to="/transactions"><FaExchangeAlt /></Link><Link to="/">Orders</Link></li>
				
                    <li className="link_flex"><Link to="/payment"><FaDollarSign /></Link><Link to="/">Payments</Link></li>

				    <li className="link_flex"><Link to="/settings"><FaCog /></Link><Link to="/">Settings</Link></li>
                
				    <li className="link_flex"><div className="sidebar_btn" type="button" ><FaSignOutAlt /></div><button type="button">Sign Out</button></li>
			    </ul>
            </div>
                
            <div className="my_navbar">
                <div className="navbar_items">
                    <button className="navbar_menu" type="button" onClick={toggle}>☰</button>
                </div>
                <div className="navbar_items navbar_logo">
                    <img className="navar_img" src={jopay} />
                </div>
                <div className="navbar_items">
                    <button type="button" className="navbar_notis" onClick={dropNotis}>🔔</button>
                </div>
                <div className="navbar_items">
                    <div id="navbar_wallet">
                        <p>{trimAddress}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardBody() {
    return (
        <div className="my_dashboard_2">
            <div className="intro_section">
                <p>My Dashboard</p>
                <small>Manage agreements, escrow and consensus-based resolutions</small>
                <div className="intro_1">
                    <p>Joy O.</p>
                </div>
                <div className="intro_2">
                    <input type="text" placeholder="Search agreements" />
                    <button type="button" className="create_order">Create Order</button>
                </div>
                <br />
                <div className="order_summary">
                    <div className="total_accepted">
                        <p className="_text">Total</p>
                        <p className="_number">789</p>
                    </div>
                    
                    <div className="total_accepted">
                        <p className="text">Total</p>
                        <p className="number">789</p>
                    </div>

                    <div className="total_accepted">
                        <p className="text">Total</p>
                        <p className="number">789</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

function Dashboard() {
    return (
        <div>
            <NavBar />
            <DashboardBody />
            <Footer />
        </div>
    )
}

export default Dashboard;
