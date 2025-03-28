const express = require("express")
const Product = require("../../models/productSchema")
const Brand = require("../../models/brandSchema")
const Category = require("../../models/categorySchema")


const getShopPage = async (req, res) => {
    try {
   
        const queryObj = { isBlocked: false };
        
        
        const page = parseInt(req.query.page) || 1;
        const limit = 8; 
        const skip = (page - 1) * limit;
     
        if (req.query.brand && req.query.brand !== 'All') {
            
            const brand = await Brand.findOne({ brandName: req.query.brand });
            if (brand) {
                queryObj.brand = brand._id;
                console.log("Found brand:", brand);
            } else {
                console.log("Brand not found:", req.query.brand);
            }
        }
        
       
        if (req.query.price) {
            
            const priceRange = req.query.price;
            let minPrice, maxPrice;
            
           
            if (priceRange.includes('+')) {
                minPrice = parseFloat(priceRange.replace(/[₹,\+\s]/g, ''));
                maxPrice = Number.MAX_SAFE_INTEGER;
            } else {
               
                const [min, max] = priceRange.split('-').map(p => 
                    parseFloat(p.replace(/[₹,\s]/g, ''))
                );
                minPrice = min;
                maxPrice = max;
            }
            
           
            queryObj['specification.salePrice'] = { 
                $gte: minPrice, 
                $lte: maxPrice 
            };
        }
        
       
        if (req.query.category && req.query.category !== 'All') {
          
            const category = await Category.findOne({ 
                name: { $regex: new RegExp(req.query.category, 'i') } 
            });
            if (category) {
                queryObj.category = category._id;
            }
        }
        
     
        if (req.query.search) {
            queryObj.productName = { 
                $regex: new RegExp(req.query.search, 'i') 
            };
        }
        
        
        let sortOption = {};
        
        if (req.query.sort) {
            switch(req.query.sort) {
                case 'a-z':
                    sortOption = { productName: 1 }; 
                    break;
                case 'z-a':
                    sortOption = { productName: -1 }; 
                    break;
                case 'new':
                    sortOption = { createdAt: -1 };
                    break;
                default:
                    sortOption = { createdAt: -1 }; 
            }
        } else {
            
            sortOption = { createdAt: -1 };
        }
        
       
        
        
        const totalProducts = await Product.countDocuments(queryObj);
        const totalPages = Math.ceil(totalProducts / limit);
        
       
        const products = await Product.find(queryObj)
            .populate('brand')
            .populate('category')
            .populate('specification.ram')
            .populate('specification.storage')
            .populate('specification.color')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);
        
       
        const allBrands = await Brand.find({ isBlocked: false });
        
        
        res.render('shop-page', {
            product: products,
            brands: allBrands, 
            currentPage: page,
            totalPages,
            totalProducts,
            
            activeFilters: {
                brand: req.query.brand || 'All',
                price: req.query.price || '',
                category: req.query.category || '',
                sort: req.query.sort || '',
                search: req.query.search || ''
            }
        });
        
    } catch (error) {
        console.error('Shop page error:', error);
        res.status(500).render('error', { 
            message: 'Something went wrong fetching products' 
        });
    }
}

module.exports = {
    getShopPage
}
