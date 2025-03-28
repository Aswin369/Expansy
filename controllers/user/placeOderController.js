
const Address = require("../../models/addressSchema")
const User = require("../../models/userSchema")

const getPlaceOrderPage = async(req,res)=>{
    try {
        res.render("checkoutPage")
    } catch (error) {
        console.error("This error occured in getPlaceOrderPage",error)
        res.redirect("/pageerror")
    }
}

const checkOutAddAddress = async (req,res)=>{
    try {
        console.log("thksd",req.body)
        const userId = req.session.user
        const {addressType, city,landMark, state,pincode, phone, altPhone} = req.body

        const address = {
            addressType:addressType,
            city:city,
            landMark:landMark,
            state:state,
            pincode:pincode,
            phone:phone,
            altPhone:altPhone
        }

        const addressDetails = await Address.findOne({userId:userId})

        if(addressDetails){
            await Address.updateOne({userId:userId},{$push:{address:address}})
            return res.status(200).json({success:true, message:"Address addedd successfully"})
        }else{
            const newAddress = new Address({
                userId,
                address: [address]
            })
            await newAddress.save()
            return res.status(201).json({success:true, message:"New address added successfully"})
        }
    } catch (error) {
        console.error("THis error occured in checkOutAddAddress",error)
        res.redirect("/pageerror")
    }
}

module.exports = {
    getPlaceOrderPage,
    checkOutAddAddress
}
