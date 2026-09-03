import SupportTicket from '../models/SupportTicket.js';

// Helper to generate unique ticket ID
const generateTicketId = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${randomNum}`;
};

// @desc    Submit a customer support ticket
// @route   POST /api/support/tickets
// @access  Public / Authenticated
export const submitSupportTicket = async (req, res) => {
  try {
    const { name, email, subject, category, orderId, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Name, Email, Subject, and Message.',
      });
    }

    const ticketId = generateTicketId();

    const ticket = await SupportTicket.create({
      ticketId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      category: category || 'General',
      orderId: orderId ? orderId.trim() : '',
      message: message.trim(),
      status: 'Open',
      priority: 'Medium',
    });

    res.status(201).json({
      success: true,
      message: `Support ticket ${ticketId} created successfully. Our team will respond shortly.`,
      ticket,
    });
  } catch (error) {
    console.error('[Support Ticket Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit support ticket.' });
  }
};

// @desc    Get all support tickets (Admin)
// @route   GET /api/support/admin
// @access  Private/Admin
export const getAdminTickets = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      SupportTicket.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      tickets,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('[Admin Tickets Error]:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving support tickets.' });
  }
};

// @desc    Update ticket status / priority (Admin)
// @route   PUT /api/support/admin/:id/status
// @access  Private/Admin
export const updateAdminTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully.',
      ticket,
    });
  } catch (error) {
    console.error('[Update Ticket Error]:', error);
    res.status(500).json({ success: false, message: 'Server error updating ticket status.' });
  }
};

// @desc    Add reply to ticket (Admin)
// @route   POST /api/support/admin/:id/reply
// @access  Private/Admin
export const replyAdminTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    ticket.replies.push({
      author: req.user?.name || 'KAIA Support Desk',
      authorRole: 'SUPPORT',
      message: message.trim(),
      createdAt: new Date(),
    });

    ticket.status = 'Waiting for Customer';
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply sent to customer ticket.',
      ticket,
    });
  } catch (error) {
    console.error('[Ticket Reply Error]:', error);
    res.status(500).json({ success: false, message: 'Server error posting ticket reply.' });
  }
};
