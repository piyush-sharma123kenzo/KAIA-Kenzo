import mongoose from 'mongoose';
import SellerLedger from '../../models/SellerLedger.js';
import Settlement from '../../models/Settlement.js';
import SellerOrder from '../../models/SellerOrder.js';
import Brand from '../../models/Brand.js';
import User from '../../models/User.js';
import AuditLog from '../../models/AuditLog.js';
import Notification from '../../models/Notification.js';

export class SettlementService {
  /**
   * 1. Record Double-Entry Traceable Ledger Entry
   */
  async recordLedgerEntry({
    brandId,
    sellerOrderId = null,
    transactionType,
    entryType, // 'credit' | 'debit'
    amount,
    referenceType = 'SellerOrder',
    referenceId = '',
    description,
    user = null,
  }) {
    if (!brandId || !transactionType || !entryType || amount === undefined) {
      throw new Error('Missing required fields for ledger entry.');
    }

    const amt = Math.round(Math.abs(amount) * 100) / 100;

    // Get last ledger balance
    const lastEntry = await SellerLedger.findOne({ brandId }).sort({ createdAt: -1 });
    const currentBalance = lastEntry ? lastEntry.balanceAfter : 0;

    let balanceAfter = 0;
    if (entryType === 'credit') {
      balanceAfter = Math.round((currentBalance + amt) * 100) / 100;
    } else {
      balanceAfter = Math.round((currentBalance - amt) * 100) / 100;
    }

    const entry = await SellerLedger.create({
      brandId,
      sellerOrderId,
      transactionType,
      entryType,
      amount: amt,
      balanceAfter,
      referenceType,
      referenceId: referenceId.toString(),
      description,
      createdBy: user?._id || user,
    });

    return entry;
  }

  /**
   * 2. Get Brand Financial Balance & Summary
   */
  async getBrandFinancialSummary(brandId) {
    const brandObjId = new mongoose.Types.ObjectId(brandId);

    // Latest ledger balance
    const lastEntry = await SellerLedger.findOne({ brandId: brandObjId }).sort({ createdAt: -1 });
    const availableBalance = lastEntry ? Math.max(0, lastEntry.balanceAfter) : 0;

    // Aggregations by transaction type
    const statsAgg = await SellerLedger.aggregate([
      { $match: { brandId: brandObjId } },
      {
        $group: {
          _id: '$transactionType',
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const stats = {
      grossSales: 0,
      totalCommission: 0,
      totalRefunds: 0,
      totalSettled: 0,
      totalAdjustments: 0,
    };

    statsAgg.forEach((s) => {
      if (s._id === 'SALE') stats.grossSales = s.totalAmount;
      if (s._id === 'COMMISSION' || s._id === 'COMMISSION_TAX') stats.totalCommission += s.totalAmount;
      if (s._id === 'REFUND') stats.totalRefunds += s.totalAmount;
      if (s._id === 'SETTLEMENT' || s._id === 'PAYOUT') stats.totalSettled += s.totalAmount;
      if (s._id === 'ADJUSTMENT') stats.totalAdjustments += s.totalAmount;
    });

    // Pending hold amount (delivered orders under 7-day hold period)
    const holdDays = 7;
    const holdCutoff = new Date(Date.now() - holdDays * 24 * 60 * 60 * 1000);

    const pendingOrders = await SellerOrder.find({
      seller: brandObjId,
      fulfillmentStatus: 'Delivered',
      settlementStatus: 'unsettled',
      deliveredAt: { $gt: holdCutoff },
    });

    const pendingHoldAmount = pendingOrders.reduce((acc, so) => acc + (so.sellerPayableAmount || so.finalAmount * 0.95), 0);

    return {
      availableBalance,
      pendingHoldAmount: Math.round(pendingHoldAmount * 100) / 100,
      grossSales: Math.round(stats.grossSales * 100) / 100,
      totalCommission: Math.round(stats.totalCommission * 100) / 100,
      totalRefunds: Math.round(stats.totalRefunds * 100) / 100,
      totalSettled: Math.round(stats.totalSettled * 100) / 100,
      netEarnings: Math.round((stats.grossSales - stats.totalCommission - stats.totalRefunds) * 100) / 100,
    };
  }

  /**
   * 3. Get Eligible Orders for Settlement
   */
  async getEligibleSellerOrders({ brandId, holdDays = 7 }) {
    const holdCutoff = new Date(Date.now() - holdDays * 24 * 60 * 60 * 1000);

    const orders = await SellerOrder.find({
      seller: brandId,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Delivered',
      settlementStatus: 'unsettled',
      $or: [
        { deliveredAt: { $exists: true, $ne: null, $lte: holdCutoff } },
        { deliveredAt: null, updatedAt: { $lte: holdCutoff } },
      ],
    }).sort({ createdAt: 1 });

    return orders;
  }

  /**
   * 4. Create Periodic Settlement Record
   */
  async createSettlement({ brandId, periodStart, periodEnd, user = null }) {
    const eligibleOrders = await this.getEligibleSellerOrders({ brandId });

    if (eligibleOrders.length === 0) {
      throw new Error('No eligible delivered orders found for settlement (hold period of 7 days applies).');
    }

    let grossSales = 0;
    let commission = 0;
    let commissionTax = 0;
    let refunds = 0;
    let netPayable = 0;
    const orderIds = [];

    eligibleOrders.forEach((so) => {
      grossSales += so.grossAmount || so.finalAmount || 0;
      commission += so.commissionAmount || 0;
      commissionTax += so.commissionTaxAmount || 0;
      refunds += so.refundAmount || 0;
      netPayable += so.sellerPayableAmount || (so.finalAmount - so.commissionAmount);
      orderIds.push(so._id);
    });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const brandDoc = await Brand.findById(brandId);
    const brandSlug = brandDoc?.slug ? brandDoc.slug.substring(0, 4).toUpperCase() : 'BRAND';
    const settlementNumber = `SETTL-${brandSlug}-${dateStr}-${rand}`;

    const settlement = await Settlement.create({
      settlementNumber,
      brandId,
      periodStart: periodStart || eligibleOrders[0].createdAt,
      periodEnd: periodEnd || new Date(),
      grossSales: Math.round(grossSales * 100) / 100,
      commission: Math.round(commission * 100) / 100,
      commissionTax: Math.round(commissionTax * 100) / 100,
      refunds: Math.round(refunds * 100) / 100,
      adjustments: 0,
      netPayable: Math.round(netPayable * 100) / 100,
      sellerOrders: orderIds,
      status: 'pending',
      paymentProvider: 'mock',
    });

    // Mark included orders as held in settlement
    await SellerOrder.updateMany(
      { _id: { $in: orderIds } },
      { $set: { settlementStatus: 'held' } }
    );

    return settlement;
  }

  /**
   * 5. Approve Settlement (Admin)
   */
  async approveSettlement({ settlementId, user }) {
    const settlement = await Settlement.findById(settlementId).populate('brandId');
    if (!settlement) throw new Error('Settlement not found.');

    if (settlement.status !== 'pending') {
      throw new Error(`Cannot approve settlement in status: ${settlement.status}`);
    }

    settlement.status = 'approved';
    settlement.approvedBy = user._id;
    settlement.approvedAt = new Date();
    await settlement.save();

    await AuditLog.create({
      user: user._id,
      action: 'SETTLEMENT_APPROVED',
      entity: 'Settlement',
      entityId: settlement._id,
      changes: { settlementNumber: settlement.settlementNumber, netPayable: settlement.netPayable },
    });

    return settlement;
  }

  /**
   * 6. Process Settlement Payout
   */
  async processSettlementPayout({ settlementId, paymentProvider = 'mock', user }) {
    const settlement = await Settlement.findById(settlementId).populate('brandId');
    if (!settlement) throw new Error('Settlement not found.');

    if (!['approved', 'processing'].includes(settlement.status)) {
      throw new Error(`Settlement must be approved before processing payout (current: ${settlement.status}).`);
    }

    // Payout reference
    const providerPayoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    settlement.status = 'paid';
    settlement.paymentProvider = paymentProvider;
    settlement.providerPayoutId = providerPayoutId;
    settlement.processedAt = new Date();
    settlement.paidAt = new Date();
    await settlement.save();

    // Debit Brand Balance in Ledger
    await this.recordLedgerEntry({
      brandId: settlement.brandId._id,
      transactionType: 'SETTLEMENT',
      entryType: 'debit',
      amount: settlement.netPayable,
      referenceType: 'Settlement',
      referenceId: settlement.settlementNumber,
      description: `Settlement payout disbursed (${settlement.settlementNumber}) via ${paymentProvider}.`,
      user,
    });

    // Mark included SellerOrders as settled
    await SellerOrder.updateMany(
      { _id: { $in: settlement.sellerOrders } },
      { $set: { settlementStatus: 'settled', payoutStatus: 'Paid' } }
    );

    await AuditLog.create({
      user: user._id,
      action: 'PAYOUT_DISBURSED',
      entity: 'Settlement',
      entityId: settlement._id,
      changes: {
        settlementNumber: settlement.settlementNumber,
        netPayable: settlement.netPayable,
        providerPayoutId,
      },
    });

    return settlement;
  }

  /**
   * 7. Record Manual Admin Financial Adjustment
   */
  async recordManualAdjustment({ brandId, amount, type = 'credit', reason, user }) {
    if (!amount || !reason) throw new Error('Amount and reason are required for adjustment.');

    const entry = await this.recordLedgerEntry({
      brandId,
      transactionType: 'ADJUSTMENT',
      entryType: type, // 'credit' | 'debit'
      amount: Number(amount),
      referenceType: 'ManualAdjustment',
      referenceId: `ADJ-${Date.now()}`,
      description: `Admin manual adjustment: ${reason}`,
      user,
    });

    await AuditLog.create({
      user: user._id,
      action: 'ADMIN_ADJUSTMENT',
      entity: 'SellerLedger',
      entityId: entry._id,
      changes: { brandId, amount, type, reason },
    });

    return entry;
  }
}

export const settlementService = new SettlementService();
export default settlementService;
