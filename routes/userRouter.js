const express = require("express")
const router = express.Router()
const userController = require("../controllers/user/userController")
const passport = require("../config/passport.js")
const {userAuth} = require("../middlewares/auth")
const productController = require("../controllers/user/productDetailController.js")
const shopPageController = require("../controllers/user/shopPageController.js")
const profileController = require("../controllers/user/profileController.js")
const shoppingCartController = require('../controllers/user/shoppingCartController.js')
const wishListController = require("../controllers/user/whishListController.js")
const palceOderController = require("../controllers/user/placeOderController.js")

router.get("/",userController.loadHomepage)
router.get("/signup",userController.loadsignup)
router.post("/signup",userController.signup)
router.get("/login",userController.loadlogin)
router.post("/login",userController.login)

router.get("/otpverification",userController.verification)
router.post("/otpverification",userController.verifyOtp)
router.post("/resendOtp",userController.resendOtp)

router.get("/auth/google",passport.authenticate('google',{scope:["profile","email"],prompt: 'select_account'}))
router.get("/auth/google/callback",passport.authenticate("google",{ failureRedirect: "/auth/google/failure"}), (req, res)=>{
    res.redirect("/")
})

router.get("/auth/google/failure", (req, res) => {
    // Redirect to signup page with message
    console.log('HELLO I AM here')
    res.redirect("/signup?error=Your%20account%20is%20blocked.%20Contact%20support.");
});



router.get("/logout",userController.logout)
router.get("/productDetailPage/:id",productController.productDetail)
router.get("/shop",shopPageController.getShopPage)



// userForgot password
router.get("/forgot-password",profileController.getForgotPassPage)
router.get("/forgot-email-valid",profileController.getVerifyOtpPage)
router.post("/forgot-email-valid",profileController.forgotEmailValid)
router.post("/verify-pass-forgot-otp",profileController.verifyForgotPassOtp)
router.post("/verify-pass-resend-otp",profileController.verifyPasswordResendOTP)
router.get("/change-password",profileController.getchangePasswordPage)
router.post("/change-password",profileController.changePassword)
router.post("/profile-page-change-password", profileController.profilePageChangePassword)
// user profile management
router.get("/profile",userAuth,profileController.getProfilePage)
router.post("/editProfile",userAuth,profileController.editUserProfile)
router.post("/addaddress",userAuth,profileController.addUserAddress)
router.delete("/deleteAddress/:addressId",userAuth,profileController.deleteAddress)
router.get("/getAddress/:addressId",userAuth,profileController.getUserAddressId)
router.post("/updateAddress/:addressId",userAuth,profileController.updateAddress)
router.get("/ordersview/:orderId",userAuth,profileController.loadOrderDetailPage)
router.get("/deleteOrder",userAuth,profileController.deleteOrder)
router.post("/cancelOrder",userAuth,profileController.cancelOrder)
router.get("/returnRequest",userAuth,profileController.returnRequest)
router.get('/invoice/:orderId',userAuth, profileController.generateInvoice)
router.post("/orderDetailPageRazopay",userAuth,profileController.orderDetailRazorpay)
router.post("/orderVerifyPayment",userAuth, profileController.orderVerifyPayment)
// shopping cart management
router.get('/shoppingCart',userAuth,shoppingCartController.getShoppingCart)
router.post("/addToCart",shoppingCartController.productAddToCart)
router.delete("/deleteCartProduct/:productId",shoppingCartController.deleteProductFromCart)
router.post('/update-cart-item',userAuth,shoppingCartController.updateCart)
router.get("/process-checkout",userAuth, shoppingCartController.loadCheckOutPage)
router.get("/checkout",userAuth, shoppingCartController.loadplaceOrder)
router.post("/placeOrder",userAuth, shoppingCartController.addOrderDetails)
router.get("/ordersuccess",userAuth, shoppingCartController.loadSuccessPage)
router.get("/orderpaymentfailed",userAuth,shoppingCartController.getOrderPaymentFailed)
router.post("/createRazorpayOrder",userAuth,shoppingCartController.razorpayOrder)
router.post("/verifyPayment",userAuth,shoppingCartController.verifiyPayment)
router.post("/applyCoupon",userAuth,shoppingCartController.applyCoupon)
// WhishList management
router.get("/getWhishlist",userAuth,wishListController.getWhishList)
router.post("/addtowishlist",wishListController.addTOWhishlistFromProductDetail)
router.get("/deleteWhishlist/:id",userAuth,wishListController.deleteWhishlist)
router.post("/addToCartFormWhislist",userAuth,wishListController.addToCartFromWhishlist)
// Place order
router.get("/palceOder",userAuth,palceOderController.getPlaceOrderPage)
router.post("/checkOutAddAddress",userAuth,palceOderController.checkOutAddAddress)


module.exports = router 