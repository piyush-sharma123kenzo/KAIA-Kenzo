import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entity: {
      type: String,
      required: true, // e.g. 'Brand', 'Commission', 'Product'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed, // e.g. { previous: 5, new: 8 }
      default: {},
    },
    metadata: {
      ip: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
