const User = require("../../models/userSchema")
const Address = require("../../models/addressSchema")
const mongoose = require("mongoose")
const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")
const Order = require("../../models/orderSchema")
const env = require("dotenv").config()
const session = require("express-session")
const Wallet = require("../../models/walletSchema")
const Product = require("../../models/productSchema")
const Transaction = require("../../models/walletTransaction")
const PDFDocument = require('pdfkit');
const razorpay = require("../../config/razorpay")
const crypto = require("crypto")
const StatusCode = require("../../constants/statusCode")

const getProfilePage = async (req, res) => {
    try {   
        const id = req.session.user;
        const page = parseInt(req.query.page) || 1;
        const addressPage = parseInt(req.query.addressPage) || 1; 
        const transactionPage = parseInt(req.query.transactionPage) || 1;

        const limit = 5;
        const addressLimit = 2;
        const transactionLimit = 5;

        const skip = (page - 1) * limit;
        const addressSkip = (addressPage - 1) * addressLimit;
        const transactionSkip = (transactionPage - 1) * transactionLimit;

        const userData = await User.findById({ _id: id });
        const walletDetails = await Wallet.find({ userId: id });
        const userAddress = await Address.findOne({ userId: id });

        let paginatedAddresses = [];
        let totalAddressPages = 0;

        if (userAddress && userAddress.address.length > 0) {
            totalAddressPages = Math.ceil(userAddress.address.length / addressLimit);
            paginatedAddresses = userAddress.address.slice(addressSkip, addressSkip + addressLimit);
        }

        const totalTransactions = await Transaction.countDocuments({ userId: id });
        const totalTransactionPages = Math.ceil(totalTransactions / transactionLimit);

        const findTranscationHistory = await Transaction.find({ userId: id })
            .sort({ createdAt: -1 })
            .skip(transactionSkip)
            .limit(transactionLimit);

        const totalOrders = await Order.countDocuments({ userId: id });
        const totalPages = Math.ceil(totalOrders / limit);

        const orderDetails = await Order.find({ userId: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'products.productId',
                select: 'productName productImage'
            });
            
        res.render("profilePage", {
            user: id,
            data: userData,
            address: paginatedAddresses, 
            oderData: orderDetails,
            walletData: walletDetails,
            findTranscationHistory,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            addressPagination: {
                currentAddressPage: addressPage,
                totalAddressPages: totalAddressPages,
                hasNextAddressPage: addressPage < totalAddressPages,
                hasPrevAddressPage: addressPage > 1
            },
            transactionPagination: {
                currentTransactionPage: transactionPage,
                totalTransactionPages: totalTransactionPages,
                hasNextTransactionPage: transactionPage < totalTransactionPages,
                hasPrevTransactionPage: transactionPage > 1
            }
        });

    } catch (error) {
        console.error("Error occurred in getProfilePage", error);
        res.redirect("/pageerror");
    }
};



const editUserProfile = async (req,res)=>{
    try {
        const userId = req.session.user
        if(!userId){
            return res.status(StatusCode.UNAUTHORIZED).JSON({message:"User not found"})
        }
        
        const {name, phone} = req.body
        const userData = await User.updateOne({_id:userId},{$set:{name:name,phone:phone }})

        return res.status(StatusCode.CREATED).json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Error occured in profilUpdat",error)
        res.redirect("/pageerror")
    }
}

const addUserAddress = async (req,res)=>{
    try {
        
        const userId = req.session.user

        if(!userId){
            return res.status(StatusCode.UNAUTHORIZED).json({message:"User not found"})
        }
        
        const {address, city, landmark, state, pincode, phone, altPhone} = req.body

       const newAddress = {
            addressType: address,
            city: city,
            landMark: landmark,
            state: state,
            pincode: Number(pincode),
            phone: phone,
            altPhone: altPhone
       }
       
       const userAddress = await Address.findOne({userId})
       
       

       if(userAddress){
        userAddress.address.push(newAddress);
        await userAddress.save()
        return res.status(StatusCode.CREATED).json({message:"Address added successfully",success:true})
       }else{
        const addressData = new Address({
            userId:userId,
            address:[newAddress]
        })
        await addressData.save()
        return res.status(StatusCode.CREATED).json({message:"Address added successfully",success:true})
       }
        
    } catch (error) {
        console.error("This error occured in addUserAddress",error)
        res.redirect("/pageerror")
    }
}

const deleteAddress = async (req,res)=>{
    try {
        const userId = req.session.user
        const id = req.params.addressId 
      
        const objectIdUser = new mongoose.Types.ObjectId(userId)
        

         const updatedUser = await Address.findOneAndUpdate({userId:objectIdUser},{$pull:{address:{_id: id}}},{new:true})
        if(!updatedUser){
            return res.status(StatusCode.NOT_FOUND).json({message:"Address not found", success:false})
        }
        return res.status(StatusCode.OK).json({message:"Address deleted successfully", success:true})
    } catch (error) {
        console.error("This error occured in deleteAdress",error)
        res.redirect("/pageerror")
    }
}

const getUserAddressId = async (req,res)=>{
    try {
        const userId = req.session.user
        const addressId = req.params.addressId
        
        const objectIdUser = new mongoose.Types.ObjectId(userId)
        const userAddress =  await Address.findOne({userId: objectIdUser,"address._id": addressId},{ "address.$":1})

        if(userAddress){
            return res.json(userAddress.address[0])
        }else{
            return res.json({message:"Address not found"})
        }
        
    } catch (error) {
        console.error("This error occured in getUserAddressId",error)
        res.redirect("/pageerror")
    }
}

const updateAddress = async (req,res)=>{
    try {
        const userId = req.session.user
        const addressId = req.params.addressId
        const {addressType, city, landMark, state, pincode, phone, altPhone} = req.body
        
        const updateAddress = await Address.findOneAndUpdate(
            {
            userId:userId,
            "address._id":addressId
        },
        {
            $set:{
                "address.$.addressType":addressType,
                "address.$.city":city,
                "address.$.landMark": landMark,
                "address.$.state": state,
                "address.$.pincode":pincode,
                "address.$.phone":phone,
                "address.$.altPhone": altPhone
            }
        },
        {new:true}
    )
    console.log("completed");
    
    if(!updateAddress){
        return res.status(StatusCode.NOT_FOUND).json({message:"Address not found"})
    }

    res.status(StatusCode.OK).json({message:"Address updated successfully", success:true})

    } catch (error) {
        console.error("This error occured in updateAddress",error)
        res.redirect("/pageerror")
    }
}



function generateOtp(){
    return Math.floor(100000+Math.random()*900000).toString()
}

async function sendVerificationEmail(email,otp){
    try{
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port:587,
            secure:false,
            requireTLS: true,
            auth:{
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "OTP for Resetting Your Password",
            html: `
                <div style="font-family: Arial, sans-serif; color: rgb(69, 63, 63);">
                    <h2 style="color: rgb(88, 85, 85);">Password Reset Request</h2>
                    <p style="color: rgb(88, 85, 85);">Use the OTP below to reset your password:</p>
                    <h1 style="color: rgb(56, 51, 51);">${otp}</h1>
                    <p style="color: rgb(88, 85, 85);">This OTP is valid for 60 seconds.</p>
                    <p style="color: rgb(88, 85, 85);">If you didn't request this, ignore this email.</p>
                </div>`
        })

        return info.accepted.length>0

    }catch(error){
        console.error("Error sending email",error)
        return false
    }
}

const getForgotPassPage = async (req,res)=>{
    try {
        res.render("forgot-password")
    } catch (error) {
        console.error("This error occured in getForgotPassPage",error)
        res.redirect("/pageerror");
    }
}

const getVerifyOtpPage = async (req,res)=>{
    try {
        res.render("forgotpass-verfiyOtp")
    } catch (error) {
        console.error("This error occured in getVerifyOtpPage",error)
        res.redirect("/pageerror")
    }
}

const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email });

        if (!findUser) {
            return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "User with this email does not exist" });
        }

        const otp = generateOtp();
        const otpExpiry = Date.now() + 1 * 60 * 1000;
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            req.session.userOtp = otp;
            req.session.email = email;
            req.session.otpExpiry = otpExpiry;
            console.log("This is the otp forgot email",otp)
            return res.status(StatusCode.OK).json({ success: true });
        } else {
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to send OTP. Please try again." });
        }

    } catch (error) {
        console.error("Error in forgot password email sending:", error);
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error occurred." });
    }
};


const verifyForgotPassOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        
        const {userOtp, otpExpiry}  = req.session;
        
        
        if( Date.now() > otpExpiry){
            return res.status(StatusCode.BAD_REQUEST).json({success:false, message:"OTP expired. Please try again"})
        }

        if (!otp || !userOtp) {
            return res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                message: "OTP is required"
            });
        }
        if (otp === userOtp) { 
            req.session.userOtp = null;
            console.log("This is from comparing otp now printing session", req.session)
            return res.json({
                success: true,
                redirectUrl: "/change-password"
            });
        } else {
            return res.json({success: false, message: "Invalid OTP. Please try again."})
        }
    } catch (error) {
        console.error("Error occurred in verify OTP:", error);
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({success: false, message: "An error occurred. Please try again"})
    }
}

const verifyPasswordResendOTP = async (req, res) => {
    try {
        const userData = req.session;
        
        const {email} = userData
        
        if (!email || !userData) {
            return res.status(StatusCode.BAD_REQUEST).json({success: false, message: "You has expried. Please try agian"})
        }
        const otp = generateOtp();  
        const otpExpiry = Date.now() + 1 * 60 * 1000;
        req.session.userOtp = otp
        req.session.otpExpiry = otpExpiry
        console.log("this is resend otp", otp)
        const sentEmail = await sendVerificationEmail(email,otp);
        if (!sentEmail) {
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({success: false, message: "Failed to send OTP. Please try again."})
        }
        return res.json({
            success: true,
            message: "OTP sent successfully! Please check your email."
        });

    } catch (error) {
        console.error("Error in verifyPasswordResendOTP:", error);
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "An error occurred. Please try again."
        });
    }
}

const getchangePasswordPage = async (req, res) => {
    try {   
        if (!req.session.userOtp === null) {
            return res.redirect('/forgot-password');
        }
        res.render("enterNewPassword");
    } catch (error) {
        console.error("Error in changePassword:", error);
        res.redirect("/pageerror");
    }
}

const securePassword = async (password)=>{
    try{
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    }catch(error){

    }
}

const changePassword = async (req,res)=>{
    try {
        const {confirmPassword} = req.body
        const {email} = req.session
        
        if(!confirmPassword){
             res.status(StatusCode.BAD_REQUEST).json({success:false, message:"Please try again"})
        }
        const hashPassword = await securePassword(confirmPassword)
        if(!hashPassword){
            res.status(StatusCode.BAD_REQUEST).json({success:false, message:"Please try again"})
        }
        const finduser = await User.findOneAndUpdate({email:email}, {$set:{password:hashPassword}})
        
        console.log("This is findUser", finduser)

        if(!finduser){
            res.status(StatusCode.BAD_REQUEST).json({success:false, message:"Password not saved please try again"})
        }

        console.log("saved password")
        res.status(StatusCode.OK).json({success:true})
        
    } catch (error) {
        console.error("This error occured in change password", error)
        res.redirect("/pageerror")
    }
}

const loadOrderDetailPage = async (req, res) => {
    try {
        console.log("oderrid ", req.params.orderId);
        const orderId = req.params.orderId;
        const userId = req.session.user
        const orderDetails = await Order.findById(orderId).populate("products.productId")
        
        console.log("orderDetails",orderDetails)

        if (!orderDetails) {
            
            return res.status(StatusCode.NOT_FOUND).json({ message: "Order not found" });
        }
        
        res.render("oderDetailPage", {  
            success: true,
            orderData: orderDetails,
        });
    } catch (error) {
        console.error("Error in loadOrderDetailPage:", error);
        res.redirect("/pageerror");
    }
}

const deleteOrder = async(req,res)=>{
    try {
        const {orderId, productId, quantity, specId, id, amount, reason, discountPerProduct} = req.query
        console.log("dshka",req.query)
        console.log("asldfkjlasdkjf",req.query)
        const userId = req.session.user

        console.log("this is amount", amount)
        console.log("this is discountPerProduct", discountPerProduct)
        let quantityToNumber = Number(quantity)

        console.log("quaertity", typeof quantityToNumber)

        const specObjectId = new mongoose.Types.ObjectId(specId);

       
        const productUpdateQuantity = await Product.updateOne({_id:productId,"specification._id":specObjectId},{$inc:{"specification.$.quantity":quantityToNumber}},{new:true})

        
        const convertAmount = Number(amount);
        
        console.log("asdfaskljdfojk",convertAmount)

        const order = await Order.updateOne(
            { _id: orderId, "products.productId": productId },
            { 
                $set: { "products.$.status": "Cancelled", "products.$.reason": reason}, 
                $inc: { payableAmount: -convertAmount }  
            },
            {new: true})
        
        
        
        console.log("orderasdfkashdf", order)

            console.log("ghfgfdfd", order);
            

        const addWallet =await  Wallet.updateOne({userId:userId},{$inc:{balance:convertAmount}})

        if(addWallet.matchedCount === 0){
            const newWallet = new Wallet({
                userId:userId,
                balance:convertAmount
            })
            await newWallet.save()
        }


        const walletData = await Wallet.findOne({ userId: userId });

        if (walletData) {
            await Transaction.create({
                walletId: walletData._id,
                userId: userId,
                type: 'credit',    
                amount: convertAmount,
                associatedOrder: orderId,
                status: 'success'
            });
        }

        const order1 = await Order.findOne({ _id: orderId });

        const allCancelled = order1.products.every(item => item.status === "Cancelled");

        if (allCancelled) {
            await Order.findByIdAndUpdate(orderId, { $set: { status: "Cancelled" } });
        }
        

        return res.status(StatusCode.CREATED).json({success:true})
    } catch (error) {
        console.error("This error found in deleteOrder", error)
        res.redirect("/pagerror")
    }
}

const cancelOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { orderId, reason, totalAmountPrice } = req.body;
        const amount = parseInt(totalAmountPrice) - 50;

        const order = await Order.findById(orderId).populate("products.productId");

        if (!order) {
            return res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Order not found" });
        }

        await Order.findByIdAndUpdate(orderId, {
            $set: {
                status: "Cancelled",
                returnReason: reason,
                "products.$[].status": "Cancelled"
            }
        });


        for (const item of order.products) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            const specIndex = product.specification.findIndex(spec =>
                spec._id.toString() === item.specId.toString()
            );

            if (specIndex !== -1) {
                product.specification[specIndex].quantity += item.quantity;
                await product.save();
            }
        }

        if (order.paymentStatus === 'paid' || order.paymentStatus === 'Success') {
            let wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                wallet = new Wallet({ userId, balance: amount });
                await wallet.save();
            } else {
                wallet.balance += amount;
                await wallet.save();
            }

            await Transaction.create({
                walletId: wallet._id,
                userId,
                type: 'credit',
                amount,
                associatedOrder: orderId,
                status: 'success'
            });
        }

        return res.status(StatusCode.CREATED).json({ success: true });

    } catch (error) {
        console.error("Error in cancelOrder:", error);
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
    }
};

const returnRequest = async (req,res)=>{
    try {
        const userId = req.session.user
        console.log("req.query",req.query)
        const {orderId, productId, specId, quantity, id, amount, reason} = req.query

        const changeOrderStatus = await Order.updateOne({_id:orderId, "products._id":id},{$set:{"products.$.status":"Return Requested","products.$.reason":reason}})

        if(changeOrderStatus.modifiedCount === 0){
            return res.status(StatusCode.BAD_REQUEST).json({success:false, message: "Failed to request return"})
        }

        return res.status(StatusCode.OK).json({success:true,message: "Return request submitted successfully"})
    } catch (error) {
        console.error("This error occured in return request function", error)
        res.redirect("/pagerror")
    }
}

const profilePageChangePassword = async (req, res) => {
    try {
        const userId = req.session.user;
        
        const { oldPassword, newPassword } = req.body
        const user = await User.findOne({ _id: userId });
        console.log("user", user)
        if (!user) {
            return res.status(StatusCode.NOT_FOUND).json({ message: "User not found" })
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password)
        if (!isMatch) {
            return res.status(StatusCode.BAD_REQUEST).json({ success:false, message: "Old password is incorrect" })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await User.updateOne({ _id: userId }, { $set: { password: hashedPassword }})
        console.log("updated ")
        res.status(StatusCode.OK).json({success:true, message: "Password updated successfully"})

    } catch (error) {
        console.error("Error updating password:", error);
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
};


const generateInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        
      
        const orderData = await Order.findById(orderId)
            .populate('products.productId')
            .populate('products.specId')
            .populate('userId', 'name email'); 
        
        if (!orderData) {
            return res.status(StatusCode.NOT_FOUND).json({ message: 'Order not found' });
        }
        
      
        const doc = new PDFDocument({ margin: 50 });
        
     
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${orderData.orderId}.pdf`);
        
    
        doc.pipe(res);
        
  
        doc.fontSize(25)
           .font('Helvetica-Bold')
           .text('INVOICE', { align: 'center' });
        
        doc.moveDown();
        
   
        doc.fontSize(12)
           .font('Helvetica-Bold');
           
 
        const formattedDate = new Date().toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        doc.text(`Invoice Date: ${formattedDate}`, { align: 'right' });
        doc.text(`Order ID: ${orderData.orderId}`);
        doc.text(`Order Date: ${new Date(orderData.createdAt).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`);
        
        doc.moveDown();
        
      
        const customerY = doc.y;
        

        doc.font('Helvetica-Bold')
           .text('Customer Information:', 50, customerY);
        
        doc.font('Helvetica')
           .fontSize(10)
           .text(`Name: ${orderData.userId.name || 'N/A'}`, 50, customerY + 20)
           .text(`Email: ${orderData.userId.email || 'N/A'}`, 50, customerY + 35);
        
    
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('Shipping Information:', 430, customerY);
        
 
        const address = orderData.deliveryAddress;
        
        doc.font('Helvetica')
           .fontSize(10)
           .text(`Address: ${address.addressType || 'N/A'}`, 430, customerY + 20)
           .text(`${address.landMark || 'N/A'}`, 430, customerY + 35)
           .text(`${address.city || 'N/A'}, ${address.state || 'N/A'} - ${address.pincode || 'N/A'}`, 430, customerY + 50)
           .text(`Phone: ${address.phone || 'N/A'}`, 430, customerY + 65)
           .text(`Alt Phone: ${address.altPhone || 'N/A'}`, 430, customerY + 80);
        

        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('Payment Information:', 50, customerY + 70);
        
        doc.font('Helvetica')
           .fontSize(10)
           .text(`Method: ${orderData.paymentMethod}`, 50, customerY + 90)
           .text(`Status: ${orderData.paymentStatus}`, 50, customerY + 105);
        

        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('Order Status:', 50, customerY + 125);
        
        doc.font('Helvetica')
           .fontSize(10)
           .text(`${orderData.status}`, 50, customerY + 140);
        
        doc.moveDown(2);
        

        const itemsTableY = Math.max(customerY + 160, doc.y);
        
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('Product', 50, itemsTableY)
           .text('Status', 230, itemsTableY, { width: 60, align: 'center' })
           .text('Quantity', 290, itemsTableY, { width: 60, align: 'center' })
           .text('Unit Price', 350, itemsTableY, { width: 80, align: 'right' })
           .text('Total', 450, itemsTableY, { width: 80, align: 'right' });
        
    
        doc.moveTo(50, itemsTableY + 20)
           .lineTo(550, itemsTableY + 20)
           .stroke();
        

        let itemY = itemsTableY + 30;
        
        orderData.products.forEach((item, index) => {
            const productName = item.productId.productName || 'Product';
            const variantInfo = item.specId ? `(${item.specId.color || ''} ${item.specId.size || ''})`.trim() : '';
            const displayName = variantInfo ? `${productName} ${variantInfo}` : productName;
            
            const status = item.status || 'N/A';
            const quantity = item.quantity;
            const unitPrice = `₹${item.price.toLocaleString()}`;
            const total = `₹${item.totalPrice.toLocaleString()}`;
            
         
            const productNameWidth = 170;
            const wrappedName = wrapText(doc, displayName, productNameWidth);
            
            const lineHeight = wrappedName.length * 15
            const lineHeightActual = Math.max(lineHeight, 20); 
            
            wrappedName.forEach((line, i) => {
                doc.font('Helvetica')
                   .fontSize(10)
                   .text(line, 50, itemY + (i * 15));
            });
            
            doc.text(status, 230, itemY, { width: 60, align: 'center' })
               .text(quantity.toString(), 290, itemY, { width: 60, align: 'center' })
               .text(unitPrice, 350, itemY, { width: 80, align: 'right' })
               .text(total, 450, itemY, { width: 80, align: 'right' });
            
            
            itemY += lineHeightActual + 10;
            
            if (index < orderData.products.length - 1) {
                doc.strokeColor('#e0e0e0')
                   .moveTo(50, itemY - 5)
                   .lineTo(550, itemY - 5)
                   .stroke()
                   .strokeColor('#000000'); 
            }
        });
        
      
        doc.strokeColor('#000000')
           .moveTo(50, itemY)
           .lineTo(550, itemY)
           .stroke();
        
  
        const summaryY = itemY + 20;
        
        doc.font('Helvetica')
           .fontSize(10)
           .text('Subtotal:', 380, summaryY)
           .text(`₹${orderData.totalAmount.toLocaleString()}`, 450, summaryY, { width: 80, align: 'right' });
        
        doc.text('Discount:', 380, summaryY + 20)
           .text(`₹${orderData.offerAndCouponAmount.toLocaleString()}`, 450, summaryY + 20, { width: 80, align: 'right' });
        
        doc.text('Shipping:', 380, summaryY + 40)
           .text('₹0', 450, summaryY + 40, { width: 80, align: 'right' });
        
     
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('Total Amount:', 380, summaryY + 65)
           .text(`₹${orderData.payableAmount.toLocaleString()}`, 450, summaryY + 65, { width: 80, align: 'right' });
        
     
        const footerY = doc.page.height - 50;
        
        doc.font('Helvetica')
           .fontSize(10)
           .text('Thank you for your purchase. For any questions or concerns, please contact our customer support.', 50, footerY, { align: 'center' });
        
 
        doc.end();
        
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: 'Error generating invoice', error: error.message });
    }
};


function wrapText(doc, text, width) {
    if (!text) return [''];
    
    const words = text.toString().split(' ');
    const lines = [];
    let line = '';
    
    words.forEach(word => {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = doc.widthOfString(testLine);
        
        if (testWidth > width) {
            lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    });
    
    if (line) {
        lines.push(line);
    }
    
    return lines.length > 0 ? lines : [''];
}


const orderDetailRazorpay = async (req,res)=>{
    try {
        const options = {
            amount: req.body.amount,
            currency: 'INR',
            receipt: 'receipt_' + Math.random().toString(36).substring(7),
        };

        console.log("skajdfhkasjdfhkashdfklh", options)

        const order = await razorpay.orders.create(options);
        console.log(order)
        res.status(StatusCode.OK).json(order);
    } catch (err) {
        console.log("This error occured in razorpayOrder",err)
        res.redirect("/pageerror")
     }

}

const orderVerifyPayment = async (req,res)=>{
    try {
           const { razorpayOrderId, paymentId, signature, orderId } = req.body;

             console.log(req.body)
    
            
    
            if (!razorpayOrderId || !paymentId || !signature) {
                return res.status(StatusCode.BAD_REQUEST).json({ error: "Missing payment information" });
            }
    
            const sign = razorpayOrderId + '|' + paymentId;
            const expectedSign = crypto.createHmac('sha256', "7FaXYkyBxYgWdzIHBWr7ntSa")
                .update(sign.toString())
                .digest('hex');
    
            if (signature === expectedSign) {
                const orderData = await Order.findById(orderId);
                if (!orderData) {
                    return res.status(StatusCode.NOT_FOUND).json({ error: 'Order not found' });
                }
    
                orderData.paymentStatus = "success";
                await orderData.save();
    
                res.status(StatusCode.OK).json({success: true, message: 'Payment verified successfully', orderId});
            } else {
                res.status(StatusCode.BAD_REQUEST).json({ error: 'Invalid payment signature' });
            }
        } catch (err) {
            console.error(err);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
}

module.exports = {
    getProfilePage,
    editUserProfile,
    addUserAddress,
    deleteAddress,
    getUserAddressId,
    updateAddress,
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    verifyPasswordResendOTP,
    getchangePasswordPage,
    changePassword,
    getVerifyOtpPage,
    loadOrderDetailPage,
    deleteOrder,
    cancelOrder,
    returnRequest,
    profilePageChangePassword,
    generateInvoice,
    orderDetailRazorpay,
    orderVerifyPayment
}