import mongoose from 'mongoose';
import CommissionRule from '../../models/CommissionRule.js';
import Product from '../../models/Product.js';
import Brand from '../../models/Brand.js';
import Category from '../../models/Category.js';

export class CommissionService {
  /**
   * 1. Resolve Commission Rule with Priority:
   * Product -> Brand -> Category -> Marketplace Default
   */
  async resolveCommissionRule({ productId = null, brandId = null, categoryId = null }) {
    const now = new Date();

    // 1. Product-specific rule
    if (productId) {
      const productRule = await CommissionRule.findOne({
        scope: 'product',
        productId,
        isActive: true,
        effectiveFrom: { $lte: now },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
      });
      if (productRule) return productRule;
    }

    // 2. Brand-specific rule
    if (brandId) {
      const brandRule = await CommissionRule.findOne({
        scope: 'brand',
        brandId,
        isActive: true,
        effectiveFrom: { $lte: now },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
      });
      if (brandRule) return brandRule;
    }

    // 3. Category-specific rule
    if (categoryId) {
      const categoryRule = await CommissionRule.findOne({
        scope: 'category',
        categoryId,
        isActive: true,
        effectiveFrom: { $lte: now },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
      });
      if (categoryRule) return categoryRule;
    }

    // 4. Marketplace Default rule
    const defaultRule = await CommissionRule.findOne({
      scope: 'marketplace_default',
      isActive: true,
    });

    if (defaultRule) return defaultRule;

    // Fallback: Standard 5% Marketplace Default
    return {
      _id: null,
      name: 'Default Marketplace Commission',
      scope: 'marketplace_default',
      commissionType: 'percentage',
      commissionValue: 5.0,
      commissionTaxRate: 18.0,
      isActive: true,
    };
  }

  /**
   * 2. Calculate Commission & Seller Payable for a Seller Order
   */
  async calculateSellerOrderCommission({ sellerOrder, items = [] }) {
    const grossAmount = sellerOrder.finalAmount || sellerOrder.subtotal || 0;
    const brandId = sellerOrder.seller?._id || sellerOrder.seller;
    const firstProduct = items[0]?.product;

    let categoryId = null;
    let productId = null;

    if (firstProduct) {
      const prod = await Product.findById(firstProduct);
      if (prod) {
        productId = prod._id;
        categoryId = prod.category;
      }
    }

    const rule = await this.resolveCommissionRule({ productId, brandId, categoryId });

    let commissionAmount = 0;
    if (rule.commissionType === 'percentage') {
      commissionAmount = Math.round(((grossAmount * rule.commissionValue) / 100) * 100) / 100;
    } else {
      commissionAmount = Math.min(grossAmount, rule.commissionValue);
    }

    // Platform GST on commission (e.g. 18% on the platform service fee)
    const taxRate = rule.commissionTaxRate || 18.0;
    const commissionTaxAmount = Math.round(((commissionAmount * taxRate) / 100) * 100) / 100;

    const sellerPayableAmount = Math.max(0, grossAmount - commissionAmount - commissionTaxAmount);

    return {
      ruleId: rule._id,
      ruleName: rule.name,
      scope: rule.scope,
      commissionType: rule.commissionType,
      commissionRate: rule.commissionValue,
      commissionAmount,
      commissionTaxAmount,
      grossAmount,
      sellerPayableAmount,
    };
  }

  /**
   * 3. Calculate Commission Reversal upon Return/Refund
   */
  calculateCommissionReversal({ originalCommissionAmount = 0, originalGrossAmount = 0, refundAmount = 0, commissionTaxRate = 18.0 }) {
    if (originalGrossAmount <= 0 || refundAmount <= 0) {
      return { commissionReversal: 0, commissionTaxReversal: 0, sellerPayableDeduction: 0 };
    }

    const ratio = Math.min(1, refundAmount / originalGrossAmount);
    const commissionReversal = Math.round(originalCommissionAmount * ratio * 100) / 100;
    const commissionTaxReversal = Math.round(((commissionReversal * commissionTaxRate) / 100) * 100) / 100;
    const sellerPayableDeduction = Math.round((refundAmount - commissionReversal - commissionTaxReversal) * 100) / 100;

    return {
      commissionReversal,
      commissionTaxReversal,
      sellerPayableDeduction,
    };
  }
}

export const commissionService = new CommissionService();
export default commissionService;
