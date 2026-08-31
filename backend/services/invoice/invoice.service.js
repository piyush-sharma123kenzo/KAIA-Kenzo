import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import Invoice from '../../models/Invoice.js';
import SellerOrder from '../../models/SellerOrder.js';
import Order from '../../models/Order.js';
import Brand from '../../models/Brand.js';
import Product from '../../models/Product.js';
import Warranty from '../../models/Warranty.js';
import AuditLog from '../../models/AuditLog.js';
import Notification from '../../models/Notification.js';

export class InvoiceService {
  /**
   * 1. GSTIN Format Validator
   */
  validateGstin(gstin) {
    if (!gstin) return false;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin.trim().toUpperCase());
  }

  /**
   * 2. Generate or Retrieve Invoice for a Paid SellerOrder (Idempotent)
   */
  async generateInvoiceForSellerOrder({ sellerOrderId, paymentDetails = {}, userContext = null }) {
    const isObjectId = mongoose.Types.ObjectId.isValid(sellerOrderId);
    const query = isObjectId ? { $or: [{ _id: sellerOrderId }, { orderId: sellerOrderId }] } : { orderId: sellerOrderId };

    const sellerOrder = await SellerOrder.findOne(query)
      .populate('seller')
      .populate({
        path: 'parentOrder',
        populate: { path: 'customer' },
      });

    if (!sellerOrder) {
      throw new Error('Seller Order not found.');
    }

    const parentOrder = sellerOrder.parentOrder;
    if (!parentOrder) {
      throw new Error('Parent Master Order not found.');
    }

    // Payment validation: Must be Paid
    if (sellerOrder.paymentStatus !== 'Paid' && parentOrder.paymentStatus !== 'Paid') {
      throw new Error('Cannot issue tax invoice: Payment is not confirmed for this order.');
    }

    // IDEMPOTENCY CHECK: Return existing invoice if already issued
    const existingInvoice = await Invoice.findOne({ sellerOrderId: sellerOrder._id });
    if (existingInvoice) {
      return {
        success: true,
        alreadyGenerated: true,
        invoice: existingInvoice,
        pdfUrl: existingInvoice.pdfUrl,
      };
    }

    const brandDoc = sellerOrder.seller;
    const customerDoc = parentOrder.customer;
    const dateStr = new Date().toISOString().slice(0, 4);
    const rand = Math.floor(100000 + Math.random() * 900000);
    const brandPrefix = brandDoc?.slug ? brandDoc.slug.substring(0, 4).toUpperCase() : 'KAIA';
    const invoiceNumber = `${brandPrefix}-INV-${dateStr}-${rand}`;
    const invoiceId = invoiceNumber;

    // Validate Customer GSTIN
    let customerGstinClean = '';
    if (parentOrder.gstNumber && this.validateGstin(parentOrder.gstNumber)) {
      customerGstinClean = parentOrder.gstNumber.trim().toUpperCase();
    }

    // Seller State vs Customer Destination State (Intra-state vs Inter-state Tax)
    const sellerState = brandDoc?.warehouseAddress?.state || brandDoc?.businessDetails?.address?.split(',')?.pop()?.trim() || 'Karnataka';
    const customerState = parentOrder.shippingAddress?.state || 'Karnataka';
    const isIntraState = sellerState.toLowerCase().trim() === customerState.toLowerCase().trim();

    // Snapshot Items with HSN and GST Breakdown
    const invoiceItems = [];
    const warrantyEntries = [];
    let calculatedSubtotal = 0;
    let calculatedTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    for (let it of sellerOrder.items) {
      const prod = await Product.findById(it.product);
      const taxRate = prod?.taxRate || 18;
      const unitPrice = Number(it.price);
      const qty = Number(it.qty);
      const lineTotal = unitPrice * qty;

      // Calculate base taxable value (price is inclusive of GST)
      const baseTaxable = Math.round((lineTotal / (1 + taxRate / 100)) * 100) / 100;
      const taxAmount = Math.round((lineTotal - baseTaxable) * 100) / 100;

      let itemCgst = 0;
      let itemSgst = 0;
      let itemIgst = 0;

      if (isIntraState) {
        itemCgst = Math.round((taxAmount / 2) * 100) / 100;
        itemSgst = Math.round((taxAmount / 2) * 100) / 100;
        totalCgst += itemCgst;
        totalSgst += itemSgst;
      } else {
        itemIgst = taxAmount;
        totalIgst += itemIgst;
      }

      calculatedSubtotal += lineTotal;
      calculatedTaxable += baseTaxable;

      const itemSnapshot = {
        productId: it.product,
        productName: it.name,
        brandName: brandDoc?.name || 'Brand Partner',
        sku: it.sku || prod?.SKU || '',
        hsnCode: prod?.hsnCode || '8517', // Electronics default
        quantity: qty,
        unitPrice,
        discount: 0,
        taxableAmount: baseTaxable,
        taxRate,
        taxAmount,
        cgst: itemCgst,
        sgst: itemSgst,
        igst: itemIgst,
        lineTotal,
        serialNumbers: it.serialNumbers || [],
        imeiNumbers: it.imeiNumbers || [],
        warrantyMonths: prod?.warrantyMonths || 12,
      };
      invoiceItems.push(itemSnapshot);

      // Create Warranty Records for purchased serials / items
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (prod?.warrantyMonths || 12));

      if (it.serialNumbers && it.serialNumbers.length > 0) {
        for (let sn of it.serialNumbers) {
          warrantyEntries.push({
            productName: it.name,
            serialNumber: sn,
            warrantyMonths: prod?.warrantyMonths || 12,
            startDate,
            endDate,
            terms: `${prod?.warrantyMonths || 12} Months Authorized Brand Warranty`,
          });

          await Warranty.findOneAndUpdate(
            { serialNumber: sn },
            {
              serialNumber: sn,
              product: it.product,
              brand: brandDoc._id,
              customer: customerDoc?._id || parentOrder.customer,
              orderId: sellerOrder._id,
              masterOrderId: parentOrder._id,
              startDate,
              endDate,
              warrantyMonths: prod?.warrantyMonths || 12,
              status: 'Active',
            },
            { upsert: true }
          );
        }
      }
    }

    const shippingCharge = sellerOrder.shippingAmount || 0;
    const grandTotal = sellerOrder.finalAmount || (calculatedSubtotal + shippingCharge);

    // Build Invoice Document
    const invoice = await Invoice.create({
      invoiceId,
      invoiceNumber,
      masterOrderId: parentOrder._id,
      sellerOrderId: sellerOrder._id,
      customerId: customerDoc?._id || parentOrder.customer,
      brandId: brandDoc._id,
      invoiceStatus: 'Paid',
      issuedAt: new Date(),

      sellerDetails: {
        legalBusinessName: brandDoc?.name || 'Brand Manufacturer',
        brandName: brandDoc?.name || 'Brand Manufacturer',
        businessAddress: brandDoc?.businessDetails?.address || brandDoc?.warehouseAddress?.addressLine1 || 'Authorized Industrial Logistics Depot',
        gstin: brandDoc?.businessDetails?.gstin || '',
        pan: brandDoc?.businessDetails?.pan || '',
        email: brandDoc?.contactEmail || '',
        phone: brandDoc?.contactPhone || '',
        state: sellerState,
      },

      customerDetails: {
        customerName: parentOrder.shippingAddress.name,
        email: customerDoc?.email || 'customer@kaia.tech',
        phone: parentOrder.shippingAddress.phone,
        customerGSTIN: customerGstinClean,
      },

      billingAddress: {
        fullName: parentOrder.billingAddress?.name || parentOrder.shippingAddress.name,
        addressLine1: parentOrder.billingAddress?.street || parentOrder.shippingAddress.street,
        addressLine2: '',
        city: parentOrder.billingAddress?.city || parentOrder.shippingAddress.city,
        state: parentOrder.billingAddress?.state || parentOrder.shippingAddress.state,
        postalCode: parentOrder.billingAddress?.postalCode || parentOrder.shippingAddress.postalCode,
        country: parentOrder.billingAddress?.country || 'India',
        phone: parentOrder.billingAddress?.phone || parentOrder.shippingAddress.phone,
      },

      shippingAddress: {
        fullName: parentOrder.shippingAddress.name,
        addressLine1: parentOrder.shippingAddress.street,
        addressLine2: '',
        city: parentOrder.shippingAddress.city,
        state: parentOrder.shippingAddress.state,
        postalCode: parentOrder.shippingAddress.postalCode,
        country: parentOrder.shippingAddress.country || 'India',
        phone: parentOrder.shippingAddress.phone,
      },

      items: invoiceItems,

      subtotal: calculatedSubtotal,
      discount: 0,
      taxableAmount: Math.round(calculatedTaxable * 100) / 100,
      cgst: Math.round(totalCgst * 100) / 100,
      sgst: Math.round(totalSgst * 100) / 100,
      igst: Math.round(totalIgst * 100) / 100,
      cess: 0,
      shippingCharges: shippingCharge,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: grandTotal,
      currency: 'INR',

      paymentReference: {
        provider: paymentDetails.provider || 'razorpay',
        paymentId: paymentDetails.paymentId || parentOrder.paymentDetails?.transactionId || `PAY-${rand}`,
        method: paymentDetails.method || 'Prepaid (Online Payment)',
        paidAt: new Date(),
      },

      warrantyDetails: warrantyEntries,
    });

    // Generate physical PDF and save to disk
    const invoicesDir = path.join(process.cwd(), 'uploads', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    const pdfFileName = `${invoiceNumber}.pdf`;
    const pdfPath = path.join(invoicesDir, pdfFileName);

    await this.renderInvoicePdfToFile(invoice, pdfPath);
    invoice.pdfUrl = `/uploads/invoices/${pdfFileName}`;
    await invoice.save();

    // Link invoice number on SellerOrder
    sellerOrder.invoiceNumber = invoiceNumber;
    await sellerOrder.save();

    // Audit Log & Notification
    await AuditLog.create({
      user: userContext?._id || parentOrder.customer,
      brand: brandDoc._id,
      action: 'INVOICE_CREATED',
      entity: 'Invoice',
      entityId: invoice._id,
      changes: {
        invoiceNumber,
        orderId: sellerOrder.orderId,
        grandTotal,
        gstin: invoice.sellerDetails.gstin,
      },
    });

    await Notification.create({
      user: parentOrder.customer,
      title: 'Tax Invoice Ready',
      message: `Your verified GST tax invoice #${invoiceNumber} for ${brandDoc.name} is ready to download.`,
      type: 'Order',
    });

    return {
      success: true,
      invoice,
      pdfUrl: invoice.pdfUrl,
    };
  }

  /**
   * 3. Render Invoice to File via PDFKit
   */
  async renderInvoicePdfToFile(invoice, filePath) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      this.writeInvoicePdfContent(doc, invoice);
      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  /**
   * 4. Render Invoice Stream Directly (for Express Downloads)
   */
  renderInvoicePdfStream(invoice, res) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);
    this.writeInvoicePdfContent(doc, invoice);
    doc.end();
  }

  /**
   * 5. PDF Content Layout Design (Original KAIA Design System)
   */
  writeInvoicePdfContent(doc, invoice) {
    const isInterState = invoice.igst > 0;

    // --- 1. Header & Branding ---
    doc
      .fillColor('#0F1720')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('KAIA Technologies', 40, 40)
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#565959')
      .text('Technology from Every Brand. One Powerful Marketplace.', 40, 65)
      .text('www.kaia.tech | support@kaia.tech', 40, 78);

    // Tax Invoice Badge
    doc
      .fillColor('#0F1720')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('TAX INVOICE', 350, 40, { align: 'right' })
      .fontSize(9)
      .font('Helvetica')
      .text(`Invoice No: ${invoice.invoiceNumber}`, 350, 60, { align: 'right' })
      .text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString('en-IN')}`, 350, 73, { align: 'right' })
      .text(`Payment: ${invoice.paymentReference?.method || 'Prepaid (Gateway)'}`, 350, 86, { align: 'right' });

    doc.strokeColor('#EAEDED').lineWidth(1).moveTo(40, 105).lineTo(555, 105).stroke();

    // --- 2. Seller vs Customer Addresses ---
    const addrTop = 115;
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#0F1720')
      .text('SOLD BY (SELLER):', 40, addrTop)
      .font('Helvetica')
      .text(invoice.sellerDetails.legalBusinessName, 40, addrTop + 13)
      .text(invoice.sellerDetails.businessAddress, 40, addrTop + 26, { width: 230 })
      .text(`State: ${invoice.sellerDetails.state || 'Karnataka'}`, 40, addrTop + 52)
      .text(`GSTIN: ${invoice.sellerDetails.gstin || 'Unregistered / Exempt'}`, 40, addrTop + 65)
      .text(`PAN: ${invoice.sellerDetails.pan || 'N/A'}`, 40, addrTop + 78);

    doc
      .font('Helvetica-Bold')
      .text('BILLED & SHIPPED TO:', 310, addrTop)
      .font('Helvetica')
      .text(invoice.customerDetails.customerName, 310, addrTop + 13)
      .text(`${invoice.shippingAddress.addressLine1}, ${invoice.shippingAddress.city}`, 310, addrTop + 26, { width: 230 })
      .text(`${invoice.shippingAddress.state} - ${invoice.shippingAddress.postalCode}`, 310, addrTop + 39)
      .text(`Phone: ${invoice.shippingAddress.phone || invoice.customerDetails.phone}`, 310, addrTop + 52)
      .text(`Customer GSTIN: ${invoice.customerDetails.customerGSTIN || 'N/A'}`, 310, addrTop + 65);

    doc.strokeColor('#EAEDED').lineWidth(1).moveTo(40, 205).lineTo(555, 205).stroke();

    // --- 3. Items & Tax Table ---
    const tableTop = 215;
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#37475A')
      .text('ITEM DESCRIPTION', 40, tableTop)
      .text('HSN', 240, tableTop, { width: 35, align: 'center' })
      .text('QTY', 280, tableTop, { width: 25, align: 'center' })
      .text('UNIT PRICE', 310, tableTop, { width: 55, align: 'right' })
      .text('TAXABLE', 370, tableTop, { width: 55, align: 'right' })
      .text(isInterState ? 'IGST' : 'GST (C+S)', 430, tableTop, { width: 55, align: 'right' })
      .text('TOTAL (INR)', 490, tableTop, { width: 65, align: 'right' });

    doc.strokeColor('#0F1720').lineWidth(0.5).moveTo(40, 228).lineTo(555, 228).stroke();

    let curY = 236;
    invoice.items.forEach((item) => {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#0F1720')
        .text(item.productName, 40, curY, { width: 195 })
        .text(item.hsnCode || '8517', 240, curY, { width: 35, align: 'center' })
        .text(item.quantity.toString(), 280, curY, { width: 25, align: 'center' })
        .text(`₹${item.unitPrice.toLocaleString('en-IN')}`, 310, curY, { width: 55, align: 'right' })
        .text(`₹${item.taxableAmount.toLocaleString('en-IN')}`, 370, curY, { width: 55, align: 'right' })
        .text(`₹${item.taxAmount.toLocaleString('en-IN')} (${item.taxRate}%)`, 430, curY, { width: 55, align: 'right' })
        .text(`₹${item.lineTotal.toLocaleString('en-IN')}`, 490, curY, { width: 65, align: 'right' });

      curY += 16;

      if (item.serialNumbers && item.serialNumbers.length > 0) {
        doc
          .fontSize(7)
          .font('Helvetica-Oblique')
          .fillColor('#565959')
          .text(`Serial Barcode(s): ${item.serialNumbers.join(', ')}`, 40, curY, { width: 400 });
        curY += 12;
      }
    });

    doc.strokeColor('#EAEDED').lineWidth(1).moveTo(40, curY + 4).lineTo(555, curY + 4).stroke();

    // --- 4. Financial Summary ---
    const sumY = curY + 12;
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#0F1720')
      .text('Total Taxable Value:', 340, sumY, { width: 110, align: 'right' })
      .text(`₹${invoice.taxableAmount.toLocaleString('en-IN')}`, 460, sumY, { width: 95, align: 'right' });

    if (!isInterState) {
      doc
        .text('CGST:', 340, sumY + 14, { width: 110, align: 'right' })
        .text(`₹${invoice.cgst.toLocaleString('en-IN')}`, 460, sumY + 14, { width: 95, align: 'right' })
        .text('SGST / UTGST:', 340, sumY + 28, { width: 110, align: 'right' })
        .text(`₹${invoice.sgst.toLocaleString('en-IN')}`, 460, sumY + 28, { width: 95, align: 'right' });
    } else {
      doc
        .text('IGST (Integrated Tax):', 340, sumY + 14, { width: 110, align: 'right' })
        .text(`₹${invoice.igst.toLocaleString('en-IN')}`, 460, sumY + 14, { width: 95, align: 'right' });
    }

    doc
      .text('Shipping Charges:', 340, sumY + (isInterState ? 28 : 42), { width: 110, align: 'right' })
      .text(`₹${invoice.shippingCharges.toLocaleString('en-IN')}`, 460, sumY + (isInterState ? 28 : 42), { width: 95, align: 'right' });

    const totalY = sumY + (isInterState ? 44 : 58);
    doc.strokeColor('#0F1720').lineWidth(0.5).moveTo(340, totalY).lineTo(555, totalY).stroke();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#B12704')
      .text('Grand Total (INR):', 340, totalY + 6, { width: 110, align: 'right' })
      .text(`₹${invoice.totalAmount.toLocaleString('en-IN')}`, 460, totalY + 6, { width: 95, align: 'right' });

    // --- 5. Warranty & Authenticity Box ---
    if (invoice.warrantyDetails && invoice.warrantyDetails.length > 0) {
      const wTop = 640;
      doc
        .rect(40, wTop, 515, 60)
        .fillAndStroke('#F8F9FA', '#EAEDED');

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#0F1720')
        .text('AUTHORIZED HARDWARE WARRANTY CERTIFICATE', 50, wTop + 8)
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#565959')
        .text(`This document serves as proof of purchase for manufacturer warranty coverage. Covered hardware items carry a standard 12-Month brand warranty from the invoice date (${new Date(invoice.issuedAt).toLocaleDateString('en-IN')}).`, 50, wTop + 22, { width: 495 })
        .text('For warranty claims, present this invoice at authorized brand service centers across India.', 50, wTop + 44);
    }

    // --- 6. Legal Footer ---
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#9CA3AF')
      .text('This is a computer-generated tax invoice issued in accordance with GST Rules. Does not require physical signature.', 40, 740, { align: 'center' })
      .text('KAIA Technologies Private Limited • Marketplace Platform Provider • www.kaia.tech', 40, 752, { align: 'center' });
  }

  /**
   * 6. Authorization-Guarded Invoice Access
   */
  async getInvoiceById({ invoiceId, user }) {
    const isObjectId = mongoose.Types.ObjectId.isValid(invoiceId);
    const query = isObjectId ? { $or: [{ _id: invoiceId }, { invoiceId }, { invoiceNumber: invoiceId }] } : { $or: [{ invoiceId }, { invoiceNumber: invoiceId }] };

    const invoice = await Invoice.findOne(query)
      .populate('masterOrderId', 'orderId paymentStatus createdAt')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount')
      .populate('brandId', 'name slug logo contactEmail')
      .populate('customerId', 'name email');

    if (!invoice) throw new Error('Invoice not found.');

    // Security Check: Customer owns it, Brand owns it, or Admin
    const isCustomer = user.role === 'CUSTOMER' && invoice.customerId?._id?.toString() === user._id?.toString();
    const isBrand = user.role === 'BRAND' && invoice.brandId?._id?.toString() === user.brand?.toString();
    const isAdmin = user.role === 'ADMIN';

    if (!isCustomer && !isBrand && !isAdmin) {
      throw new Error('Unauthorized access to this invoice document.');
    }

    return invoice;
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
