const mongoose = require("mongoose")
const {Schema} = mongoose

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: false
    },
    description: {
        type: String,
        required: true
    },
    isListed: {
        type: Boolean,
        default: true
    },
    categoryOffer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        required:false
    },
    image: {
        type:String
    }
},{timestamps:true})


const Category = mongoose.model("Category",categorySchema)
module.exports = Category
