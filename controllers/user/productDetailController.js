const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")
const Brand = require("../../models/brandSchema")
const Category = require("../../models/categorySchema")
const StatusCode = require("../../constants/statusCode")
const Offer = require("../../models/offerSchema")

const productDetail = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.session.user;
        console.log("Product ID:", id);

        const allProduct = await Product.find({ isBlocked: false });

        const productData = await Product.findOne({ _id: id, isBlocked: false })
            .populate("brand")
            .populate({
                path: "category",
                populate: { path: "categoryOffer", model: "Offer" }, 
            })
            .populate({
                path: "productOffer",
                model: "Offer",
            })
            .populate({ path: "specification.ram", model: "Variant" })
            .populate({ path: "specification.storage", model: "Variant" })
            .populate({ path: "specification.color", model: "Variant" });

        if (!productData) {
            return res.status(StatusCode.NOT_FOUND).json({ error: "Product not found" });
        }

        
        const categoryOffer = productData.category?.categoryOffer?.discountValue || 0
        const categoryOfferId = productData.category?.categoryOffer?._id || null

        const productOffer = productData.productOffer?.discountValue || 0
        const productOfferId = productData.productOffer?._id || null;

        
        console.log("This is product offer", productOffer);
        console.log("categoryOffer",categoryOffer)

        let productOfferData;
        let categoryOfferData;

        let appliedOffer, appliedOfferType, appliedOfferId;
        if (productOffer > categoryOffer) {
            appliedOffer = productOffer;
            appliedOfferType = "product";
            appliedOfferId = productOfferId;
            productOfferData  = await Offer.findOne({_id:appliedOfferId})
        } else {
            appliedOffer = categoryOffer;
            appliedOfferType = "category";
            appliedOfferId = categoryOfferId;
            categoryOfferData  = await Offer.findOne({_id:appliedOfferId})
        }

        
        productData.specification = productData.specification.map(spec => {
            const discountAmount = (spec.regularPrice * appliedOffer) / 100;
            spec.discountPrice = Math.round(discountAmount)
            spec.salePrice = Math.round(spec.regularPrice - discountAmount)
            return spec;
        });

      

        console.log("appliedOfferId", appliedOfferId)
        res.render("productdetail", {
            user: user,
            productData,
            allProduct,
            appliedOffer,
            appliedOfferType, 
            appliedOfferId,
            productOfferData,
            categoryOfferData
        });

    } catch (error) {
        console.error("Error from product detail page", error);
        res.redirect("/pageerror");
    }
}




module.exports = {
    productDetail,
    
}