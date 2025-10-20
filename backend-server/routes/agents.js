const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const Status = require('../models/Status');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/agents/team/:teamId
 * Return agents + latest status from MongoDB
 */
router.get('/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const agents = await Agent.findByTeam(parseInt(teamId));
    
    const agentsWithStatus = await Promise.all(
      agents.map(async (agent) => {
        const latestStatus = await Status.findOne({
          agentCode: agent.agent_code
        }).sort({ timestamp: -1 }).limit(1).lean();
        
        return {
          agent_code: agent.agent_code,
          agent_name: agent.agent_name,
          role: agent.role,
          email: agent.email,
          phone: agent.phone,
          team_id: parseInt(teamId),
          currentStatus: latestStatus?.status || 'Offline',
          lastUpdate: latestStatus?.timestamp || new Date()
        };
      })
    );
    
    res.json({
      success: true,
      teamId: parseInt(teamId),
      agents: agentsWithStatus,
      count: agentsWithStatus.length
    });
    
  } catch (error) {
    console.error('Get team agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get team agents'
    });
  }
});

/**
 * PUT /api/agents/:agentCode/status
 * Update agent status
 */
router.put('/:agentCode/status', authMiddleware, async (req, res) => {
  try {
    const { agentCode } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Available', 'Busy', 'Break', 'Offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const agent = await Agent.findByCode(agentCode.toUpperCase());
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    const statusUpdate = await Status.create({
      agentCode: agentCode.toUpperCase(),
      status: status,
      timestamp: new Date(),
      teamId: agent.team_id
    });
    
    res.json({
      success: true,
      data: {
        agentCode: agentCode.toUpperCase(),
        status: status,
        timestamp: statusUpdate.timestamp,
        teamId: agent.team_id
      }
    });
    
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

/**
 * GET /api/agents/:agentCode/history
 * Agent status history
 */
router.get('/:agentCode/history', authMiddleware, async (req, res) => {
  try {
    const { agentCode } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await Status.find({
      agentCode: agentCode.toUpperCase()
    }).sort({ timestamp: -1 }).limit(parseInt(limit)).lean();
    
    res.json({
      success: true,
      agentCode: agentCode.toUpperCase(),
      history: history,
      count: history.length
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent history'
    });
  }
});

module.exports = router;
