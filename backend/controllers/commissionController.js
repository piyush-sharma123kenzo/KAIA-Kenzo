import CommissionRule from '../models/CommissionRule.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all commission rules
// @route   GET /api/admin/commissions
// @access  Private (Role: ADMIN)
export const getCommissionRules = async (req, res) => {
  try {
    const { scope, isActive } = req.query;
    const query = {};
    if (scope && scope !== 'all') query.scope = scope;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const rules = await CommissionRule.find(query)
      .populate('brandId', 'name slug logo')
      .populate('categoryId', 'name slug')
      .populate('productId', 'name SKU modelNumber sellingPrice')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching commission rules:', error);
    res.status(500).json({ message: 'Error retrieving commission rules.' });
  }
};

// @desc    Create a commission rule
// @route   POST /api/admin/commissions
// @access  Private (Role: ADMIN)
export const createCommissionRule = async (req, res) => {
  try {
    const { name, scope, brandId, categoryId, productId, commissionType, commissionValue, commissionTaxRate, effectiveFrom, effectiveTo } = req.body;

    if (!name || !commissionValue) {
      return res.status(400).json({ message: 'Rule name and commission value are required.' });
    }

    const rule = await CommissionRule.create({
      name: name.trim(),
      scope: scope || 'marketplace_default',
      brandId: brandId || undefined,
      categoryId: categoryId || undefined,
      productId: productId || undefined,
      commissionType: commissionType || 'percentage',
      commissionValue: Number(commissionValue),
      commissionTaxRate: commissionTaxRate !== undefined ? Number(commissionTaxRate) : 18.0,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo: effectiveTo || undefined,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'COMMISSION_RULE_CREATED',
      entity: 'CommissionRule',
      entityId: rule._id,
      changes: { name, scope, commissionValue, commissionType },
    });

    res.status(201).json({ success: true, message: 'Commission rule created.', rule });
  } catch (error) {
    console.error('Error creating commission rule:', error);
    res.status(400).json({ message: error.message || 'Error creating commission rule.' });
  }
};

// @desc    Update / toggle commission rule
// @route   PATCH /api/admin/commissions/:id
// @access  Private (Role: ADMIN)
export const updateCommissionRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await CommissionRule.findById(id);
    if (!rule) return res.status(404).json({ message: 'Commission rule not found.' });

    const previousValue = rule.commissionValue;
    const fields = ['name', 'commissionValue', 'commissionType', 'commissionTaxRate', 'isActive', 'effectiveTo'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) rule[f] = req.body[f];
    });

    if (req.body.commissionValue !== undefined && req.body.commissionValue !== previousValue) {
      rule.history.push({
        changedBy: req.user._id,
        previousValue,
        newValue: req.body.commissionValue,
        changedAt: new Date(),
      });
    }

    await rule.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'COMMISSION_RULE_UPDATED',
      entity: 'CommissionRule',
      entityId: rule._id,
      changes: { previousValue, newValue: rule.commissionValue, isActive: rule.isActive },
    });

    res.status(200).json({ success: true, message: 'Commission rule updated.', rule });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating commission rule.' });
  }
};
