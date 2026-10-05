import {useState} from 'react';
import { useUser } from "../hooks/UserContext";
import { supabase } from "../lib/supabase";
import DashboardHeader from '../components/DashboardHeader.jsx';
import Footer from '../components/Footer.jsx';

function CreateOrder({closeOrder}) {
    const {user } = useUser();
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        budget: "",
        currency: "GEN",
        deadline: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    console.log("context passed", user);
    function handleForm(e) {
        const { name, value } = e.target;

        setFormData((prev) => ({...prev, [name]: value,}));
    }

    async function submitForm(e) {
        e.preventDefault();

        setError("");

        if (!user?.user_id) {
            setError("Profile not found.");
            return;
        }

        if (!formData.title.trim()) {
            setError("Please enter an order title.");
            return;
        }

        if (!formData.description.trim()) {
            setError("Please describe what you need.");
            return;
        }

        if (!formData.budget || Number(formData.budget) <= 0) {
            setError("Please enter a valid budget.");
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("orders")
                .insert({
                    customer_id: user.user_id,
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    budget: Number(formData.budget),
                    currency: formData.currency,
                    status: "OPEN",
                    deadline: formData.deadline,
                })
                .select()
                .single();

            if (error) {
                throw error;
            }
            setSuccess("Order successfully created");
            console.log("Order created:", data);
            setTimeout(() => {
                closeOrder();
            }, 4000);
        } catch (err) {
            console.error("Failed to create order:", err);
            setError(err.message || "Failed to create order.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <DashboardHeader />
            <div className= "create_order_page">
            <h1> Create an order<
/h1> 
			<div className="create_order_div">
                {/*<button onClick={closeOrder} id="close_btn"> X </button>*/}
                
                <form onSubmit={submitForm} >
                   
                    <label>What do you need?</label>
                    <br />
                    <input type="text" placeholder="Enter name of the project" name="title" value={formData.title} onChange={handleForm} />
                    <br />
                    <br />
                    <label>Description</label>
                    <br />
                    <textarea placeholder="Enter a description of what you want" name="description" value={formData.description} onChange={handleForm} rows={6} />
                    <br />
                    <br />
                    <label>Amount</label>
                    <br />
                    <input type="number" placeholder="Enter your budget amount" name="budget" value={formData.budget} onChange={handleForm} min="0" step="0.000001" />
                    <br />
                    <br />
                    <label>Currency</label>
                    <br />

                    <select name="currency" value={formData.currency} onChange={handleForm} >
                        <option value="GEN">GEN</option>
                    </select>
                    <br />
                    <br />
                    <label>Deadline</label>
                    <br />
                    <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleForm} />
                    <br />

                    {error && (<p className="form_error">
                        {error}
                        </p>
                    )}
                    {success && (<p className="form_success">{success}</p> )}
                    <br />
                    <br />

                    <button type="submit" disabled={loading} className="create_order_btn">{loading ? "Creating..." : "Create Order"}</button>
                </form>
            </div>
            
            </div>
            <Footer />
        </> 
    );
}

export default CreateOrder;

