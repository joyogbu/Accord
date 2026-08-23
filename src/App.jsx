import { useState } from "react";
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
function App() {
    return (
        <div id="container_div">
            <Routes>
                <Route path="/" element={ <Home /> } />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </div>
    );
}
export default App;
