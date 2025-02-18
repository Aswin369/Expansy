const User = require("../../models/cartSchema")
const Product = require("../../models/productSchema")
const Cart = require("../../models/cartSchema")

const getShoppingCart = async(req,res)=>{
    try {
        const userId = req.session.user
        
        const cartUser = await Cart.findOne({userId}).populate("items.productId")
        console.log("dskhflkash", cartUser)
        res.render("shoppingCart",{
            cartData:cartUser
        })
    } catch (error) {
        console.error("Error found in shopping cart", error)
    }
} 

const productAddToCart = async(req,res)=>{
    try {
         
        if(!req.session.user){
          return  res.redirect("/login")
        }
        const userId = req.session.user
        const {productId, quantity, price, selectedSpecId} = req.body
        console.log("This is user id",userId)
        console.log("KTHis sdfkasdfhaif",req.body)
        if(quantity<=0){
            return res.status(400).json({success:false, message:"quantity cannot be zero"})
        }
        if(!userId){
             return res.status(400).json({success:false, message:"User not found"})
        }

        if(!productId){
            return res.status(400).json({success:false, message: "Please try again"})
        }
        const productDetail = await Product.findOne({_id:productId})

        const totalPiceOfProduct = price*quantity
        console.log("totalPiceOfProduct",totalPiceOfProduct)
        const cartDart = {
            productId: productId,
            quantity: quantity,
            price: price,
            totalPrice: totalPiceOfProduct,
            specId:selectedSpecId
        }
        const userCart = await Cart.findOne({userId})

      
        if(userCart){
            userCart.items.push(cartDart)
            await userCart.save()
            return res.status(201).json({success:true, message:"Product saved to cart"})
        }else{
            const newCart = new Cart({
                userId: userId,
                items: [cartDart]
            })
            await newCart.save()
           
            return res.status(201).json({success:true, message:"Product saved to cart"})
        }

    } catch (error) {
        console.error("This error occured in productAddToCart", error)
        res.redirect("/pageerror")
    }
}

const deleteProductFromCart = async(req,res)=>{
    try {
        const userId = req.session.user
        const productId = req.params.productId
        if(!productId){
            return res.status(400).json({success:true, message:"There is no product please add any product to cart"})
        }
        console.log("1");
        
        const updateCart = await Cart.findOneAndDelete({userId}, {$pull:{items:{_id:productId}}},{new:true})

        console.log("thskdfk",updateCart)

        if(!updateCart){
            return res.status(400).json({success:false, message:"Please add a product to cart"})
        }

        res.status(201).json({success:true, message:"Product deleted successfully"})

    } catch (error) {
        
    }
}

module.exports = {
    getShoppingCart,
    productAddToCart,
    deleteProductFromCart
}