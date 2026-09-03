import mongoose from 'mongoose';

const ticketReplySchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
      default: 'KAIA Support Desk',
    },
    authorRole: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'SUPPORT'],
      default: 'SUPPORT',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Orders', 'Payments', 'Delivery', 'Returns', 'Warranty', 'General'],
      default: 'General',
      index: true,
    },
    orderId: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Inquiry message is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'],
      default: 'Open',
      index: true,
    },
    replies: [ticketReplySchema],
  },
  {
    timestamps: true,
  }
);

const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
