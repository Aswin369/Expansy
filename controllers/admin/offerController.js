const Product = require('../../models/productSchema')
const Category = require("../../models/categorySchema")
const Offer = require("../../models/offerSchema")
const StatusCode = require("../../constants/statusCode")

const getOfferList = async (req,res)=>{
    try {

        const page = parseInt(req.query.page) || 1
        const limit = 4
        const skip = (page - 1)*limit
        const offerData = await Offer.find({})
        .populate({path:"applicableProducts",select: "productName"})
        .populate({path: "applicableCategories",select: "name"})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)

        const totalOffers = await Offer.countDocuments()

        const totalPages = Math.ceil(totalOffers/limit)
        res.render("offerList",{
            data:offerData,
            currentPage: page,
            totalPages: totalPages,
            totalOffers: totalOffers
        })
    } catch (error) {
        console.error("This error occured in getOfferList",error)
        res.redirect("/pageerror")
    }
}

const getCreateOffer = async (req,res)=>{
    try {
        const productData = await Product.find({isBlocked:false})
        const categoryData = await Category.find({isListed:true})
        res.render("offerAdd",{
            productData,
            categoryData
        })
    } catch (error) {
        console.error("This error occured in getCreatOffer",error)
        res.redirect("/pageerror")
    }
}

const createOffer = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        let { start_date, end_date, offer_name, offer_type, offer_item, description, discount_value } = req.body;

       
        const formatDate = (dateString) => {
            const [day, month, year] = dateString.split("-");
            return new Date(`${year}-${month}-${day}`);
        };

        start_date = formatDate(start_date);
        end_date = formatDate(end_date);

     
        const offerData = new Offer({
            offerName: offer_name,
            startDate: start_date,
            expirationDate: end_date,
            discountValue: discount_value,
            description: description,
            applicableTo: offer_type,
            applicableProducts: offer_type === "product" ? offer_item : null,
            applicableCategories: offer_type === "category" ? offer_item : null
        });

    
        const savedOffer = await offerData.save();
        console.log("Offer saved successfully:", savedOffer);

        
        if (offer_type === "product") {
            console.log("Applying product offer...");
            const productOffer = await Product.findByIdAndUpdate(
                offer_item,
                { $set: { productOffer: savedOffer._id } },
                { new: true }
            );

            if (!productOffer) {
                return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "Product not found" });
            }
            console.log("Product offer updated successfully");

        } else if (offer_type === "category") {
            console.log("Applying category offer...");
            const categoryOffer = await Category.findByIdAndUpdate(
                offer_item,
                { $set: { categoryOffer: savedOffer._id } },
                { new: true }
            );

            if (!categoryOffer) {
                return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "Category not found" });
            }
            console.log("Category offer updated successfully");
        }

        res.status(StatusCode.CREATED).json({ success: true });
    } catch (error) {
        console.error("Error in createOffer:", error);
        res.redirect("/pageerror");
    }
};


const banOffer = async(req,res)=>{
    try {
        console.log("asdkfjas",req.params.id)
        const offerId = req.params.id
        if(!offerId){
            res.redirect("/pageerror")
        }
        const updatedOffer = await Offer.findOneAndUpdate({_id:offerId},{$set:{isActive:false}},{new:true})
        console.log("skafh")
        if(!updatedOffer){
            res.redirect("/pageerror")
        }
        res.redirect("/admin/getOfferList")

    } catch (error) {
        console.error("This error occured in banOffer", banOffer)
        res.redirect("/pageerror")
    }
}

const unBanOffer = async (req,res)=>{
    try {
        const offerId = req.params.id
        if(!offerId){
            res.redirect("/pageerror")
        }
        const offerData = await Offer.findOneAndUpdate({_id:offerId},{$set:{isActive:true}},{new:true})
        if(!offerData){
            res.redirect("/pageerror")
        }
        res.redirect("/admin/getOfferList")
    } catch (error) {
        console.error("This error occured in unBanOffer",error)
        res.redirect("/pageerror")
    }
}

const getEditOffer = async (req,res)=>{
    try {
        const offerId = req.params.id
        console.log("sdafasdfasgsdfgsdfg",offerId)
        if(!offerId){
            res.redirect("/pageerror")
        }
        const offerData = await Offer.findOne({_id:offerId})
        const productData = await Product.find({isBlocked:false})
        const categoryData = await Category.find({isListed:true})
        console.log("offerdatea",offerData)
        if(!offerData){
            res.redirect("/pageerror")
        }
        res.render("offerEdit",{
            offerData,
            productData,
            categoryData
        })
    } catch (error) {
        console.error("This error occured in getEditOffer",error)
        res.redirect("/pageerror")
    }
}

const editOffer = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const { start_date, end_date, offer_name, offer_type, offer_item, description, discount_value, offerId } = req.body;

        if (!offerId) {
            return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "Cannot find offerId" });
        }

        
        const formatDate = (dateString) => {
            const [day, month, year] = dateString.split("-");
            return new Date(`${year}-${month}-${day}`);
        };
        
        const updateData = {
            offerName: offer_name,
            description: description,
            discountValue: discount_value,
            applicableTo: offer_type,
            startDate: formatDate(start_date), 
            expirationDate: formatDate(end_date), 
            applicableProducts: offer_type === "product" ? offer_item : null,
            applicableCategories: offer_type === "category" ? offer_item : null,
        };
        

   
        const updatedOffer = await Offer.findByIdAndUpdate(offerId, { $set: updateData }, { new: true });
        if (!updatedOffer) {
            return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "Offer update failed, please try again" });
        }
        console.log("Offer updated successfully:", updatedOffer);

       
        if (offer_type === "product") {
            console.log("Updating product offer...");
            const updateProductOffer = await Product.findByIdAndUpdate(
                offer_item,
                { $set: { productOffer: offerId } }, 
                { new: true }
            );

            if (!updateProductOffer) {
                return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "Product not found, select another product" });
            }
            console.log("Product offer updated successfully");

        } else if (offer_type === "category") {
            console.log("Updating category offer...");
            const updateCategoryOffer = await Category.findByIdAndUpdate(
                offer_item,
                { $set: { categoryOffer: offerId } },
                { new: true }
            );

            if (!updateCategoryOffer) {
                return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "Category not found, select another category" });
            }
            console.log("Category offer updated successfully");
        }

        res.status(StatusCode.OK).json({ success: true });
    } catch (error) {
        console.error("Error in editOffer:", error);
        res.redirect("/pageerror");
    }
};


module.exports = {
    getOfferList,
    getCreateOffer,
    createOffer,
    banOffer,
    unBanOffer,
    getEditOffer,
    editOffer
}