const Transaction = require("../../models/walletTransaction")
const Wallet = require("../../models/walletSchema")

const getWalletList = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 4
        const skip = (page-1)*limit

        const walletData = await Wallet.find({})
        const walletTransactionData = await Transaction.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .populate("userId")

        const totalTransaction = await Transaction.countDocuments()
        const totalPages = Math.ceil(totalTransaction/limit)
        

        res.render("walletListing",{
            walletData: walletData,
            walletTransactionData: walletTransactionData,
            currentPage: page,
            totalTransaction: totalTransaction,
            totalPages: totalPages
        })
    } catch (error) {
        console.error("This error occured in getWalletList", error)
        res.redirect("/pageerror")
    }
}

const viewDetails = async (req,res)=>{
    try {
        console.log("reew",req.params.id)
        const walletID = req.params.id
        const TransactionData = await Transaction.findOne({_id:walletID})
        .populate("userId")
        .populate({path: "associatedOrder",
         populate: {
                path: "products.productId",
                model: "Product"
            }})

        console.log("oneTranksdfndata", TransactionData)

        res.render("walletDetail",{
            TransactionData: TransactionData
        })
    } catch (error) {
        console.error("This error occured in viewDetail",error)
        res.redirect("/pageerror")
    }
}

module.exports = {
    getWalletList,
    viewDetails
}