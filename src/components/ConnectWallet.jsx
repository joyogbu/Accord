import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import { supabase } from "../lib/supabase";
import { useWallet } from '../hooks/useWallet';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import UserRole from "./UserRole.jsx";
import accord from '../images/accord.png';

function ConnectWallet({ closeModal }) {
    const [isError, setIsError] = useState("");

    const navigate = useNavigate();
    const {handleConnect, address, isConnected, disconnect, chainId, } = useWallet();
    const { setUser } = useUser();

    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log(
        "Supabase key exists:",
        !!import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    const wallet_address = address?.toLowerCase();
    
    useEffect(() => {

        if (!isConnected || !address) {
            return;
        }

        async function connectUser() {
            try {
                const user = await initializeUser(wallet_address, setUser);

                if (!user.role) {
                    navigate("/create-role");
                    return;
                }
                
                navigate("/dashboard");
                
            }catch(error) {
                setIsError("unable to connect:", error);
                console.log(error);
                return;
            }
        }

        connectUser();

    }, [isConnected, address]);

    return (
        <div className="modal_overlay">
            <div className="modal_box">
                <button type="button" className="close_modal" onClick={closeModal}>X</button>
                <br />
                <div className="logo_div1">
                    <div className="logo_div2">
                        <img className="logo_img" src={accord} />
                    </div>
                </div>
                
                <h2 className="modal_text_heading">Welcome to Accord</h2>
                <p className="modal_text">Please connect your wallet, and choose a role to begin</p>
                <button type="button" id="wallet_connect" onClick={handleConnect}>Connect Wallet</button>

               
             
                {isError && <p className="form_error">{isError}</p>}
                <br />
                <br />
                <small className="modal_text">Please use metamask for now</small>
            </div>
        </div>
    );
}

export default ConnectWallet;
