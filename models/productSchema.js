const { ServerDescription } = require("mongodb")
const mongoose = require("mongoose")
const {Schema} = mongoose

const productSchema = new mongoose.Schema({
    productName:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    brand:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    battery:{
        type: String,
        required:true
    },
    displaySize:{
        type: String,
        required:true
    },
    productOffer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        
    },
    productImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    specification:[{
        ram:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Variant",
            required:true
        },
        storage:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Variant",
            required:true
        },
        color:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Variant",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        regularPrice:{
            type:Number,
            required:true
        },
        salePrice:{
            type:Number,
            required:true
        }
    }],
    processor:{
        type:String,
        required:true
    }, 
    status:{
        type:String,
        enum:["Available","out of stock", "Discountinued"],
        required:true,
        default:"Available"
    }
},{timestamps:true})

const Product = mongoose.model("Product",productSchema)

module.exports = Product