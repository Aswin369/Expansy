const User = require("../../models/cartSchema")
const Product = require("../../models/productSchema")
const Cart = require("../../models/cartSchema")
const Address = require("../../models/addressSchema")
const Order = require("../../models/orderSchema")
const mongoose = require("mongoose")
const razorpay = require("../../config/razorpay")
const crypto = require("crypto")
const Coupon = require("../../models/couponSchema")

const getShoppingCart = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect("/login");
        }

        const cartUser = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) })
            .populate("items.productId");

        if (!cartUser || cartUser.items.length === 0) {
            return res.render("shoppingCart", { cartData: { items: [] }, user: userId });
        }

        const populatedCartItems = await Promise.all(
            cartUser.items.map(async (item) => {
                const product = item.productId;
                if (!product) return item;
                const specification = product.specification.find(spec => spec._id.equals(item.specId));

                return {
                    ...item.toObject(),
                    unitPrice: item.unitPrice,  
                    totalPrice: item.totalPrice, 
                    specification
                };
            })
        )

        res.render("shoppingCart", {
            cartData: { ...cartUser.toObject(), items: populatedCartItems },
            user: userId
        });
    } catch (error) {
        console.error("Error found in shopping cart", error);
        res.status(500).send("Something went wrong!");
    }
};


const productAddToCart = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: "Login first" })
        }

        const userId = req.session.user;
        const { productId, quantity, salePrice, discountPrice, selectedSpecId, appliedOfferId } = req.body

        if (!userId) {
            return res.status(400).json({ success: false, message: "User not found" })
        }

        if (!productId || !selectedSpecId || quantity <= 0) {
            return res.status(400).json({ success: false, message: "Invalid product details" })
        }

        
        const productDetail = await Product.findOne({ _id: productId });
        if (!productDetail) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const spec = productDetail.specification.find(s => s._id.toString() === selectedSpecId)
        if (!spec) {
            return res.status(404).json({ success: false, message: "Specification not found" })
        }

        const offerApplied = mongoose.Types.ObjectId.isValid(appliedOfferId) ? appliedOfferId : null

        const availableStock = spec.quantity;

        let userCart = await Cart.findOne({ userId });

        console.log("THis is user cart", userCart)

        let existingCartItem = userCart ? userCart.items.find(item => item.specId.toString() === selectedSpecId) : null

       
        const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
        const totalQuantity = currentCartQuantity + quantity;

        if (totalQuantity > availableStock) {
            return res.status(400).json({ success: false, message: "Not enough stock available!" });
        }

        const totalPrice = salePrice * quantity;

        if (userCart) {
            if (existingCartItem) {
                
                existingCartItem.quantity += quantity;
                existingCartItem.totalPrice += totalPrice;
            } else {
              
                userCart.items.push({
                    productId,
                    specId: selectedSpecId,
                    quantity,
                    unitPrice: salePrice,  
                    totalPrice,
                    discountPriceforThisProduct: discountPrice,
                    offerApplied
                });
            }
            await userCart.save();
        } else {
            
            const newCart = new Cart({
                userId,
                items: [{
                    productId,
                    specId: selectedSpecId,
                    quantity,
                    unitPrice: salePrice,  
                    totalPrice,
                    discountPriceforThisProduct: discountPrice,
                    offerApplied
                }]
            });
            await newCart.save();
        }

        return res.status(201).json({ success: true, message: "Product added to cart successfully" });

    } catch (error) {
        console.error("Error in productAddToCart:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



const deleteProductFromCart = async(req,res)=>{
    try {
        const userId = req.session.user
        const cartId = req.params.productId
        if(!cartId){
            return res.status(400).json({success:true, message:"There is no product please add any product to cart"})
        }
        
        const updateCart = await Cart.updateOne({ userId: userId },{$pull:{items:{_id:cartId}}})

        console.log("thskdfk",updateCart)

        if(!updateCart){
            return res.status(400).json({success:false, message:"Please add a product to cart"})
        }

        res.status(201).json({success:true, message:"Product deleted successfully"})

    } catch (error) {
        
    }
}

const updateCart = async (req,res)=>{
    try {
        
        const {cartId, productId, quantity, price, totalPrice, itemIndex} = req.body
        console.log("sakjdfh",quantity);
        
        if(!cartId){
            return res.status(400).json({success:false, message:"Something went wrong"})
        }
        const updatedCart = await Cart.findOneAndUpdate({ _id: cartId },{ 
                $set: { 
                    [`items.${itemIndex}.productId`]: productId,
                    [`items.${itemIndex}.quantity`]: quantity,
                    [`items.${itemIndex}.price`]: price,
                    [`items.${itemIndex}.totalPrice`]:totalPrice}
                },{ new: true })

        res.status(201).json({success:true})        
    } catch (error) {
        console.error("This error occured in updateCart",error)
        res.redirect("/pageerror")
    }
}



const loadplaceOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { cartId } = req.query;
        console.log("this is userid",userId)
        if (!userId) {
            return res.redirect("/login");
        }
        
        const cartDetails = await Cart.findById(cartId).populate("items.productId")
        
        let cartTotal = 0
        
        cartDetails.items.forEach((val)=>{
            cartTotal+=val.quantity * val.price
        })
        
        console.log("cartTotal", cartTotal)
        
        const validCoupons = await Coupon.find({isActive: true});
        
        const addressDetails = await Address.findOne({userId:userId})
        console.log("THis is cart details",cartDetails)
        console.log("THis is address details",addressDetails)
        res.render("checkoutPage", { 
            cartData: cartDetails,  
            addrressData: addressDetails,
            validCouponData: validCoupons
        })

        console.log("coupoins", validCoupons)
    } catch (error) {
        console.error("Error in loadplaceOrder:", error);
        res.redirect("/pageerror");
    }
};



const loadCheckOutPage = async(req,res)=>{
    try {
        const { cartId } = req.query;
        res.status(200).json({ success: true, redirectUrl: `/checkout?cartId=${cartId}`});
    } catch (error) {
        console.error("This error occured in loadCheckOutPage",error)
        res.redirect("/pageerror")
    }
}

const addOrderDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const {deliveryAddressId,totalAmount,payableAmount,totalDiscount,couponId,couponCode,paymentMethod,items,shippingCharge} = req.body;

        console.log("khsdfkjs",req.body)

        const addressData = await Address.findOne({userId:new mongoose.Types.ObjectId(userId),"address._id": new mongoose.Types.ObjectId(deliveryAddressId)},{"address.$":1})

        if (couponCode) {
            const coupon = await Coupon.findOne({_id: couponId,code:couponCode, 
                isActive: true
            });
        
            // Check if the coupon exists
            if (!coupon) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid or inactive coupon." 
                });
            }
        
            // Check if the coupon usage limit is reached
            if (coupon.currentUsage >= coupon.maxUsage) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Coupon usage limit has been reached." 
                });
            }
        
            // Increment usage only if conditions are met
            await Coupon.findByIdAndUpdate(
                coupon._id,
                { $inc: { currentUsage: 1, maxUsage: -1 } }
            );
        }
        

        const deliveryAddress = {...addressData.address[0]}
        

        
        const cartDetails = await Cart.findOne({userId})
        if (!cartDetails || !cartDetails.items){
            return res.status(400).json({success:false,message:"Cart is empty"});
        }

        const orderProducts = items.map((item, index)=>{
            const cartItem = cartDetails.items.find(cart => cart.productId.toString() === item.productId);
            if (!cartItem || !cartItem.specId) {
                throw new Error(`Missing specId for product at index ${index}`);
            }

            return {
                productId: new mongoose.Types.ObjectId(item.productId),
                specId: new mongoose.Types.ObjectId(cartItem.specId),
                quantity: item.quantity,
                price: item.price, 
                totalPrice: item.totalPrice || (item.price * item.quantity),
            }
        })
        const hasUndefinedPrice = orderProducts.some(product => product.price === undefined);
        if (hasUndefinedPrice) {
            return res.status(400).json({ success: false, message: "Some products have an undefined price" });
        }

        


        const newOrder = new Order({
            userId,
            products: orderProducts,
            deliveryAddress,
            totalAmount,
            payableAmount,
            paymentMethod: paymentMethod === "ONLINE" ? "razorpay" : paymentMethod,
            offerAndCouponAmount: totalDiscount || 0,
            couponId: couponId ? new mongoose.Types.ObjectId(couponId) : null,
            couponCode: couponCode || null,
            shippingCharge: shippingCharge
        });

       

        await newOrder.save();
        

        res.status(200).json({
            success: true,
            message: "Order placed successfully",
            orderId: newOrder.orderId,
            id:newOrder._id
        });

        
        for (const item of orderProducts) {
            const { productId, specId, quantity } = item;
            const product = await Product.findOneAndUpdate(
                { _id: productId, "specification._id": specId },
                { $inc: { "specification.$.quantity": -quantity } },
                { new: true, runValidators: true }
            );

            if (!product) {
                throw new Error(`Product with ID ${productId} or specification ${specId} not found`);
            }
        }

        await Cart.deleteOne({userId:userId})
        // console.log("kasjdfhkashdfkhask")
    } catch (error) {
        console.error("This error occurred in addOrderDetails", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

const loadSuccessPage = async(req,res)=>{
    try {
        const userId = req.session.user
        const {order} = req.query

        console.log("dkasfhdjhfkajsdhfj",order)
        if(!userId){
            res.redirect("/login")
        }
        res.render("orderSuccess",{
            order
        })
    } catch (error) {
        console.error("This error occured in loadSuccess page", error)
        res.redirect("/pageerror")
    }
}

const razorpayOrder = async (req,res)=>{
    try {
        const options = {
            amount: req.body.amount,
            currency: 'INR',
            receipt: 'receipt_' + Math.random().toString(36).substring(7),
        };

        console.log("skajdfhkasjdfhkashdfklh", options)

        const order = await razorpay.orders.create(options);
        console.log(order)
        res.status(200).json(order);
    } catch (err) {
        console.log("This error occured in razorpayOrder",err)
        res.redirect("/pageerror")
     }

}

const verifiyPayment = async (req,res) =>{
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, id } = req.body;

        console.log("verifuy payment", req.body)

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ error: "Missing payment information" });
        }

        const sign = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSign = crypto.createHmac('sha256', "YOUR_CORRECT_SECRET_KEY")
            .update(sign.toString())
            .digest('hex');

        if (razorpaySignature === expectedSign) {
            const orderData = await Order.findById(id);
            if (!orderData) {
                return res.status(404).json({ error: 'Order not found' });
            }

            orderData.paymentStatus = "success";
            await orderData.save();

            res.status(200).json({success: true, message: 'Payment verified successfully', orderId, id});
        } else {
            res.status(400).json({ error: 'Invalid payment signature' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
 

const applyCoupon = async (req, res) => {
    try {
        console.log("Coupon Data Received:", req.body);
        const { couponCode, cartId } = req.body;

        if (!cartId) {
            return res.status(400).json({ success: false, message: "CartId is not defined, please try again" });
        }

        let totalCartPrice = 0;
        let totalDiscount = 0;

        const cartData = await Cart.findOne({ _id: cartId });

        if (!cartData || !cartData.items || cartData.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart not found or empty" });
        }

        cartData.items.forEach((val) => {
            totalCartPrice += val.totalPrice
            totalDiscount += val.discountPriceforThisProduct
        });

        console.log("Total Cart Price:", totalCartPrice);
        console.log("Total Product Discounts:", totalDiscount);

        if (isNaN(totalCartPrice) || totalCartPrice === 0) {
            return res.status(400).json({ success: false, message: "Invalid total cart price" });
        }

        const couponData = await Coupon.findOne({ code: couponCode, isActive: true });
        if (!couponData) {
            return res.status(400).json({ success: false, message: "Invalid coupon, please try another" });
        }

        let discountValue = Number(couponData.discountValue);
        if (isNaN(discountValue)) {
            return res.status(400).json({ success: false, message: "Invalid discount value in coupon" });
        }

        if (totalCartPrice < couponData.minDiscountValue) {
            return res.status(400).json({ success: false, message: `Coupon is only valid for purchases above ${couponData.minDiscountValue}` });
        }

        let couponDiscountAmount = ((totalCartPrice - totalDiscount) * discountValue) / 100;

        if (couponDiscountAmount > couponData.maxDiscountValue) {
            couponDiscountAmount = couponData.maxDiscountValue;
        }

        const finalPrice = totalCartPrice - totalDiscount - couponDiscountAmount;

        console.log("Coupon Discount Amount:", couponDiscountAmount);
        console.log("Final Price After All Discounts:", finalPrice);

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            totalCartPrice,
            totalDiscount,
            couponDiscountAmount,
            finalPrice,
        });

    } catch (error) {
        console.error("Error in applyCoupon:", error);
        res.redirect("/pageerror");
    }
};



module.exports = {
    getShoppingCart,
    productAddToCart,
    deleteProductFromCart,
    updateCart,
    loadCheckOutPage,
    loadplaceOrder,
    addOrderDetails,
    loadSuccessPage,
    razorpayOrder,
    verifiyPayment,
    applyCoupon
}