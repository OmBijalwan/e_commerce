const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://ombijalwanEcommerce:hK8mDjYLdgtiuUkU@cluster0.pbqvh.mongodb.net/e-commerce", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;

