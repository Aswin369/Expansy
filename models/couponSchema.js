const mongoose = require("mongoose")
const {Schema} = mongoose

const CouponSchema = mongoose.Schema({
    code:{
        type:String,
        required:true
    },
    minDiscountValue:{
        type:Number,
        required:true
    },
    maxDiscountValue:{
        type:Number,
        required:true
    },
    startDate:{
        type:Date,
        required:true
    },
    expirationDate:{
        type:Date,
        required:true
    },
    maxUsage:{
        type:Number,
        required:true
    },
     currentUsage:{  // To know current usage
        type:Number,
        default:0
    },
    discountValue: {
        type: Number,
        required:true
      },
    isActive:{
        type:Boolean,
        default:true
    }
},{
    timestamps:true
})

const Coupon = mongoose.model("Coupon", CouponSchema);
module.exports = Coupon;
