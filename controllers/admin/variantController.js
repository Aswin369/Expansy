const express = require("express")
const Variant = require("../../models/variantSchema")
const { findByIdAndUpdate, updateOne } = require("../../models/userSchema")


const getVariantList = async (req,res)=>{
    try {
        const ramData = await Variant.find({category:"Ram"})
        const StorageData = await Variant.find({category:"Storage"})
        const colorData = await Variant.find({category:"Color"})
        res.render("variant",{
            ramData,
            StorageData,
            colorData
        })
        
    } catch (error) {
        console.error("Error in gettingVariant Page",error)
        res.redirect("/pageerror")
    }
}

const getAddVariant = async (req,res)=>{
    try {
        res.render("addVariant")
    } catch (error) {
        console.error("Error found in getAddVariant", error)
        res.redirect("/pageerror")
    }
}

const addVariants = async (req,res)=>{
    try {
        const {variantType, variantValue, variantPrice} = req.body
        if(!variantType || !variantValue || !variantPrice){
            return res.status(400).json({message:"variantType, VariantValue and VariantPrice are required"})
        }

        const newVariant = new Variant({
            category:variantType,
            value:variantValue,
            price:variantPrice
        })

        console.log("new is going to add",newVariant)
        console.log("1")
        await newVariant.save()
        return res.json({message: "Variant is added successfully"})
        
    } catch (error) {
        console.error("Error in add variant",error)
        res.redirect("/pageerror")
    }
}

const blockRam = async (req, res) => {
    try {
        const id = req.params.id;
        console.log("This is my blockRam", id);
        await Variant.findByIdAndUpdate(id,{$set:{isBlocked:true}});
        res.redirect("/admin/getVariant");
    } catch (error) {
        console.error("Error blocking RAM:", error);
        res.redirect("/pageerror");
    }
};

const UnBlockRam = async (req, res) => {
    try {
        const id = req.params.id;
        console.log("This is unblocked id", id);
        await Variant.findByIdAndUpdate(id,{$set:{isBlocked:false}});
        res.redirect("/admin/getVariant");
    } catch (error) {
        console.error("Error unblocking RAM:", error);
        res.redirect("/pageerror");
    }
};

const deleteVariant = async(req,res)=>{
    try {
        const id = req.params.id
        await Variant.deleteOne({_id:id})
        res.redirect("/admin/getVariant")
        console.log('Delete',id)
    } catch (error) {
        
    }
}

const blockedStorage = async(req,res)=>{
    try {
        const id = req.params.id
        await Variant.findByIdAndUpdate(id,{$set:{isBlocked:true}})
        res.redirect("/admin/getVariant")
        console.log("blockedStorage", id)
    } catch (error) {
        console.error("Error from BlockStorage",error)
        res.redirect('/pageerror')
    }
}

const unBlockStorage = async(req,res)=>{
    try {
        const id = req.params.id

        await Variant.findByIdAndUpdate(id,{$set:{isBlocked:false}}) 
        res.redirect("/admin/getVariant")
        console.log("unBlockStorage", id)
    } catch (error) {
        console.error("Error from unBlockStorage",error)
        res.redirect('/pageerror')
    }
}

const deleteStorage = async (req,res)=>{
    try {
        const id = req.params.id
        if(!id){
            res.redirect("/pageerror")
        }
        await Variant.deleteOne({_id:id})
        res.redirect("/admin/getVariant")
    } catch (error) {
        console.error("Error from in deleteStorage",error)
        res.redirect("/pageerror")
    }
}

const deleteColor = async(req,res)=>{
    try {
        const id = req.params.id
        console.log("This delectdjfk",id)
        if(!id){
            res.redirect("/pageerror")
        }

        await Variant.deleteOne({_id:id})
        console.log("!")
        res.redirect("/admin/getVariant")

    } catch (error) {
        console.error("This error occured in delete color function",error)
        res.redirect("/pageerror")
    }
}

const unBlockColor = async(req,res)=>{
    try {
        const id = req.params.id
        console.log("Unblock id", id)
        if(!id){
            res.redirect("/pageerror")
        }

        await Variant.updateOne({_id:id},{$set:{isBlocked:false}})
        console.log("unblocked seussesd")
        res.redirect("/admin/getVariant")
    } catch (error) {
        
    }
}

const blockColor = async(req,res)=>{
    try {
        const id = req.params.id
        console.log("block id", id)
        if(!id){
            res.redirect("/pageerror")
        }
        await Variant.updateOne({_id:id},{$set:{isBlocked:true}})
        console.log("blocked seussesd")
        res.redirect('/admin/getVariant')
    } catch (error) {
        
    }
}

module.exports = {
    getVariantList,
    addVariants,
    getAddVariant,
    blockRam,
    UnBlockRam,
    deleteVariant,
    blockedStorage,
    unBlockStorage,
    deleteStorage,
    deleteColor,
    unBlockColor,
    blockColor
}