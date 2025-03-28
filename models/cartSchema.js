const mongoose = require("mongoose");
const {Schema} = mongoose 

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", 
            required: true
        },
        offerApplied:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offer", 
        },
        specId: {  
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        quantity: {
            type: Number,
            default: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number
        },
        discountPriceforThisProduct:{
            type: Number
        }
    }]
});

const Cart = mongoose.model("Cart",cartSchema)

module.exports = Cart
