const mongoose = require('mongoose')

const offerSchema = mongoose.Schema({
     offerName:{
        type:String,
        required:true
     },
     description:{
        type:String
     },
     discountValue:{
        type:Number,
       required:true
     },
     applicableTo:{
         type:String,
         required:true,
         enum:["product","category"]
     },
     applicableProducts:{
        type:mongoose.Types.ObjectId,
        ref:'Product',
        required:function (){
           return this.applicableTo == 'product'
        }
     },
     applicableCategories:{
        type:mongoose.Types.ObjectId,
        ref:"Category",
        required:function (){
            return this.applicableTo == 'category'
        }
     },
     startDate:{
        type:Date,
        required:true
     },
     expirationDate:{
        type:Date,
        required:true
     },
     isActive:{
        type:Boolean,
        default:true
     }
},{
    timestamps:true
})

const Offer = mongoose.model('Offer',offerSchema)
module.exports = Offer