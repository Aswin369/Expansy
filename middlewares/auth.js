const User = require("../models/userSchema")

const userAuth = (req,res,next)=>{
    
    if(req.session.user){
        console.log(1)
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next()
                console.log(2)
            }else{
                
                res.redirect("/login")
            }
        })
        .catch((error)=>{
            console.log("Error in user auth middleware")
            res.status(500).send("internal server error")
        })
    }else{
        console.log("sdjfsdh")
      return  res.redirect("/login")
    }
}


const adminAuth = (req,res,next)=>{
    if(req.session.admin){
    User.findOne({isAdmin:true})
    .then((data)=>{
        if(data){
            next()
        }else{
            res.redirect("/admin/login")
        }
    })
    .catch((err)=>{
        console.log("Error in adminAuth middleware",err)
        res.status(500).send("Internal server error")
    })
}else{
    res.redirect("/admin/login")
}
}


module.exports = {
    userAuth,
    adminAuth
}