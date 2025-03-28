const mongoose = require("mongoose");
const Whishlist = require("../../models/whishlistSchema")
const Cart = require("../../models/cartSchema")

const getWhishList = async (req,res)=>{
    try {
        const userId = req.session.user
        console.log("useridasdfa",userId)
        const userWhishlist = await Whishlist.findOne({userId:userId})
        .populate("products.productId")
        console.log("alsdfjklkjasdfjklf",userWhishlist)
        if(!userWhishlist){
            return res.render("wishList",{
                whishList: []
            })
        }
        res.render("wishList", { 
            whishList:userWhishlist.products
        })
    } catch (error) {
        console.error("Error occured in getWhishList",error)
        res.redirect("/pagerror")
    }
}

const addTOWhishlistFromProductDetail = async (req,res)=>{
    try {
        if(!req.session.user){
            return  res.status(401).json({success:false ,message : "Login first"})
          }
          const userId = req.session.user
        console.log("kjf",req.body)
        const {productId} = req.body
        
        let userWhishlist = await Whishlist.findOne({userId:userId})
        
        if(userWhishlist){
            const productExists = userWhishlist.products.some(p => p.productId.equals(productId));
            if (productExists) {
                return res.status(400).json({ success: false, message: "Product already in wishlist" });
            }
            userWhishlist.products.push({ productId })
            await userWhishlist.save()
            return res.status(201).json({success:true, message:"WhishList added"})
        }

        let whishListSave = new Whishlist({
            userId:userId,
            products:[{productId}]
        })
        await whishListSave.save()
        return  res.status(200).json({success:true, message: "whishlist added"})
    } catch (error) {
        console.error("This error occured in addTOWhishlistFromProductDetail",error)
        res.redirect("/pageerror")
    }
}

const deleteWhishlist = async (req,res)=>{
    try {
        const userId = req.session.user
        const whishListProductId = req.params.id
        console.log("asjfhajsghf", whishListProductId)
        const whishListDelete = await Whishlist.findOneAndUpdate({userId:userId},{$pull:{products:{_id:whishListProductId}}},{new:true})
        console.log("afdasfdasfd",whishListDelete)
        if(!whishListDelete){
            return res.redirect("/pageerror")
        }
        return res.redirect("/getWhishlist")
    } catch (error) {
        console.error("This error occured in deleteWhishlist",error)
        res.redirect("/pageerror")
    }
}


const addToCartFromWhishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId, specificationId, wishlistId, quantity, price } = req.body;

        console.log("wishlistId", req.body);

        const newCartDetail = {
            productId: productId,
            specId: specificationId,
            quantity: 1,
            unitPrice: price,
            totalPrice: price
        };

        let cartDetail = await Cart.findOne({ userId: userId });
        
        
        console.log("Jhdf",cartDetail)

        if (cartDetail) {
            const existingItem = cartDetail.items.find(item => item.productId.toString() === productId);
            console.log("exist in cart", existingItem);
            if (existingItem) {
                return res.status(400).json({ success: false, message: "Product already in cart" });
            }
            // Push new item into the existing cart
            cartDetail.items.push(newCartDetail);
            await cartDetail.save();
        } else {
            // Create a new cart if none exists
            cartDetail = new Cart({
                userId: userId,
                items: [newCartDetail]
            });
            await cartDetail.save();
        }
     
        

        console.log("Cart Updated", req.body);

        
        const whishListDetails = await Whishlist.updateOne({userId: new mongoose.Types.ObjectId(userId)},{$pull:{products:{_id:new mongoose.Types.ObjectId(wishlistId)}}})

        console.log("Wishlist Update Result:", whishListDetails);

        
        if (whishListDetails.modifiedCount === 0) {
            return res.status(400).json({ success: false, message: "Wishlist item not found or already removed" });
        }

        return res.status(201).json({ success: true });

    } catch (error) {
        console.error("Error in addToCartFromWhishlist", error);
        res.redirect("/pageerror");
    }
};


module.exports = {
    getWhishList,
    addTOWhishlistFromProductDetail,
    deleteWhishlist,
    addToCartFromWhishlist
}