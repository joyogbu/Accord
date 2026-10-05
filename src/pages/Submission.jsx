import { useEffect, useState } from "react";
import {useParams, useNavigate} from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/UserContext";
import { initializeUser } from "../services/userService";
import {getMyAgreement} from "../services/orders";
import DashboardHeader from '../components/DashboardHeader.jsx';
import {submitEvidence} from '../lib/genlayer.js';
import {verifyAgreement} from '../lib/genlayer.js';
import {getAgreement} from '../lib/genlayer.js';
import Footer from '../components/Footer.jsx';

function Submission() {
    const [myAgreement, setMyAgreement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [evidenceUrl, setEvidenceUrl] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [canResumeVerification, setCanResumeVerification] = useState(false);

    const [isVerifying, setIsVerifying] = useState(false);

    const [submissionId, setSubmissionId] = useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [verifyMessage, setVerifyMessage] = useState("");

    const {agreementId} = useParams();
    console.log("agreement id", agreementId);
    const { user, setUser } = useUser();
    const {handleConnect, isConnected, address, disconnect, chainId, } = useWallet();
   // console.log("order page user", user);
    const navigate = useNavigate();

    // Load the logged in user
    useEffect(() => {
        if (!isConnected || !address) {
            return;
        }
        initializeUser(address, setUser);

    }, [isConnected, address]);


    // Load the agreement for submission
    useEffect(() => {
        if(!user) {
            navigate("/");
        }
        if(user?.role !== "MERCHANT") {
            navigate("/");
        }
        async function loadAgreement() {
            try {
                setError("");
                setLoading(true);

                const data = await getMyAgreement(agreementId);
                console.log("my agreement data", data);
                
                setMyAgreement(data);
                
               

            } catch(err) {
                console.log("Loading agreement error", err);
                setError("Failed to load agreement");
            } finally {
                setLoading(false);
            }
        }
        loadAgreement();
    }, [user, agreementId] );


    // Load the last submission entry submission id to use in verification
    useEffect(() => {
        async function loadSubmission() {
            const { data, error } = await supabase
                .from("submissions")
                .select("*")
                .eq("agreement_id", agreementId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error) {
                console.error(error);
                return;
            }
            if (data) {
                console.log("data from useeffect", data);
                setSubmissionId(data.evidence_id);
                console.log("data from setSubmission", submissionId);
            }
        }

        async function checkVerificationStatus() {
            const agreement = await getAgreement(agreementId);

            if (agreement?.status === "EVIDENCE_SUBMITTED" && agreement?.verification_result === "") {
                setCanResumeVerification(true);
            }
        }

        if (agreementId) {
            loadSubmission();
            checkVerificationStatus;
        }
    }, [agreementId]);

    
    function formatDate(date) {
        return new Date(date).toDateString();
    }




    async function updateVerification() {
        console.log("evidence id", submissionId);
        console.log("agreement id", agreementId);
        const { data, error } = await supabase.rpc("update_verification",
            {
                p_agreement_id: agreementId,
                p_evidence_id: submissionId,
                p_result: "FULFILLED",
                p_reason: "raw update",
                p_status: "FULFILLED",
                p_verification_hash: "transaction_hash",
            }
        );

        if (error) {
            console.error("Database update failed:", error);
            return;
        }
        console.log("Database updated:", data);
    }


    const handleVerifyAgreement = async (evidenceId) => {
        try {
            setIsSubmitting(false);
            setIsVerifying(true);
            setError("");

            const verification = await verifyAgreement(
                address,
                agreementId,
                handleConnect
            );

            console.log("Verification result:", verification);

            if (verification?.success === true) {
                const { error: updateError } = await supabase.rpc(
                    "update_verification",
                    {
                        p_agreement_id: agreementId,
                        p_evidence_id: evidenceId,
                        p_verification_hash: verification.txHash,
                        p_result: verification.verificationResult,
                        p_reason: verification.verificationReason || "",
                        p_status:
                            verification.verificationResult === "FULFILLED"
                                ? "FULFILLED"
                                : verification.verificationResult === "REJECTED"
                                    ? "REJECTED"
                                    : "EVIDENCE_SUBMITTED",
                    }
                );
                if (updateError) {
                    console.error("Failed to update verification:", updateError);
                    setError("Verification completed, but database update failed.");
                    return;
                }
                if (verification.verificationResult === "FULFILLED") {
                    setVerifyMessage("Work verified successfully.");
                } else if (verification.verificationResult === "REJECTED") {
                    setError(verification.verificationReason || "Verification failed.");
                } else if (verification.verificationResult === "RETRY") {
                    setError(verification.verificationReason || "Verification could not be completed. Please submit new evidence.");
                }
                return verification;
            } else if (verification?.status === "ERROR") {
                setError(verification.errorMessage || "Verification failed to execute.");
                return verification;
            }
        } catch (err) {
            setCanResumeVerification(true);
            console.error("Verification error:", err);
            setError(err?.message || "Failed to verify agreement. You can reaume verification");
        } finally {
            setIsVerifying(false);
        }
    };


    // Resume verification on network error
    const handleResumeVerification = async () => {
        if (!submissionId) {
            setError("Submission ID not found. Please refresh the page");
            return;
        }

        await handleVerifyAgreement(submissionId);
    };


    const handleSubmitEvidence = async () => {
        console.log("Evidence URL:", evidenceUrl);

        if (!evidenceUrl.trim()) {
            setError("Please enter an evidence URL.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const result = await submitEvidence(
                address,
                agreementId,
                evidenceUrl,
                handleConnect
            );

            console.log("Submit evidence result:", result);

            if (result?.success === true) {
                console.log("Evidence submitted successfully.");

                setMessage("Evidence submitted successfully");

                // Save submission in supabase
                const { data: submission, error:saveError } = await supabase
                    .from("submissions")
                    .insert({
                        agreement_id: agreementId,
                        user_id: user.user_id,
                        evidence_url: evidenceUrl,
                        submission_hash: result.txHash,
                    })
                    .select()
                    .single();
                if (saveError) {
                    throw saveError;
                }
                console.log("new aubmission", submission);
                console.log("evidence id from insert", submission.evidence_id);
                const evidenceId = submission.evidence_id;

                setSubmissionId(evidenceId);
                //setSubmissionId(submission.evidence_id);
                console.log("submission id", submissionId);
                
                // Update Supabase agreements
                const {data:updateAgreement,  error: updateError } = await supabase
                    .from("agreements")
                    .update({
                        status: "EVIDENCE_SUBMITTED",
                    })
                    .eq("agreement_id", agreementId)
                    .select()
                    .single();

                //const submissionId = submission.evidence_id;

                if (updateError) {
                    throw updateError;
                }

                // Next step: verification
                await handleVerifyAgreement(evidenceId);
                setIsSubmitting(false);
                setIsVerifying(true);
                
                /*const verification = await verifyAgreement(
                    walletAddress,
                    agreementId,
                    handleConnect
                );

                console.log("Verification result:", verification );

                if (verification?.success === true) {

                    // Update both submissions and agreements
                    const { error: updateError } = await supabase.rpc("update_verification", {
                        p_agreement_id: agreementId,
                        p_evidence_id: submissionId,
                        p_result: verification.verificationResult,
                        p_reason: verification.verificationReason || "",
                        p_status:
                        verification.verificationResult === "FULFILLED"
                        ? "FULFILLED"
                        : verification.verificationResult === "REJECTED"
                        ? "REJECTED"
                        : "EVIDENCE_SUBMITTED",
                    });
                    if (updateError) {
                        console.error("Failed to update verification:", updateError);
                        setError("Verification completed, but database update failed.");
                        return;
                    }

                    if (verification.verificationResult === "FULFILLED") {
                        setMessage("Work verified successfully.");
                    }

                    else if (verification.verificationResult === "REJECTED") {
                        setError(verification.verificationReason || "Verification failed.");
                    }

                    else if (verification.verificationResult === "RETRY") {
                        setError(verification.verificationReason || "Verification could not be completed. Please submit new evidence.");
                    }
                } else if (verification?.status === "ERROR") {
                    setError(verification.errorMessage || "Verification failed to execute.");
                }*/


            } else {
                setError(result?.errorMessage || "Failed to submit evidence.");
            }
        } catch (err) {
            console.error("Submit evidence error:", err);
            setError(
                err?.message || "Failed to submit evidence."
            );
            setIsSubmitting(false);
            
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <>
            <DashboardHeader />
            <div className="submission_page">
                <h1>Submit work</h1>
                <small>Submit your completed project, wait for verification, get paid if verified.</small>
                <br /><br />
                
                {myAgreement ? (
                    <div className="submit_section">
                        <div className="to_submit">
                            <h3>ID: {myAgreement.agreement_id}</h3>
                            <div className="flex_box">
                                <div className="details_flex">
                                    <small className="flex_heading">Date Created</small> <br />
                                    <span>{formatDate(myAgreement.created_at)}</span>
                                </div>
                            

                                <div className="details_flex">
                                    <small className="flex_heading">Amount</small><br />
                                    <span>{myAgreement.amount} {" "} {myAgreement.currency}</span>
                                </div>
                            </div>
                            <br />
                            <div className="details_flex">
                                <small className="flex_heading">Description</small><br />
                                <span>{myAgreement.requirements}</span>
                            </div>
                        </div>
                        <br /><br />

                        <div className="submit_evidence">
                            <h2>Add evidence and supporting information.</h2>
                            <small>Please submit evidence of your work completion and wait for review and verification.</small>
                            <br />
                            
                            <form className="submit_form" >
                                <br />
                                {error && <p className="form_error">{error}</p>}
                                {message && <p className="form_success">{message}</p>}
                                {verifyMessage && <p className="form_success">{verifyMessage}</p>}
                                <label>URL link</label>
                                <br />
                                <input type="url" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://..." />
                                <br />
                                <br />

                                <button type="button" className="submit_evidence_btn" onClick={handleSubmitEvidence} disabled={isSubmitting}> {isSubmitting ? "Submitting..." : isVerifying ? "verifying..." : "Submit Evidence"}</button>
                                <br />

                                {/*<button type="button" onClick= {handleVerifyAgreement}>Verify</button>
                                <button type="button" onClick={updateVerification} >Update database</button>*/}
                                {canResumeVerification && (
                                    <div className="warning_div">
                                    <span className="warning_sign">⚠️ </span> <small>Evidence was submitted, but verification could not be confirmed... </small><br />
                                    <button type="button" className="resume_btn" onClick={handleResumeVerification} disabled={isVerifying}>
                                    {isVerifying ? "Verifying..." : "Resume Verification"}
                                    </button>
                                    </div>
                                )}

                            </form>
                        </div>
                    </div>
                ) : (
                    <>
                        <p>Loading Agreement</p>
                    </>
                )}
            </div>
            <Footer />
        </>
    );
}
export default Submission;
