const express = require("express")
const Product = require("../../models/productSchema")
const Brand = require("../../models/brandSchema")
const Category = require("../../models/categorySchema")
const StatusCode = require("../../constants/statusCode")

const getShopPage = async (req, res) => {
    try {
        const queryObj = { isBlocked: false };
        
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        console.log("Query params:", req.query);

        // Brand filtering
        if (req.query.brand && req.query.brand !== 'All') {
            const brandName = req.query.brand.trim();
            const brand = await Brand.findOne({
                brandName: { $regex: new RegExp('^' + brandName + '$', 'i') }
            });

            console.log("Brand matched:", brand);

            if (brand) {
                queryObj.brand = brand._id;
            } else {
                console.log(`Brand not found: ${brandName}`);
            }
        }

        // Price range filtering (inside specification array)
        if (req.query.price) {
            const priceRange = req.query.price;
            let minPrice, maxPrice;

            if (priceRange.includes('+')) {
                minPrice = parseFloat(priceRange.replace(/[₹,+\s]/g, ''));
                maxPrice = Number.MAX_SAFE_INTEGER;
            } else {
                const [min, max] = priceRange.split('-').map(p =>
                    parseFloat(p.replace(/[₹,\s]/g, ''))
                );
                minPrice = min;
                maxPrice = max;
            }

            // Make sure we have valid numbers
            if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                queryObj['specification.0.salePrice'] = { $gte: minPrice, $lte: maxPrice };
            }
        }

        // Category filtering
        if (req.query.category && req.query.category !== 'All') {
            const categoryName = req.query.category.trim();
            const category = await Category.findOne({
                name: { $regex: new RegExp('^' + categoryName + '$', 'i') }
            });

            console.log("Category matched:", category);

            if (category) {
                queryObj.category = category._id;
            } else {
                console.log(`Category not found: ${categoryName}`);
            }
        }

        // Search filtering
        if (req.query.search) {
            queryObj.productName = {
                $regex: new RegExp(req.query.search.trim(), 'i')
            };
        }

        console.log('Final Query Object:', queryObj);

        // Count total products before applying pagination
        const totalProducts = await Product.countDocuments(queryObj);
        const totalPages = Math.ceil(totalProducts / limit);

        // Sorting
        let sortOption = {};
        switch (req.query.sort) {
            case 'a-z':
                sortOption = { productName: 1 };
                break;
            case 'z-a':
                sortOption = { productName: -1 };
                break;
            case 'new':
                sortOption = { createdAt: -1 };
                break;
            case 'high-low':
                sortOption = { 'specification.0.salePrice': -1 };
                break;
            case 'low-high':
                sortOption = { 'specification.0.salePrice': 1 };
                break;
            default:
                sortOption = { createdAt: -1 }; // Default to newest first
        }

        // Fetch products with pagination and sorting
        const products = await Product.find(queryObj)
            .populate('brand')
            .populate('category')
            .populate('specification.ram')
            .populate('specification.storage')
            .populate('specification.color')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        console.log(`Found ${products.length} products for page ${page}`);

        // Get all brands for the filter options
        const allBrands = await Brand.find({ isBlocked: false });

        // If AJAX request, return JSON response
        if (req.query.ajax === 'true') {
            return res.json({
                products: products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProducts
                }
            });
        }

        // For regular page load, render the template
        const activeFilters = {
            brand: req.query.brand || 'All',
            price: req.query.price || '',
            category: req.query.category || '',
            sort: req.query.sort || '',
            search: req.query.search || ''
        };

        console.log('Active Filters:', activeFilters);

        res.render('shop-page', {
            product: products,
            brands: allBrands,
            currentPage: page,
            totalPages,
            totalProducts,
            activeFilters: JSON.stringify(activeFilters)
        });

    } catch (error) {
        console.error('Shop page error:', error);

        if (req.query.ajax === 'true') {
            return res.status(500).json({ error: 'Error fetching products' });
        }

        res.status(500).render('error', {
            message: 'Something went wrong fetching products'
        });
    }
};


module.exports = {
    getShopPage
}
