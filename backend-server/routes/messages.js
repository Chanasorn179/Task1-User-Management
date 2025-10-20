const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

/**
 * POST /api/messages/send
 * body: { fromCode, toCode?, toTeamId?, content, type('direct'|'broadcast'), priority? }
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { fromCode, toCode, toTeamId, content, type, priority } = req.body;

    if (!fromCode || !content || !type) {
      return res.status(400).json({
        success: false,
        error: 'fromCode, content and type are required'
      });
    }
    if (!['direct','broadcast'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "type must be 'direct' or 'broadcast'"
      });
    }
    if (type === 'direct' && !toCode) {
      return res.status(400).json({
        success: false,
        error: 'toCode is required for direct message'
      });
    }
    if (type === 'broadcast' && (toTeamId === undefined || toTeamId === null)) {
      return res.status(400).json({
        success: false,
        error: 'toTeamId is required for broadcast message'
      });
    }

    const payload = {
      fromCode: String(fromCode).toUpperCase(),
      content: String(content),
      type,
      priority: priority || 'normal',
      timestamp: new Date(),
      isRead: false
    };
    if (type === 'direct') payload.toCode = String(toCode).toUpperCase();
    if (type === 'broadcast') payload.toTeamId = parseInt(toTeamId);

    const message = await Message.create(payload);

    res.json({
      success: true,
      data: {
        messageId: message._id,
        ...payload
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

/**
 * GET /api/messages/agent/:agentCode
 * Return messages for agent (direct + broadcast by teamId query)
 * query: teamId? (to also fetch broadcasts to the team)
 */
router.get('/agent/:agentCode', authMiddleware, async (req, res) => {
  try {
    const { agentCode } = req.params;
    const { teamId, limit = 50 } = req.query;

    const or = [{ toCode: String(agentCode).toUpperCase() }];
    if (teamId !== undefined) {
      or.push({ toTeamId: parseInt(teamId) });
    }

    const messages = await Message.find({ $or: or })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      agentCode: String(agentCode).toUpperCase(),
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
});

/**
 * PUT /api/messages/:messageId/read
 * Mark a message as read
 */
router.put('/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const updated = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true, readAt: new Date() },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

module.exports = router;
