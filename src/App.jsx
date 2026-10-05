import { useState } from "react";
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './components/GetOrders.jsx';
import GetAgreements from './components/GetAgreements.jsx';
import UserRole from './components/UserRole.jsx';
import CreateOrder from './components/CreateOrder.jsx';
import OrderDetails from './pages/OrderDetails.jsx';
import AgreementDetails from './pages/AgreementDetails.jsx';
import Submission from './pages/Submission.jsx';
import MySubmissions from './pages/MySubmissions.jsx';

import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';

function App() {
    return (
        <div id="container_div">
            <Routes>
                <Route path="/" element={ <Home /> } />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-order" element={<CreateOrder />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/agreements" element={<GetAgreements />} />
                <Route path="/view-order/:orderId" element={<OrderDetails />} />
                <Route path="/agreement/:orderId" element={<AgreementDetails />} />
                <Route path="/create-role" element={<UserRole />} />

                <Route path="/submit-work/:agreementId" element={<Submission />} />
            
                <Route path="/my-submissions" element={<MySubmissions />} />

                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </div>
    );
}
export default App;
