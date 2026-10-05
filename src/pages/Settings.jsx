import DashboardHeader from '../components/DashboardHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";

function Settings() {
    return (
        <div className="profile_page">
            <DashboardHeader />
        <h2>My Profile</h2>
        <Footer />
        </div>
    );
}
export default Settings;
