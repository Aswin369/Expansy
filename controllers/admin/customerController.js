const User = require("../../models/userSchema")
const mongoose = require("mongoose");
const StatusCode = require("../../constants/statusCode")

const customerInfo = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search.trim();
        }

        let page = parseInt(req.query.page) || 1;
        const limit = 9;

        
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        })
            .sort({ createdAt: -1 })       
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        
        

        const formattedUserData = userData.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            date: user.createdAt, 
            isBlocked: user.isBlocked,
        }));
      
        
        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        });

        const totalPages = Math.ceil(count / limit);

        res.render("customer-manegment", {
            data: formattedUserData, 
            totalPages,
            currentPage: page,
            search
        });
        
    } catch (error) {
        console.error("Error fetching customer data:", error);
        res.status(StatusCode.INTERNAL_SERVER_ERROR).send("Server Error");
    }
};




const customerBlocked = async (req, res) => {
    try {
        const id = req.body.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.json({ success: true });
    } catch (error) {
        console.error("Error blocking customer:", error.message);
        res.json({ success: false });
    }
};

const uncustomerBlocked = async (req, res) => {
    try {
        const id = req.body.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.json({ success: true });
    } catch (error) {
        console.error("Error unblocking customer:", error.message);
        res.json({ success: false });
    }
};

const customerdetail = async (req, res) => {
    try {
        const userId = req.query.id;
        console.log("Received User ID:", userId);
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            console.error("Invalid or missing User ID");
            return res.redirect("/admin/users");
        }
        const user = await User.findById(userId);
        console.log("Fetched User:", user);

        if (!user) {
            console.error("User not found");
            return res.redirect("/admin/users");
        }
        res.render("customerdetails", { user });
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.redirect("/pageerror");
    }
};


const searchCustomers = async (req, res) => {
    try {
      const search = req.query.search || '';
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      
      
      const userData = await User.find({
        isAdmin: false,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          { email: { $regex: ".*" + search + ".*", $options: "i" } }
        ]
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();
      
    
      const formattedUserData = userData.map(user => ({
        id: user._id,
        _id: user._id, 
        name: user.name,
        email: user.email,
        date: user.createdAt,
        isBlocked: user.isBlocked
      }));
      
     
      const count = await User.countDocuments({
        isAdmin: false,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          { email: { $regex: ".*" + search + ".*", $options: "i" } }
        ]
      });
      
      const totalPages = Math.ceil(count / limit);
      
      
      res.json({
        success: true,
        data: formattedUserData,
        currentPage: page,
        totalPages: totalPages,
        totalCustomers: count
      });
      
    } catch (error) {
      console.error("Error searching customers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search customers"
      });
    }
  };

module.exports = {
    customerInfo,
    customerBlocked,
    uncustomerBlocked,
    customerdetail,
    searchCustomers
}