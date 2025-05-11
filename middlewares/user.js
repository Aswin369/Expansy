const User = require("../models/userSchema");


const userAuth = async (req, res, next) => {
    const { user } = req.session;

    if (user) {
        const userId = req.session.user;
        
     
        const customer = await User.findOne({ _id: userId, isBlocked: true });
        if (customer) {
            req.session.user = null
            res.locals.user = false;
            return res.redirect("/login")
        }

        res.locals.user = true;

    } else {
        res.locals.user = false;
    }

    next();
};

module.exports = userAuth;



