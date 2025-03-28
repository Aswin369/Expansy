const mongoose = require("mongoose")
const {Schema} = mongoose

const variantSchema = new mongoose.Schema({
    category:{
        type:String,
        required:true,
        enum:["Ram", "Storage", "Color"]
    },
    value:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    }
},{ timestamps: true })

const Variant = mongoose.model("Variant", variantSchema);

module.exports =  Variant
