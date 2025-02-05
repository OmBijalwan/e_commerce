import React, {createContext,useState,useEffect} from 'react';
import { toast } from 'react-hot-toast';
export const ShopContext = createContext(null);

const getDefaultCart =() =>{
    let cart={};
    for(let index=0;index<300+1; index++){
        cart[index]=0;
    }
    return cart;
}

const ShopContextProvider =(props) =>{
    const [all_product,setAll_Product] = useState([]);
    const [cartItems, setCartItems] = useState(getDefaultCart());
   
    useEffect(()=>{
        // fetch('http://localhost:4000/allproducts')
        fetch('https://e-commerce-3q3y.onrender.com/allproducts')
        .then((response)=>response.json())
        .then((data)=>setAll_Product(data));

    if(localStorage.getItem('auth-token')){
        // fetch('http://localhost:4000/getcart',{
        fetch('https://e-commerce-3q3y.onrender.com/getcart',{
            method:'POST',
            headers:{
                Accept:'application/form-data',
                'auth-token':`${localStorage.getItem('auth-token')}`,
                'Content-Type':'application/json',
            },
            body:"",
        }).then((response)=>response.json())
        .then((data)=>setCartItems(data));
    }
    },[])

    const addToCart =(itemId) =>{
        setCartItems((prev) => ({...prev,[itemId]:prev[itemId]+1}))
        if(localStorage.getItem('auth-token')){
           // fetch('http://localhost:400/addtocart',{
            fetch('https://e-commerce-3q3y.onrender.com/addtocart',{
                method:'POST',
                headers:{
                    Accept:'application/form-data',
                    'auth-token':`${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({"itemId":itemId}),   
            })
            .then((response)=>response.json())
            .then((data)=>console.log(data));
        }
    }
    const removeFromCart =(itemId) =>{
        setCartItems((prev) => ({...prev,[itemId]:prev[itemId]-1}));
        if(localStorage.getItem('auth-token')){
           // fetch('http://localhost:4000/removefromcart',{
            fetch('https://e-commerce-3q3y.onrender.com/removefromcart',{
                method:'POST',
                headers:{
                    Accept:'application/form-data',
                    'auth-token':`${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({"itemId":itemId}),   
            })
            .then((response)=>response.json())
            .then((data)=>console.log(data));
        }
    }

    const getTotalCartAmount =() =>{
        let totalAmount=0;
        for(const item in cartItems){
            if(cartItems[item]>0){
                let itemInfo = all_product.find((product) => product.id ===Number(item))
                totalAmount+= itemInfo.new_price * cartItems[item];
            }
           
        }
        return totalAmount;
    }

    const getTotalCartItems = () =>{
        let totalItem =0;
        for(const item in cartItems){
            if(cartItems[item]>0){
                totalItem+=cartItems[item];
            }
        }
        return totalItem;
    }
    const handlePayment = async () => {
        try {
            // Step 1: Create order on the backend
            const res = await fetch("https://e-commerce-3q3y.onrender.com/api/payment/order", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    amount: getTotalCartAmount() // Get the total cart amount
                })
            });
    
            const data = await res.json();
            console.log(data);
    
            // Step 2: Proceed with Razorpay payment after receiving order details
            handlePaymentVerify(data.data); // Pass order details to the verify function
        } catch (error) {
            console.log(error);
        }
    };
    
    // handlePaymentVerify Function: Handles Razorpay payment and verifies the payment
    const handlePaymentVerify = async (data) => {
        const options = {
            key: 'rzp_test_drkSRartjNmgLR', // Your Razorpay Key ID
            amount: data.amount, // Total amount in paise
            currency: data.currency, // Currency
            name: "E-Commerce",
            description: "Test Mode",
            order_id: data.id, // Order ID from Razorpay API response
            handler: async (response) => {
                console.log("response", response);
                try {
                    // Step 3: Verify payment on the backend after successful payment
                    const verifyRes = await fetch("https://e-commerce-3q3y.onrender.com/api/payment/verify", {
                        method: "POST",
                        headers: {
                            "content-type": "application/json"
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });
    
                    const verifyData = await verifyRes.json();
    
                    if (verifyData.message) {
                        // Show success message after verification
                        toast.success(verifyData.message);
                        setCartItems(getDefaultCart());
                    }
                } catch (error) {
                    console.log(error);
                }
            },
            theme: {
                color: "#5f63b8"
            }
        };
    
        // Open Razorpay payment window
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
    };
    
    
    const contextValue ={getTotalCartItems,getTotalCartAmount,all_product, cartItems,addToCart,removeFromCart,handlePayment};

    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;
