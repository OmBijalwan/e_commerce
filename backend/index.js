require("dotenv").config();
const port =4000;
const express =require("express");
const app= express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors= require("cors");
//changes
const Razorpay = require("razorpay");                                               
const connectDB = require("./database/db");

const Product = require("./models/Product");
const Users = require("./models/User");
const Payment = require("./models/Payment");
const payment =require("./routes/payment") 
connectDB();
//

app.use(express.json());
app.use(cors());

// // Databse Connected to Mongo db atlas
// mongoose.connect("mongodb+srv://ombijalwanEcommerce:hK8mDjYLdgtiuUkU@cluster0.pbqvh.mongodb.net/e-commerce")

//API creation

app.get("/",(req,res) =>{
    res.send("Express APP is running ");
})

// Image storage Engine
const storage= multer.diskStorage({
    destination:'./upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({storage:storage});

//creating upload endpoint for images
app.use('/images',express.static('upload/images'));

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        // image_url:`http://localhost:${port}/images/${req.file.filename}`
        image_url:`https://e-commerce-3q3y.onrender.com/images/${req.file.filename}`
    });
});

// Schema for crwating Products

// const Product = mongoose.model("Product",{
//     id:{
//         type:Number,
//         required:true,
//     },
//     name:{
//         type:String,
//         required:true,
//     },
//     image:{
//         type:String,
//         reqired:true,
//     },
//     category:{
//         type:String,
//         required:true,
//     },
//     new_price:{
//         type:String,
//         required:true,
//     },
//     old_price:{
//         type:Number,
//         required:true,
//     },
//     date:{
//         type:Date,
//         default:Date.now,
//     },
//     available:{
//         type:Boolean,
//         default:true,
//     },
// })

app.post('/addproduct',async(req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length >0){
        let last_product_array =products.slice(-1);
        let last_product = last_product_array[0];
        id= last_product.id + 1;
    }
    else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
        date:req.body.date,
        available:req.body.available
    });
    console.log(product);
    await product.save();
    console.log("saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

//creating API for deleting Products

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

//creating api for all products 
app.get('/allproducts',async(req,res)=>{
    let products = await Product.find({});// Here we will gwt all the products 
    console.log("ALl PRoducts Fetched");

    res.send(products);
})

// const Users = mongoose.model('Users',{
//     name:{
//         type:String,
//     },
//     email:{
//         type:String,
//         unique:true,
//     },
//     password:{
//         type:String,
//     },
//     cartData:{
//         type:Object,
//     },
//     date:{
//         type:Date,
//         default:Date.now,
//     }
// })

// Creating Endpoint for registering the user

app.post('/signup',async(req,res)=>{
    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"exisiting user found with same email id "});
    }
    let cart = {};
    for(let i=0;i<300;i++){
        cart[i]=0;
    }

    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();

    const data ={
        user:{
            id:user.id
        }
    }

    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true,token})
})

//creating endpoint for user login
app.post('/login',async (req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password ===user.password;
        if(passCompare){
            const data ={
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"Wrong PAssword"});
        }
    }
    else{
        res.json({success:false, errors:"Wrong Email Id"});
    }
})

//creatind endpoint for new collection data
app.get('/newcollections',async(req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection fetched");
    res.send(newcollection);
})
// creating endpoint for popular in women section 
app.get('/popularinwomen',async(req,res)=>{
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0,4);
    console.log("Popular in Women Fetched");
    res.send(popular_in_women);
})

//creating middleware to fetch user

const fetchUser = async (req,res,next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"PLease authenticate using valid token "})
    }
    else{
        try{
            const data = jwt.verify(token,'secret_ecom');
            req.user = data.user;
            next();
        }catch(error){
            res.status(401).send({errors:"Please authenticate using a token "})
        }
    }
}
// creating endpoint for adding products in cartdata
app.post('/addtocart',fetchUser,async (req,res)=>{
    console.log("added",req.body.itemId);
   let userData = await Users.findOne({_id:req.user.id});
   userData.cartData[req.body.itemId]+=1;
   await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
   res.send("Added")
})

//creating endpoint to remove product from cartData

app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log("removed",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId]-=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})

//creating end point to get cartdata
app.post('/getcart',fetchUser, async (req,res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

//change
app.use('/api/payment',payment);

app.listen(port,(error)=>{
    if(!error){
        console.log("Server is running on "+ port);
    }
    else{
        console.log("Error: " + error);
    }
})
