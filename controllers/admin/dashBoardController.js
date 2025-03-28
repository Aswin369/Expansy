const Brand = require("../../models/brandSchema")
const Product = require("../../models/productSchema")
const Order = require("../../models/orderSchema")

const getSalesReport = async (req, res) => {
    const { filter, startDate, endDate } = req.query



    console.log("thsdf", req.query)

    let matchCondition = {};
    let labels = [];
    let  salesValues= [];

    
    if (filter === 'custom') {
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Please provide a valid date range.' });
        }
        matchCondition.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };

        console.log("condition object", matchCondition)
        const start = new Date(startDate);
        const end = new Date(endDate);
        console.log("This start date",start)
        console.log("This end date",end)
        while (start <= end) {
            labels.push(`${start.getDate()}-${start.getMonth() + 1}-${start.getFullYear()}`);
            salesValues.push(0); 
            start.setDate(start.getDate() + 1);
        }

    } else if (filter === 'weekly') {
        const today = new Date();
        const pastWeek = new Date(today);
        pastWeek.setDate(today.getDate() - 6); 

        matchCondition.createdAt = {
            $gte: pastWeek,
            $lte: today
        };

        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            labels.push(`${date.getDate()}-${date.getMonth() + 1}`);
            salesValues.push(0); 
        }

    } else if (filter === 'monthly') {
        const thisYear = new Date().getFullYear();
        matchCondition.createdAt = {
            $gte: new Date(`${thisYear}-01-01`),
            $lte: new Date(`${thisYear}-12-31`)                                                                                                                                                                                                                                  
        };

        
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        salesValues = new Array(12).fill(0); 
    } else if (filter === 'yearly') {
        const thisYear = new Date().getFullYear();
        matchCondition.createdAt = {
            $gte: new Date(`${thisYear - 5}-01-01`),  
            $lte: new Date(`${thisYear}-12-31`)
        };

        
        for (let i = 5; i >= 0; i--) {
            labels.push(`${thisYear - i}`);
            salesValues.push(0);
        }
    }

    try {
        const salesData = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: filter === 'yearly'
                        ? { year: { $year: "$createdAt" } } 
                        : filter === 'monthly'
                        ? { month: { $month: "$createdAt" } } 
                        : filter === 'weekly' || filter === 'custom'
                        ? { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" } }
                        : { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    totalSales: { $sum: "$payableAmount" }
                }
            }
        ]);

        console.log("filterdata",salesData)
        
        salesData.forEach(item => {
            if (filter === 'yearly') {
                const index = labels.indexOf(`${item._id.year}`);
                if (index !== -1) salesValues[index] = item.totalSales;
            } else if (filter === 'monthly') {
                const index = item._id.month - 1;
                salesValues[index] = item.totalSales;
            } else {
                const label = filter === 'custom'
                ? `${item._id.day}-${item._id.month}-${new Date().getFullYear()}`
                : `${item._id.day}-${item._id.month}`;
                console.log("label",label)
                const index = labels.indexOf(label);
                if (index !== -1) salesValues[index] = item.totalSales;
            }
        });
        
        console.log("labels",labels)

        res.json({ labels, salesData: salesValues });

    } catch (error) {
        console.error("Error fetching sales report:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


const getTopthings = async (req, res)=>{
    try {
        const { filter } = req.query;

        if (filter === "products") {
            const topProducts = await Order.aggregate([
                { $unwind: "$products" },
                {
                    $group: {
                        _id: "$products.productId",
                        count: { $sum: "$products.quantity" }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        name: "$productDetails.productName",
                        count: 1
                    }
                }
            ]);
            return res.json(topProducts);
        }

        if (filter === "categories") {
            const topCategories = await Order.aggregate([
                { $unwind: "$products" },
                {
                    $lookup: {
                        from: "products",
                        localField: "products.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $lookup: {
                        from: "categories",
                        localField: "productDetails.category",
                        foreignField: "_id",
                        as: "categoryDetails"
                    }
                },
                { $unwind: "$categoryDetails" },
                {
                    $group: {
                        _id: "$categoryDetails._id",
                        name: { $first: "$categoryDetails.name" },
                        count: { $sum: "$products.quantity" }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);
            return res.json(topCategories);
        }

        if (filter === "brands") {
            const topBrands = await Order.aggregate([
                { $unwind: "$products" },
                {
                    $lookup: {
                        from: "products",
                        localField: "products.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $lookup: {
                        from: "brands",
                        localField: "productDetails.brand",
                        foreignField: "_id",
                        as: "brandDetails"
                    }
                },
                { $unwind: "$brandDetails" },
                {
                    $group: {
                        _id: "$brandDetails._id",
                        name: { $first: "$brandDetails.brandName" },
                        count: { $sum: "$products.quantity" }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);
            return res.json(topBrands);
        }

        return res.status(400).json({ message: "Invalid filter parameter" });
    } catch (error) {
        console.error("Error fetching top-selling data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


module.exports = {
    getSalesReport,
    getTopthings
}