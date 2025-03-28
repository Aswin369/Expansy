const Order = require("../../models/orderSchema")
const PDFDocument = require("pdfkit")
const ExcelJS = require("exceljs")
const Offer = require("../../models/offerSchema")

const getSaleReport = async (req, res) => {
    try {
        const salesData = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalCancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } },
                    totalPending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                    totalSuccess: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
                    totalSale: { $sum: "$payableAmount" },
                    totalDiscount: { $sum: "$offerAndCouponAmount" }
                }
            }
        ])

        const result = salesData.length > 0 ? salesData[0] : {
            totalOrders: 0,
            totalCancelled: 0,
            totalPending: 0,
            totalSuccess: 0,
            totalSale: 0,
            totalDiscount: 0
        };

        console.log("total report", result)

        res.render("saleReport", {
            totalOrders: result.totalOrders,
            totalCancelled: result.totalCancelled,
            totalPending: result.totalPending,
            totalSuccess: result.totalSuccess,
            totalSale: result.totalSale,
            totalDiscount: result.totalDiscount
        })

    } catch (error) {
        console.error("This error occurred in getSaleReport:", error);
        res.redirect("/pageerror");
    }
}


const saleReportFilter = async (req, res) => {
    try {
        console.log("Request Data:", req.body);
        const { startDate, endDate, paymentStatus } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);
        
    
        end.setHours(23, 59, 59, 999);

       
        const filter = { 
            createdAt: { $gte: start, $lte: end }
        };
        
     
        if (paymentStatus && paymentStatus.length > 0) {
            
            if (Array.isArray(paymentStatus)) {
                filter.paymentStatus = { $in: paymentStatus };
            } else {
                filter.paymentStatus = paymentStatus;
            }
        }

        const orders = await Order.find(filter)
            .populate("userId", "name") 
            .sort({ createdAt: -1 }); 

        console.log("Filtered orders count:", orders.length);

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error("This error occurred in saleReportFilter:", error);
        res.json({ success: false, message: "An error occurred while filtering sales data." });
    }
};

const generatePdfReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

       
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        
        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end },
            paymentStatus: 'success'  
        }).populate('userId', 'name');

    
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            bufferPages: true 
        });

        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfData = Buffer.concat(chunks);
            res.setHeader('Content-Length', pdfData.length);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=SalesReport_${startDate}_to_${endDate}.pdf`);
            res.send(pdfData);
        });

     
        doc.fontSize(18).text('Sales Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Date Range: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1);

       
        const tableTop = 150;
        const tableLeft = 50;
        const colWidths = [80, 100, 80, 80, 80, 80];
        const headers = ['Order ID', 'Customer', 'Date', 'Amount', 'Payment', 'Status'];
        
        
        doc.fontSize(10).font('Helvetica-Bold');
        
        
        doc.text(headers[0], tableLeft, tableTop, { width: colWidths[0], align: 'left' });
        doc.text(headers[1], tableLeft + colWidths[0], tableTop, { width: colWidths[1], align: 'left' });
        doc.text(headers[2], tableLeft + colWidths[0] + colWidths[1], tableTop, { width: colWidths[2], align: 'left' });
        doc.text(headers[3], tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop, { width: colWidths[3], align: 'right' });
        doc.text(headers[4], tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop, { width: colWidths[4], align: 'left' });
        doc.text(headers[5], tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop, { width: colWidths[5], align: 'left' });
        
     
        doc.moveTo(tableLeft, tableTop + 20)
           .lineTo(tableLeft + colWidths.reduce((sum, width) => sum + width, 0), tableTop + 20)
           .stroke();
        
        
        let currentTop = tableTop + 30;
        doc.font('Helvetica');

        orders.forEach((order, index) => {
            
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            });
            const formattedAmount = formatter.format(order.payableAmount);
            
            
            const formattedDate = new Date(order.createdAt).toLocaleDateString();
            
           
            doc.text(order.orderId, tableLeft, currentTop, { width: colWidths[0], align: 'left' });
            doc.text(order.userId ? order.userId.name : 'Unknown', tableLeft + colWidths[0], currentTop, { width: colWidths[1], align: 'left' });
            doc.text(formattedDate, tableLeft + colWidths[0] + colWidths[1], currentTop, { width: colWidths[2], align: 'left' });
            doc.text(formattedAmount, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentTop, { width: colWidths[3], align: 'right' });
            doc.text(order.paymentStatus, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentTop, { width: colWidths[4], align: 'left' });
            doc.text(order.status, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], currentTop, { width: colWidths[5], align: 'left' });
            
           
            doc.strokeColor('#dddddd')
               .moveTo(tableLeft, currentTop + 18)
               .lineTo(tableLeft + colWidths.reduce((sum, width) => sum + width, 0), currentTop + 18)
               .stroke()
               .strokeColor('#000000'); 
            
           
            currentTop += 25; 
           
            if (currentTop > 700) {
                doc.addPage();
                currentTop = 50;
                
              
                doc.fontSize(10).font('Helvetica-Bold');
                
            
                doc.text(headers[0], tableLeft, currentTop, { width: colWidths[0], align: 'left' });
                doc.text(headers[1], tableLeft + colWidths[0], currentTop, { width: colWidths[1], align: 'left' });
                doc.text(headers[2], tableLeft + colWidths[0] + colWidths[1], currentTop, { width: colWidths[2], align: 'left' });
                doc.text(headers[3], tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentTop, { width: colWidths[3], align: 'right' });
                doc.text(headers[4], tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentTop, { width: colWidths[4], align: 'left' });
                doc.text(headers[5], tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], currentTop, { width: colWidths[5], align: 'left' });
                
                
                doc.moveTo(tableLeft, currentTop + 20)
                   .lineTo(tableLeft + colWidths.reduce((sum, width) => sum + width, 0), currentTop + 20)
                   .stroke();
                
                currentTop += 30;
                doc.font('Helvetica');
            }
        });
        
    
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold').text(`Total Orders: ${orders.length}`, tableLeft);
        
      
        const totalAmount = orders.reduce((sum, order) => sum + order.payableAmount, 0);
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        });
        
        doc.moveDown(0.5);
        doc.text(`Total Amount: ${formatter.format(totalAmount)}`, tableLeft);
        
        
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).text(
                `Page ${i + 1} of ${totalPages}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
        }
        
     
        doc.end();
    } catch (error) {
        console.error('Error generating PDF report:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while generating PDF report'
        });
    }
}

const generateExcelReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

       
        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end },
            paymentStatus: 'success' 
        }).populate('userId', 'name');

      
        const workbook = new ExcelJS.Workbook();
        
       
        workbook.creator = 'Sales Report System';
        workbook.lastModifiedBy = 'Admin';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        const worksheet = workbook.addWorksheet('Sales Report', {
            properties: { tabColor: { argb: '4F81BD' } }
        });

       
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 15 },
            { header: 'Customer Name', key: 'customerName', width: 25 },
            { header: 'Order Date', key: 'orderDate', width: 15 },
            { header: 'Amount', key: 'amount', width: 15, style: { numFmt: '"₹"#,##0.00' } },
            { header: 'Payment Status', key: 'paymentStatus', width: 15 },
            { header: 'Order Status', key: 'orderStatus', width: 15 }
        ];

       
        worksheet.getRow(1).height = 24; 
        worksheet.getRow(2).height = 20; 
        
      
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Sales Report';
        titleCell.font = {
            name: 'Arial',
            size: 16,
            bold: true
        };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
       
        worksheet.mergeCells('A2:F2');
        const dateRangeCell = worksheet.getCell('A2');
        dateRangeCell.value = `Date Range: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
        dateRangeCell.font = {
            name: 'Arial',
            size: 12
        };
        dateRangeCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
   
        worksheet.addRow([]);

       
        const headerRow = worksheet.getRow(4);
        headerRow.font = {
            name: 'Arial',
            size: 12,
            bold: true,
            color: { argb: 'FFFFFF' }
        };
        headerRow.height = 20; 
        
        
        worksheet.columns.forEach((column, index) => {
            const cell = headerRow.getCell(index + 1);
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '4F81BD' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

   
        let dataRowIndex = 5; 
        orders.forEach(order => {
            const row = worksheet.addRow({
                orderId: order.orderId,
                customerName: order.userId ? order.userId.name : 'Unknown',
                orderDate: new Date(order.createdAt),
                amount: order.payableAmount,
                paymentStatus: order.paymentStatus,
                orderStatus: order.status
            });
            
            
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                cell.font = {
                    name: 'Arial',
                    size: 11
                };
            });
            
           
            row.getCell(1).alignment = { horizontal: 'center' };
            row.getCell(3).alignment = { horizontal: 'center' }; 
            row.getCell(5).alignment = { horizontal: 'center' };
            row.getCell(6).alignment = { horizontal: 'center' }; 
            const paymentStatusCell = row.getCell(5);
            const orderStatusCell = row.getCell(6);
            
            
            if (order.paymentStatus === 'success') {
                paymentStatusCell.font.color = { argb: '006100' }; 
            }
            
            
            switch(order.status?.toLowerCase()) {
                case 'delivered':
                    orderStatusCell.font.color = { argb: '006100' }
                    break;
                case 'shipped':
                    orderStatusCell.font.color = { argb: '0000FF' }
                    break;
                case 'ordered':
                case 'pending':
                    orderStatusCell.font.color = { argb: 'FF9900' }
                    break;
                case 'cancelled':
                    orderStatusCell.font.color = { argb: 'FF0000' }
                    break;
                case 'return requested':
                    orderStatusCell.font.color = { argb: 'FF00FF' }
                    break;
                case 'return approved':
                    orderStatusCell.font.color = { argb: '008080' }
                    break;
                case 'return rejected':
                    orderStatusCell.font.color = { argb: 'FF0000' }
                    break;
            }
            
            dataRowIndex++;
        });

     
        worksheet.getColumn('orderDate').numFmt = 'dd/mm/yyyy';
        
       
        const summaryRowIndex = dataRowIndex + 2;
        
       
        worksheet.mergeCells(`A${summaryRowIndex}:E${summaryRowIndex}`);
        const totalOrdersCell = worksheet.getCell(`A${summaryRowIndex}`);
        totalOrdersCell.value = 'Total Orders:';
        totalOrdersCell.font = {
            bold: true,
            size: 12
        };
        totalOrdersCell.alignment = { horizontal: 'right' };
        
        const totalOrdersValueCell = worksheet.getCell(`F${summaryRowIndex}`);
        totalOrdersValueCell.value = orders.length;
        totalOrdersValueCell.font = {
            bold: true,
            size: 12
        };
        totalOrdersValueCell.alignment = { horizontal: 'center' };
        
    
        const totalAmount = orders.reduce((sum, order) => sum + (order.payableAmount || 0), 0);
        
        worksheet.mergeCells(`A${summaryRowIndex + 1}:E${summaryRowIndex + 1}`);
        const totalAmountCell = worksheet.getCell(`A${summaryRowIndex + 1}`);
        totalAmountCell.value = 'Total Amount:';
        totalAmountCell.font = {
            bold: true,
            size: 12
        };
        totalAmountCell.alignment = { horizontal: 'right' };
        
        const totalAmountValueCell = worksheet.getCell(`F${summaryRowIndex + 1}`);
        totalAmountValueCell.value = totalAmount;
        totalAmountValueCell.numFmt = '"₹"#,##0.00';
        totalAmountValueCell.font = {
            bold: true,
            size: 12
        };
        totalAmountValueCell.alignment = { horizontal: 'center' };

    
        worksheet.autoFilter = {
            from: { row: 4, column: 1 },
            to: { row: dataRowIndex - 1, column: 6 }
        };


        worksheet.pageSetup = {
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            paperSize: 9, 
            showGridLines: false
        };

      
        const cleanStartDate = startDate.replace(/[^\w-]/g, '-');
        const cleanEndDate = endDate.replace(/[^\w-]/g, '-');
        const fileName = `SalesReport_${cleanStartDate}_to_${cleanEndDate}.xlsx`;

    
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

       
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel report:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while generating Excel report'
        });
    }
};

module.exports = {
    getSaleReport,
    saleReportFilter,
    generateExcelReport,
    generatePdfReport
}