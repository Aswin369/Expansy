const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema")
const Product = require("../../models/productSchema")
const Transaction = require("../../models/walletTransaction")
const Wallet = require("../../models/walletSchema")
const { json } = require("body-parser")

const getOrderPage = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 4
        const skip = (page-1)*limit
        const oderList = await Order.find({})
        .sort ({createdAt: -1})
        .skip(skip)
        .limit(limit)
        .populate("userId")

        const totalOrder = await Order.countDocuments()

        const totalPages = Math.ceil(totalOrder/limit)

        res.render("orderList",{
            data: oderList,
            currentPage : page,
            totalPages: totalPages,
            totalOrder: totalOrder
        })

    } catch (error) {
        console.error("This error occured in getOrderPage",error)
        res.redirect("/pageerror")
    }
}

const getOrderDetailPage = async(req,res)=>{
    try {
        const id = req.params.id
        
        const orderDetailData = await Order.findById(id)
        .populate("userId")
        .populate({path: "products.productId", model: "Product",})
        res.render("orderDetail",{
            orderData: orderDetailData,
            
        })
    } catch (error) {
        console.error("This is getOrderDetailPage",error)
        res.redirect("/pagerror")
    }
}

const changeStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        

        console.log("sdsdf", req.body)
        if (!orderId || !status) {
            return res.status(401).json({ success: false, message: "Select an option" });
        }

        
        if (status === "Cancelled") {
            const orderData = await Order.findById(orderId);

            if (!orderData) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            let totalRefundAmount = 0; 

           
            for (const product of orderData.products) {
                const { productId, specId, quantity, status } = product;

                console.log("kjhsdfkhskdhf", product)
             
                if (status === "Return Approved" || status === "Delivered") {
                    continue;
                }

       
                product.status = "Cancelled";

                console.log("productstatus", product.status)
            
                const productData = await Product.findById(productId);

                if (productData) {
                   
                    const spec = productData.specification.find(spec =>
                        spec._id.toString() === specId.toString()
                    );

                    if (spec) {
                        spec.quantity += quantity;
                        await productData.save();
                    }
                }

               
                totalRefundAmount += product.totalPrice;
            }

            
            const wallet = await Wallet.findOne({ userId: orderData.userId });

            if (wallet) {
                wallet.balance += totalRefundAmount;
                await wallet.save();
            } else {
                const newWallet = new Wallet({
                    userId: orderData.userId,
                    balance: totalRefundAmount
                });
                await newWallet.save();
            }

           
            const transaction = new Transaction({
                walletId: wallet ? wallet._id : newWallet._id,
                userId: orderData.userId,
                type: "credit",
                amount: totalRefundAmount,
                associatedOrder: orderId,
                status: "success"
            });
            await transaction.save();
        }

        
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $set: { status: status } },
            { new: true }
        );

        return res.status(200).json({ success: true, updatedOrder });

    } catch (error) {
        console.error("Error occurred in changeStatus:", error);
        res.redirect("/pageerror");
    }
};

const changeStatusToApproveRequest = async (req, res) => {
    try {
        console.log("reqoust.body", req.body);
        const { orderId, productId, quantity, specId, productId_id, totalAmount} = req.body;

        let convertAmount = Number(totalAmount)
        const changeProductStatus = await Order.updateOne(
            { _id: orderId, "products._id": productId },
            { $set: { "products.$.status": "Return Approved" } }
        );

        if (changeProductStatus.modifiedCount === 0) {
            return res.status(400).json({ success: false, message: "Something went wrong" });
        }
       
        const changeQuantityOfProduct = await Product.updateOne(
            { _id: productId_id, "specification._id": specId },
            { $inc: { "specification.$.quantity": quantity } }
        )

        console.log("skadhfk", changeQuantityOfProduct)

        if(changeQuantityOfProduct.modifiedCount === 0){
            return res.status(400).json({success: false, message: "Something went wrong" })
        }

        const findOrder = await Order.findOne({_id:orderId})

        let userId = findOrder.userId

        const findWallet = await Wallet.findOne({userId:userId})

        console.log("This is my wallet", findWallet)

        if(!findWallet){
           let  wallet = new Wallet({
                userId,
                balance:convertAmount
            })
            await wallet.save()
            console.log("wallet not so it created", wallet)
        }

        findWallet.balance += convertAmount
        await findWallet.save()

        console.log("wallet already exist", findWallet)

        const transaction = new Transaction({
            walletId: findWallet._id,
            userId,
            type: "credit",
            amount: convertAmount,
            associatedOrder: orderId,
            status: "success"
        })

        console.log("transarion",transaction)

        await transaction.save()
        console.log("transation added")
        return res.status(200).json({ success: true, message: "Request approved successfully" });

    } catch (error) {
        console.error("Error in changeStatusToApproveRequest:", error);
        res.redirect("/pageerror");
    }
};

const changeStatusTorejected = async(req,res) =>{
    try {
        const {orderId, productId} = req.body
        console.log("fasldfj",req.body)
        const orderStatus =  await Order.updateOne(
            { _id: orderId, "products._id": productId },
            { $set: { "products.$.status": "Return Rejected" } }
        );
        console.log("askdjfhjh",orderStatus)
        if(orderStatus.modifiedCount === 0){
            return res.status(404).json({success:false, message: "Order not found"})
        }

        return res.status(200).json({success:true, message: "Successfull"})
    } catch (error) {
        console.error("This error occured in changeStatusTorejected",error)
        res.redirect("/pageerror")
    }
}

module.exports = {
    getOrderPage,
    getOrderDetailPage,
    changeStatus,
    changeStatusToApproveRequest,
    changeStatusTorejected
}
