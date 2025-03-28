const userAuth = (req,res,next)=>{
    const {user} = req.session;
    if(user){
        res.locals.user = true;
    }else{
        res.locals.user = false
    }
    next()
}

module.exports = userAuth;