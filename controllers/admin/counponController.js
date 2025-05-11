const User = require("../../models/userSchema")
const Coupon = require("../../models/couponSchema")
const moment = require('moment')
const StatusCode = require("../../constants/statusCode")


const getcouponList = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 4
        const skip = (page - 1)*limit
        const couponData = await Coupon.find({})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)

        const totalCoupons = await Coupon.countDocuments()

        const totalPages = Math.ceil(totalCoupons/limit)
        console.log("coupon data", couponData)
        res.render("couponList",{
            data:couponData,
            currentPage: page,
            totalPages:totalPages,
            totalCoupons:totalCoupons
        })
    } catch (error) {
        console.error("This error occur in couponList",error)
        res.redirect("/pageerror")
    }
}

const getCouponAddPage = async(req,res)=>{
    try {
        res.render("couponAdd")
    } catch (error) {
        console.error("This error occured in getCouponAddPage", error)
        res.redirect("/pageerror")
    }
}

const getCouponData = async(req,res)=>{
    try {
        console.log("this is req.bosy",req.body)
        const {startDate, endDate, couponCode, couponLimits, minDiscountValue, maxDiscountValue, discountValue} = req.body
        const ConvertstartDate =new Date(startDate)
        const convertexpirationDate = new Date(endDate)

        console.log("startdate", ConvertstartDate)
        console.log("enddate", convertexpirationDate)
        const couponData = new Coupon({
            code:couponCode,
            startDate:ConvertstartDate,
            expirationDate:convertexpirationDate,
            maxUsage:couponLimits,
            minDiscountValue:minDiscountValue,
            maxDiscountValue:maxDiscountValue,
            discountValue:discountValue
        })
        await couponData.save()
        return res.status(StatusCode.CREATED).json({success:true, message:"Coupon added successfully"})
    } catch (error) {
        console.error("This is occured in getCouponData", error)
        res.redirect("/pageerror")
    }
}

const banCoupon = async(req,res)=>{
    try {
        const couponId = req.params.id
        if(!couponId){
            res.redirect("/pageerror")
        }
        console.log("This is the code", couponId)
        const couponData = await Coupon.findOneAndUpdate({_id:couponId},{$set:{isActive:false}},{new:true})
        if(!couponData){
            res.redirect("/pageerror")
        }
        res.redirect("/admin/getCouponList")
        console.log("1")
    } catch (error) {
        console.error("This error occured in banCoupon",error)
        res.redirect("/pageerror")
    }
}

const unBanCoupon = async (req,res)=>{
    try {
        const couponId = req.params.id
        if(!couponId){
            res.redirect("/pageerror")
        }
        const couponData =  await Coupon.findOneAndUpdate({_id:couponId},{$set:{isActive:true}},{new:true})
        if(!couponData){
            res.redirect("/pageerror")
        }
        res.redirect("/admin/getCouponList")
    } catch (error) {
        console.error("This error occured in unBanCoupon",error)
        res.redirect("/pageerror")
    }
}

const getEditCoupon = async (req,res)=>{
    try {
        const couponId = req.params.id
        if(!couponId){
            res.redirect("/pageerror")
        }
        const coupondata = await Coupon.findOne({_id:couponId})
        console.log("dslfkj",coupondata)
        if(!coupondata){
            res.redirect("/pageerror")
        }
        res.render("couponUpdate",{
            data: coupondata
        })
    } catch (error) {
        console.error("This error occured in getEditCoupon", error)
        res.redirect("/pageerror")
    }
}

const updateCoupon = async(req,res)=>{
    try {
        console.log("sdlfjklas", req.body)
        const {startDate, endDate, couponCode, couponLimits, minDiscountValue, maxDiscountValue, discountValue, couponId} = req.body
        
        console.log("enddate", startDate)
        console.log("start date", endDate)
        if(!couponId){
            return res.status(StatusCode.BAD_REQUEST).json({success:false, message:"Coupon ID is required"})
        }

        const couponData = await Coupon.updateOne({_id:couponId},{$set:{
            code:couponCode,
            minDiscountValue:minDiscountValue,
            maxDiscountValue:maxDiscountValue,
            startDate:startDate,
            expirationDate:endDate,
            maxUsage:couponLimits,
            discountValue:discountValue
        }})

        if(!couponData){
            return res.status(StatusCode.BAD_REQUEST).json({success:false, message: "Something went wrong!, Not Updated please try again"})
        }
        console.log("23")
         res.status(StatusCode.CREATED).json({success:true,message: "Coupon update successfully"})

    } catch (error) {
        console.error("This is error occured in updateCoupon",error)
        res.redirect("/pageerror")
    }
}
module.exports = {
    getcouponList,
    getCouponAddPage,
    getCouponData,
    banCoupon,
    unBanCoupon,
    getEditCoupon,
    updateCoupon
}
