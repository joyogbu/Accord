import { useEffect, useState, useMemo } from "react";
import {useNavigate} from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import {getSubmissions} from "../services/orders";
import DashboardHeader from '../components/DashboardHeader.jsx';
import Footer from '../components/Footer.jsx';

function MySubmissions() {
    const [submissions, setSubmissions] = useState([]);

    const { user, setUser } = useUser();
    const navigate = useNavigate();

    const {isConnected, address, disconnect, chainId, } = useWallet();
   
    useEffect(() => {
        if (!user?.user_id) {
            return;
        }

        if (!isConnected || !address) {
            return;
        }

        initializeUser(address, setUser);

        if(user?.role !== "MERCHANT") {
            navigate("/");
        }
        async function loadSubmissions() {
            try {
                const data = await getSubmissions(user?.user_id);

                //console.log("my data", data);
                if(data) {
                    setSubmissions(data);
                    console.log("submissions data", data);
                }

            } catch(error) {
                console.error("failed to load submissions", error);
            }
        }
        loadSubmissions();

    }, [isConnected, address, user?.user_id]);


    const stats = useMemo(() => {
        const fulfilled = submissions.filter(
            (submission) => submission.result === "FULFILLED"
        ).length;

        const rejected = submissions.filter(
            (submission) => submission.result === "REJECTED"
        ).length;

        const pending = submissions.filter(
            (submission) =>
            !submission.result ||
            submission.result === "PENDING" ||
            submission.result === "RETRY").length;

        const uniqueAgreements = new Map();

        submissions.forEach((submission) => {
            const agreement = submission.agreement;
            
            if (agreement && !uniqueAgreements.has(agreement.agreement_id)) {
                uniqueAgreements.set(

                    agreement.agreement_id,
                    Number(agreement.amount || 0)
                );
            }
        });

        const totalVolume = Array.from(uniqueAgreements.values())
            .reduce((total, amount) => total + amount, 0);

        return {
            fulfilled,
            rejected,
            pending,
            totalVolume,
        };
    }, [submissions]);

    
    function formatDate(date) {
        return new Date(date).toDateString();
    }

    return (
        <>
            <DashboardHeader />
            <div className="my_submissions_page">
                <h2>My Submissions</h2>
                <p>Track every submissions and check the status here</p>
                <button type="button" className="submit_new" onClick={() => navigate("/agreements")}>New Submission</button>
                
                    <h4>Submission stats</h4>
                    <div className="submission_stats">
                        <div className="_stats">
                            <p>{stats.fulfilled}</p>
                            <span>Fulfilled</span>
                        </div>
                        <div className="_stats">
                            <p>{stats.rejected}</p>
                            <span>Rejected</span>
                        </div>
                        <div className="_stats">
                            <p>{stats.pending}</p>
                            <span>In-review</span>
                        </div>
                        <div className="_stats">
                            <p>{stats.totalVolume} GEN</p>
                            <span>Volume</span>
                        </div>
                    </div>

                    <h4>Submissions history</h4>
                    {submissions.map((submission) => (
                        <div className="my_submissions" key={submission.evidence_id}>
                  
                            <span className="id_heading">{submission?.agreement?.agreement_id}</span>
                            <br />
                            <span>{submission?.agreement?.description}</span><br /><br />



                            {submission?.result === "REJECTED" ? (
                                    <p className="_rejected order_status">&bull; Rejected</p>
                                ) : submission?.result === "FULFILLED" ? (
                                    <p className="completed order_status">&bull; Completed</p>
                                ) : submission?.result === "EXPIRED" ? (
                                    <p className="_expired order_status">&bull; Expired</p>
                                
                 
                                ) : null}
                            



                            <div className="submitted_item">
      
                                <div className="submitted_details">
                                    <small>Created: </small>
                                    <span>{formatDate(submission?.agreement?.created_at)}</span><br />
                                </div>
                                <hr />
                                <div className="submitted_details">
                                    <small>Submitted </small>
                                    <span>{formatDate(submission?.created_at)}</span><br />
                                </div>
                                <hr />
                                <div className="submitted_details">
                                    <small>amount </small>
                                    <span>{submission?.agreement?.amount}</span><br />
                                </div>
                                <hr />
                                <div className="submitted_details">
                                    <small>Status </small>
                                    <span>{submission?.result}</span><br />
                                </div>
                                <hr />
                                <div className="submitted_details">
                                    <small>Job Description </small>
                                    <span>{submission?.agreement?.requirements}</span><br />
                                </div>
                                <hr />
                                <div className="submitted_details">
                                    <small>Evidence </small>
                                    <span className="_url"><a href={submission?.evidence_url} target="_blank" rel="noopener noreferrer">{submission?.evidence_url}</a></span><br />
                                </div>
                                <hr />
                                <div className="_result">
                                    <small>Verification result </small>
                                    <span>{submission?.reason}</span><br />
                                </div>
                                <hr />
                        
                            </div>
                            <br />
                        </div>
                        
                    )
                    )}
            </div>
            <Footer />
        </>
    );
}
export default MySubmissions;
