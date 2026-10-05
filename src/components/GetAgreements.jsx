import { useEffect, useState } from "react";
import {useNavigate} from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import {getAgreements} from "../services/orders";
import DashboardHeader from '../components/DashboardHeader.jsx';
import Footer from '../components/Footer.jsx';

function Agreements() {
    const [myAgreements, setMyAgreements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { user, setUser } = useUser();
    const {isConnected, address, disconnect, chainId, } = useWallet();
   // console.log("order page user", user);
    const navigate = useNavigate();
    useEffect(() => {
        if (!isConnected || !address) {
            return;
        }
        initializeUser(address, setUser);

    }, [isConnected, address]);

    useEffect(() => {
        if(!user) {
            return;
        }
        if(user?.role !== "MERCHANT") {
            navigate("/");
        }
        async function loadAgreements() {
            try {
                setError("");
                setLoading(true);

                const data = await getAgreements(user.user_id);
                setMyAgreements(data);

            } catch(err) {
                console.log("Loading agreement error", err);
                setError("Failed to load agreements");
            } finally {
                setLoading(false);
            }
        }
        loadAgreements();
    }, [user] );


    function formatDate(date) {
        return new Date(date).toDateString();
    }

    function deadlinePassed(date) {
        return new Date(date).getTime() <= Date.now();
    }

    return (
        <div className="page_wrapper">
            <DashboardHeader />
            <div>
                
                {myAgreements ? (
                                        
                    <div className="agreements">
                        <h1>My Agreements</h1>    
                        {myAgreements.map((agreement) => (
                            <>
                            <div className="agreement_card" key={agreement.agreement_id}>
                                <p className="id_heading">{agreement?.agreement_id}</p>
                                <div className="customer_order_detail">
                                    <small>Date created: </small>
                                    <span className="order_span">{formatDate(agreement?.created_at)}</span>
                                </div>
                                <hr />
                                <div className="customer_order_detail">
                                    <small>Title: </small>
                                    <span className="order_span">{agreement?.description}</span>
                                </div>
                                <hr />
                                <div className="customer_order_detail">
                                
                                    <small>Amount: </small>
                                    <span className="order_span">{agreement?.amount} {" "} {agreement.currency}</span>
                                </div>
                                <hr />
                                <div className="customer_order_detail">
                                    <small>Deadline: </small>
                                    <span className="order_span">{" "}{formatDate(agreement?.deadline)}</span>
                                </div>
                                <hr />
                                <div className="customer_order_detail">
                                    <small>Agreement status: </small>
                                    <span className="order_span">{agreement?.status}</span>
                                </div>
                                <hr />
                                <div className="customer_order_detail">
                                    <small>Contract status: </small>

                                    <span className="order_span">{agreement?.escrow_status}</span>
                                </div>
                                <hr />
                                <small>Description</small><br />
                                <span>{agreement?.requirements}</span>

                                {agreement?.status === "CANCELLED" ? (
                                    <p className="_cancelled order_status">&bull; Cancelled</p>
                                ) : agreement?.status === "REJECTED" ? (
                                    <p className="_rejected order_status">&bull; Rejected</p>
                                ) : agreement?.status === "FULFILLED" ? (
                                    <p className="completed order_status">&bull; Completed</p>
                                ) : agreement?.status === "EXPIRED" ? (
                                    <p className="_expired order_status">&bull; Expired</p>
                                ) : agreement?.status === "EVIDENCE_SUBMITTED" ? (
                                    <p className="_pending order_status">&bull; Verification in progress</p>
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
                               
                            </div></>
                        ))}

                    </div>
                ) : (
                    <>
                        <p>Loading Agreements...</p>
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
}
export default Agreements;
