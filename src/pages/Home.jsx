import { useState } from "react";
import { useWallet } from '../hooks/useWallet';
import { FaArrowRight, FaFileContract, FaCheck, FaMoneyBill, FaLock } from 'react-icons/fa';
import { agreementExists } from "../lib/genlayer";
import ConnectWallet from "../components/ConnectWallet.jsx";
import Footer from '../components/Footer.jsx';

function Home() {
    const {handleConnect, address, isConnected, disconnect, chainId, } = useWallet();

    const [isOpen, setIsOpen] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const[isModal, setIsModal] = useState(false);
    function showModal() {
        setIsModal(true);
    }
    function closeModal() {
        setIsModal(false);
    }
    function toggle() {
        setIsOpen(!isOpen);
    }

    async function checkAgreement() {
        try {
            setLoading(true);
            const exists = await agreementExists("ORD-002");

            setResult(exists);
        } catch (error) {
            console.error("Contract read failed:", error);
            setResult("ERROR");
        } finally {
            setLoading(false);
        }
    } 



    /*{!isConnected ? (
        <button onClick={handleConnect}>
          Connect Wallet
        </button>
      ) : (
        <>
          <p>Wallet: {address}</p>
          <p>Chain ID: {chainId}</p>
                                                   <button onClick={disconnect}>              Disconnect                             </button>                              </>                                    )}                                                                                <button onClick={checkAgreement}>          {loading ? "Checking..." : "Check ORD-002"}                                     </button>                                                                         {result !== null && (                      <p>                                        Agreement exists: {String(result)}                                              </p>                                   )}*/


    return (
        <div id="landing_div">
            {isOpen && <nav className="navbar"> <button type="button" className="menu_link_close_btn" onClick={toggle}>X</button>
                <br />
                <ul className={`menu_links ${isOpen ? 'show_link' : '' }`}>
                    <li><a href="#how-it-works">How it works</a></li>
                    <br />
                    <li><a href="/#demo">Request a demo</a></li>
                    <br />
                    <li><a href="#">Docs</a></li>
                    <br />
                </ul>
            </nav>}
            <div className="landing_menu_div">
                <div className="landing_menu landing_logo">
                    <img src="#" className="landing_logo_img" />
                </div>
                <div className=" landing_menu nav_links desktop_only">
                    <a href="#how-it-works">How it works</a>
                    <a href="#Request-a-demo">Request a demo</a>
                    <a href="#">Docs</a>
                </div>
                <div className="landing_menu start_here nav_actions">
                    <div className="btn_flex"><button className="menu_start">Log In</button><span className="flex_arrow"><FaArrowRight /></span></div>

			        <div className="landing_menu_bar">
                        <button className="landing_menu_btn" onClick={toggle}>☰</button>
                    </div>
                </div>

		    </div>
			<div id="landing_one">
            <br />
                <h1 className="heading_1">Work. Get paid when it is verified </h1>
            
                <h2>Trusted Agreement. Automated Escrow</h2>
                <p className="heading_2">Accord uses Intelligent Contracts to hold agreements, evaluate completion, and automate escrow settlement.</p>
                <br />
                <div className="call_to_action_btns">
                    <div className="btn_flex flex_a"><button className="landing_bttn _start" onClick={showModal}>Accept Order</button><span className="btn_arrow"><FaArrowRight /></span></div>

                    <br />
                    <div className="btn_flex flex_b"><button className="landing_bttn _demo" onClick={showModal}>Create Order </button><span className="btn_arrow"><FaArrowRight /></span></div>
                    {isModal && <ConnectWallet closeModal = {closeModal} />}
                </div>
                <br />
                <small>Work &bull; Verify &bull; Pay</small>
            </div>
            <br />
            <div id="how-it-works">
                <div id="how_a">
                    <h2 classname="how">A BETTER WAY TO WORK TOGETHER</h2>
                    <h2 className="how">How it works</h2>
                </div>
                <div className="landing_feature">
                    <br />
                    <div className="feature_img">
                        <FaFileContract />
                    </div>
                 
                    <h3 className="heading_3 text_chaange_b">Create an Agreement</h3>
                    <p className="feature_text">The customer creates an order, and the merchant agree on the work, requirements, amount, and deadline.</p>
                </div>
                
                <div className="landing_feature">
                    <br />
                    <div className="feature_img">
                        <FaLock />
                    </div>
                   
                    <h3 className="heading_3 text_chaange_b">Fund the Escrow</h3>
                    <p className="feature_text">The customer funds the agreement, securing the payment in an escrow before work begins.</p>
                </div>
                
                <div className="landing_feature">
                    <br />
                    <div className="feature_img">
                        <img className="feature_image" src="#" />
                    </div>
                    
                    <h3 className="heading_3 text_chaange_b">Complete the Work</h3>

                    <p className="feature_text">The merchant delivers the agreed work and submits evidence of completion.</p>
                </div>

                <div className="landing_feature">
                    <br />
                    <div className="feature_img">
                        <FaCheck />
                    </div>
                    
                    <h3 className="heading_3 text_chaange_b">Verify the Agreement</h3>

                    <p className="feature_text">Intelligent Contract evaluates the submitted evidence against the original requirements.</p>
                </div>

                <div className="landing_feature">
                    <br />
                    <div className="feature_img">
                       <FaMoneyBill />
                    </div>
                    
                    <h3 className="heading_3 text_chaange_b">Settle Payment Automatically</h3>

                    <p className="feature_text">If the work is verified, the escrow is released to the service provider. If the work is rejected, the funds can be returned according to the agreement rules.</p>
                </div>
            </div>
            <br />
        
            <div id="content_section">
                <h2>BUILT FOR PERFORMANCE-BASED WORK.</h2>
                <h2>What it means</h2>

                <div id="for_customers">
                    <h2>For Customers</h2>
                    <p>Pay with confidence.</p>
                    <ul>
                        <p className="feature_text"><li>Your funds are secured in escrow while the work is being completed.</li></p>

                        <p className="feature_text"><li>You don't have to rely solely on promises.</li></p>
                        <p className="feature_text"><li>The agreement defines what must be delivered and provides a structured process for verification and settlement.</li></p>
                    </ul>
                    
                    <button type="button" className="action_btn" onClick={showModal}>Create an Order</button>
                    <br />
                    <br />
                </div>
                <div id="for_merchants">
                    <h2>For Merchants</h2>
                        <p>Know that the payment is secured.</p>
                    <ul>

                        <p className="feature_text"><li>Once an agreement is funded, the payment is committed to the contract.</li></p>

                        <p className="feature_text"><li>Complete the agreed work, submit your evidence, and let the verification process determine whether the conditions for payment have been satisfied.</li></p>
                    </ul>
                    
                    <button type="button" className="action_btn" onClick={showModal}>Accept an Order</button>
                    <br />
                    <br />
                </div>
            </div>
            <br />
            <div className="closing_cta">
                <h2>From smart contracts to contracts that can evaluate work, turn agreements into outcomes.</h2>

                <p className="feature_text">Create a performance-based agreement, secure the payment, and let intelligent verification handle the settlement.</p>
                <br />
                <p><button className="closing_btn" type="button" onClick={showModal}>Create Your First Agreement</button></p>
            </div>
            
            <Footer />
        </div>

    );
}
export default Home;
