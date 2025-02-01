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
    regularPrice:{
        type:Number,
        required:true,
    },
    salePrice:{
        type:Number,
        required:true
    },
    productOffer:{
        type:Number,
        default:0, 
    },
    quantity:{
        type:Number,
        required:true
    },
    stocks:{
        type:String,
        require:true
    },
    color:{
        type:String,
        required:true
    },
    productImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    ram:{
        type:String,
        required:true
    },
    storage:{
        type:String,
        required:true
    },
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