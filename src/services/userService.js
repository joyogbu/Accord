import { supabase } from "../lib/supabase";

export async function initializeUser(address, setUser) {
    try {
        const wallet_address = address.toLowerCase();
        //check if the wallet already has a user
        const {data: user, error: fetchError} = await supabase.from("users").select("*").eq("user_wallet", wallet_address).maybeSingle();

        console.log("data", user);
        console.log("Error", fetchError);

        if(fetchError) {
           throw fetchError;
        }

        //check existing user
        if(user) {
            setUser(user);
                
            return user;
        }

        //first time user
        const username = `user_${wallet_address.slice(2, 10)}`

        const {data:newUser, error:insertError} = await supabase
            .from("users")
            .insert({"user_wallet": wallet_address, "user_name": username})
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        setUser(newUser);   
        return newUser;
    } catch(error) {
        console.error("Failed ti initialize user:", error);
        throw error;
    }
}
