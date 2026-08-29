import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = (order, childOrder, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to Express response
  doc.pipe(res);

  // --- Header ---
  doc
    .fillColor('#0F0F11')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('KAIA Technologies', 50, 45)
    .fontSize(10)
    .font('Helvetica')
    .text('Technology from Every Brand. One Powerful Marketplace.', 50, 70)
    .fillColor('#6B7280')
    .text('Support: support@kaia.tech | www.kaia.tech', 50, 85)
    .moveDown();

  // Invoice label
  doc
    .fillColor('#0F0F11')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('TAX INVOICE', 350, 45, { align: 'right' })
    .fontSize(10)
    .font('Helvetica')
    .text(`Invoice No: ${childOrder.invoiceNumber || 'INV-TEMP-' + childOrder.orderId}`, 350, 65, { align: 'right' })
    .text(`Date: ${new Date(childOrder.createdAt).toLocaleDateString()}`, 350, 80, { align: 'right' })
    .text(`Order ID: ${childOrder.orderId}`, 350, 95, { align: 'right' })
    .moveDown(2);

  doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 120).lineTo(550, 120).stroke();

  // --- Addresses ---
  const billingTop = 135;
  doc
    .fillColor('#0F0F11')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Sold By (Seller):', 50, billingTop)
    .font('Helvetica')
    .text(childOrder.seller.name, 50, billingTop + 15)
    .text(childOrder.seller.businessDetails?.address || 'Brand Warehouse Address', 50, billingTop + 30)
    .text(`GSTIN: ${childOrder.seller.businessDetails?.gstin || 'Not Provided'}`, 50, billingTop + 55);

  doc
    .font('Helvetica-Bold')
    .text('Billed To (Customer):', 300, billingTop)
    .font('Helvetica')
    .text(order.shippingAddress.name, 300, billingTop + 15)
    .text(`${order.shippingAddress.street}, ${order.shippingAddress.city}`, 300, billingTop + 30)
    .text(`${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`, 300, billingTop + 45)
    .text(`Phone: ${order.shippingAddress.phone}`, 300, billingTop + 60)
    .text(`GSTIN: ${order.gstNumber || 'N/A'}`, 300, billingTop + 75);

  doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 230).lineTo(550, 230).stroke();

  // --- Table of Items ---
  const tableTop = 250;
  doc
    .font('Helvetica-Bold')
    .text('Product Description', 50, tableTop)
    .text('Qty', 300, tableTop, { width: 30, align: 'right' })
    .text('Unit Price', 350, tableTop, { width: 60, align: 'right' })
    .text('GST Rate', 420, tableTop, { width: 60, align: 'right' })
    .text('Total (INR)', 490, tableTop, { width: 60, align: 'right' });

  doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 265).lineTo(550, 265).stroke();

  let currentY = 280;
  childOrder.items.forEach((item) => {
    const itemTotal = item.price * item.qty;
    
    doc
      .font('Helvetica')
      .text(item.name, 50, currentY, { width: 230 })
      .text(item.qty.toString(), 300, currentY, { width: 30, align: 'right' })
      .text(`₹${item.price.toLocaleString()}`, 350, currentY, { width: 60, align: 'right' })
      .text(`${item.gstRate}%`, 420, currentY, { width: 60, align: 'right' })
      .text(`₹${itemTotal.toLocaleString()}`, 490, currentY, { width: 60, align: 'right' });

    if (item.serialNumbers && item.serialNumbers.length > 0) {
      doc
        .fontSize(8)
        .fillColor('#4B5563')
        .text(`Serials: ${item.serialNumbers.join(', ')}`, 50, currentY + 15, { width: 230 })
        .fontSize(10)
        .fillColor('#0F0F11');
      currentY += 15;
    }

    currentY += 30;
  });

  doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, currentY).lineTo(550, currentY).stroke();

  // --- Financial Summary ---
  const summaryY = currentY + 15;
  doc
    .font('Helvetica')
    .text('Subtotal:', 350, summaryY, { width: 100, align: 'right' })
    .text(`₹${childOrder.subtotal.toLocaleString()}`, 470, summaryY, { width: 80, align: 'right' })
    
    .text('GST Tax Component:', 350, summaryY + 15, { width: 100, align: 'right' })
    .text(`₹${childOrder.gstAmount.toLocaleString()}`, 470, summaryY + 15, { width: 80, align: 'right' })

    .text('Shipping Split:', 350, summaryY + 30, { width: 100, align: 'right' })
    .text(`₹${childOrder.shippingAmount.toLocaleString()}`, 470, summaryY + 30, { width: 80, align: 'right' })

    .font('Helvetica-Bold')
    .text('Final Amount Paid:', 350, summaryY + 50, { width: 100, align: 'right' })
    .text(`₹${childOrder.finalAmount.toLocaleString()}`, 470, summaryY + 50, { width: 80, align: 'right' });

  // --- Footer Notice ---
  doc
    .fontSize(8)
    .fillColor('#9CA3AF')
    .text('This is a computer-generated tax invoice and does not require a physical signature.', 50, 700, { align: 'center' })
    .text('All goods listed are covered under respective brand policies. For warranty support, visit authorized brand service centers.', 50, 715, { align: 'center' });

  // End PDF Document
  doc.end();
};
