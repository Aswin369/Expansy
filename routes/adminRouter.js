const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin/adminController")
const customerController = require("../controllers/admin/customerController")
const {adminAuth} = require("../middlewares/auth")
const upload = require("../middlewares/multer")
const categoryController = require("../controllers/admin/categoryController")
const productController = require("../controllers/admin/productController")
const brandController = require("../controllers/admin/BrandController")
const variantController = require("../controllers/admin/variantController")
const orderController = require("../controllers/admin/orderController")
const couponController = require("../controllers/admin/counponController")
const offerController = require("../controllers/admin/offerController")
const saleReportController = require("../controllers/admin/saleReportController")
const walletController = require("../controllers/admin/walletController")
const dashBoardController = require("../controllers/admin/dashBoardController")

// router.get("/pageerror",adminController.pageerror)
router.get("/login",adminController.loadLogin)
router.post("/login",adminController.login)
router.get("/dashboard",adminAuth,adminController.loadDashboard)
router.get("/logout", adminController.logout)
// Customer mangement
router.get("/users",adminAuth,customerController.customerInfo)
router.post("/blockCustomer", adminAuth, customerController.customerBlocked);
router.post("/unblockCustomer", adminAuth, customerController.uncustomerBlocked);
router.get("/customerdetails",adminAuth,customerController.customerdetail)
router.get("/admin/customerdetails", adminAuth, customerController.customerdetail);
router.get('/search-customers', adminAuth, customerController.searchCustomers);
// Category management
router.get("/category",adminAuth,categoryController.categoryInfo)
router.get("/addCategory", adminAuth,categoryController.loadAddCategory)
router.post("/addCategory", upload.single('image'),adminAuth, categoryController.addCategory);
router.post('/listCategory', adminAuth,categoryController.listCategory);
router.post('/unlistCategory', adminAuth, categoryController.unlistCategory);
router.get("/editCategory/:id", adminAuth, categoryController.getEditCategory)
router.post("/editCategory/:id",upload.single('image'),adminAuth,categoryController.updateCategory)
// Brand Management
router.get("/brands", adminAuth, brandController.getBrandPage);
router.post("/addBrand",upload.single('brandImage'),adminAuth, brandController.addBrand)
router.get("/blockBrand",adminAuth, brandController.blockBrand)
router.get("/unBlockBrand", adminAuth, brandController.unBlockBrand)
router.get("/getEditBrand",adminAuth, brandController.getEditBrand)
router.post("/editBrand/:id",upload.single('brandImage'),adminAuth, brandController.editBrand)
// Product management
router.get("/addProducts",adminAuth, productController.getProductAddPage)
router.post("/addProducts", upload.array("file"),adminAuth,productController.addProducts);
router.get("/products",adminAuth,productController.getAllProducts)
router.get("/blockProduct/:id", adminAuth, productController.blockProduct);
router.get("/UnBlockProduct/:id", adminAuth, productController.UnBlockProduct);
router.get('/editProduct/:id', adminAuth,productController.getEditProduct);
router.put('/editProduct/:productId',upload.single("productImage"),adminAuth,productController.updateImage);
router.get("/viewProducts/:id",adminAuth,productController.viewProduct)
router.put("/updateForm/:productId",adminAuth,productController.updateForm)
router.put("/updateVariantStocks/:productId",adminAuth,productController.updateStocks)
router.delete("/deleteVariantFromEditProduct",adminAuth,productController.deleteVariantEditProduct)
router.get("/getEditVariant",adminAuth,productController.getEditVariant)
router.post("/editVariantStocks",adminAuth,productController.editVariant)
router.get("/search-products",adminAuth, productController.searchController)
// Variant Management
router.get("/getVariant",adminAuth,variantController.getVariantList)
router.get("/getAddVariant",adminAuth,variantController.getAddVariant)
router.post("/addVariant",adminAuth,variantController.addVariants)
router.get("/blockedRam/:id",adminAuth,variantController.blockRam)
router.get("/UnBlockRam/:id",adminAuth,variantController.UnBlockRam)
router.get("/deleteVariant/:id",adminAuth,variantController.deleteVariant)
router.get("/blockedStorage/:id",adminAuth,variantController.blockedStorage)
router.get("/unBlockStorage/:id",adminAuth, variantController.unBlockStorage)
router.get("/deleteStorage/:id",adminAuth,variantController.deleteStorage)
router.get("/deleteColor/:id",adminAuth,variantController.deleteColor)
router.get("/UnBlockColor/:id",adminAuth,variantController.unBlockColor)
router.get("/blockColor/:id",adminAuth,variantController.blockColor)
// Order Managment
router.get("/getOrderPage",adminAuth,orderController.getOrderPage)
router.get("/orderDetail/:id",adminAuth, orderController.getOrderDetailPage)
router.post("/update-status",adminAuth,orderController.changeStatus)
router.post("/approveRequest",adminAuth,orderController.changeStatusToApproveRequest)
router.post("/rejectRequest",adminAuth,orderController.changeStatusTorejected)
// Coupon management
router.get("/getCouponList",adminAuth,couponController.getcouponList)
router.get("/getCouponaddPage",adminAuth,couponController.getCouponAddPage)
router.post("/createCoupon",adminAuth,couponController.getCouponData)
router.get("/banCoupon/:id",adminAuth,couponController.banCoupon)
router.get("/unbanCoupon/:id",adminAuth,couponController.unBanCoupon)
router.get("/editCoupon/:id",adminAuth,couponController.getEditCoupon)
router.post("/updateCoupon",adminAuth,couponController.updateCoupon)
// Offer management
router.get("/getOfferList",adminAuth,offerController.getOfferList)
router.get("/getCreateOffer",adminAuth,offerController.getCreateOffer)
router.post("/createOffer",adminAuth,offerController.createOffer)
router.get("/offerBan/:id",adminAuth,offerController.banOffer)
router.get("/offerUnban/:id",adminAuth,offerController.unBanOffer)
router.get("/editOffer/:id",adminAuth,offerController.getEditOffer)
router.post("/editOffer",adminAuth, offerController.editOffer)
// Sale report management
router.get("/getSaleReportPage",adminAuth,saleReportController.getSaleReport)
router.post("/saleReportFilter",adminAuth,saleReportController.saleReportFilter)
router.get('/saleReportExcel',adminAuth,saleReportController.generateExcelReport);
router.get('/saleReportPdf', adminAuth,saleReportController.generatePdfReport);
// Wallet Transaction
router.get("/getWalletListingPage",adminAuth,walletController.getWalletList)
router.get("/viewDetails/:id",adminAuth,walletController.viewDetails)
// DashBoard
router.get("/report",adminAuth,dashBoardController.getSalesReport)
router.get("/topselling",adminAuth,dashBoardController.getTopthings)

module.exports = router