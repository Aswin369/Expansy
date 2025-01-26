const express = require("express")
const Category = require("../../models/categorySchema")
const {handleUpload} = require("../../config/cloudinary")

const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 4;
        const skip = (page - 1) * limit; 

        
        const categoryData = await Category.find({})
            .sort({ createdAt: -1 }) 
            .skip(skip) 
            .limit(limit) 
            .select("image name description createdAt updatedAt isListed"); 

        
        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        
        const categoriesWithSerialNumbers = categoryData.map((category, index) => ({
            no: skip + index + 1, 
            image: category.image || '/assets/images/default.png', 
            name: category.name,
            description: category.description,
            createdAt: category.createdAt.toLocaleDateString(), 
            updatedAt: category.updatedAt.toLocaleDateString(), 
            status: category.isListed ? "Listed" : "Unlisted"
        }));

        
        res.render("category-list", {
            cat: categoriesWithSerialNumbers,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};



const addCategory = async (req, res) => {
    const { name, description, croppedImage } = req.body; 
    console.log("name",name)
    console.log("description",description)

    try {
        
        if (!name || !description) {
            return res.status(400).json({ error: "Name and description are required" });
        }

        
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }

        
        const newCategory = new Category({
            name,
            description,
        });

        
        if (croppedImage) {
            
            const base64Data = croppedImage.replace(/^data:image\/jpeg;base64,/, "");
            const cldRes = await handleUpload(`data:image/jpeg;base64,${base64Data}`);
            newCategory.image = cldRes.secure_url;
        } else if (req.file) {
            
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const cldRes = await handleUpload(dataURI);
            newCategory.image = cldRes.secure_url;
        }

        await newCategory.save();

        return res.json({ message: "Category added successfully" });
    } catch (error) {
        console.error("Error adding category:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};


const loadAddCategory = async (req,res)=>{
    try {
        res.render("category-add")
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
}


module.exports = {
    categoryInfo,
    addCategory,
    loadAddCategory
}
