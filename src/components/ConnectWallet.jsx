import { useWallet } from '../hooks/useWallet';
import jopay from '../images/jopay.jpg';
function ConnectWallet({ closeModal }) {
    const {handleConnect, address, isConnected, disconnect, chainId, } = useWallet();
    return (
        <div className="modal_overlay">
            <div className="modal_box">
                <button type="button" className="close_modal" onClick={closeModal}>X</button>
                <br />
                <div className="logo_div1">
                    <div className="logo_div2">
                        <img className="logo_img" src={jopay} />
                    </div>
                </div>
                <br />
                <h2 className="modal_text_heading">Welcome to Accord</h2>
                <p className="modal_text">Please connect your wallet, and choose a role to begin</p>
                <button type="button" id="wallet_connect" onClick={handleConnect}>Connect Wallet</button>
                {isConnected && <p>{address}</p>}
                <br />
                <br />
                <small className="modal_text">Please use metamask for now</small>
            </div>
        </div>
    );
}

export default ConnectWallet;
