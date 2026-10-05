import {useEffect} from 'react';
import { useWallet } from '../hooks/useWallet';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import CustomerDashboard from '../components/CustomerDashboard.jsx';
import MerchantDashboard from '../components/MerchantDashboard.jsx';
import DashboardHeader from '../components/DashboardHeader.jsx';
import Footer from '../components/Footer.jsx';

function Dashboard() {
    const { user, setUser } = useUser();
    const {isConnected, address, disconnect, chainId, } = useWallet();


    useEffect(() => {

        if (!isConnected || !address) {
            return;
        }

        initializeUser(address, setUser);
    }, [isConnected, address, user] );
    
    if (!user) {
        return (
            <p>Loading...</p>
        );
    }

    return (
        <div>
            <DashboardHeader />

            {user.role === "CUSTOMER" && <CustomerDashboard />}
            {user.role === "MERCHANT" && <MerchantDashboard />}

            <Footer />
        </div>
    );
}
export default Dashboard;
