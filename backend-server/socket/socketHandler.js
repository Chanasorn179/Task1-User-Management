const Message = require('../models/Message');
const Status = require('../models/Status');

const activeConnections = new Map(); // agentCode -> socketId
const supervisorConnections = new Map(); // supervisorCode -> socketId

function socketHandler(io) {
  console.log('⚡ WebSocket server initialized');

  const heartbeatInterval = setInterval(() => {
    activeConnections.forEach((socketId, agentCode) => {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket || !socket.connected) {
        console.log(`💔 Heartbeat: Agent ${agentCode} no longer connected`);
        activeConnections.delete(agentCode);
        io.emit('agent_disconnected', {
          agentCode,
          timestamp: new Date(),
          reason: 'heartbeat_timeout'
        });
      }
    });
  }, 30000);

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    socket.on('agent_connect', (data) => {
      try {
        const { agentCode } = data || {};
        if (!agentCode) {
          socket.emit('connection_error', { message: 'Agent code required' });
          return;
        }
        const cleanCode = String(agentCode).toUpperCase();
        activeConnections.set(cleanCode, socket.id);
        socket.agentCode = cleanCode;
        socket.userType = 'agent';

        const payload = { agentCode: cleanCode, timestamp: new Date() };
        socket.broadcast.emit('agent_connected', payload);
        supervisorConnections.forEach((sid) => io.to(sid).emit('agent_connected', payload));
        socket.emit('connection_success', { agentCode: cleanCode, status: 'connected' });
      } catch (e) {
        console.error('Agent connect error:', e);
        socket.emit('connection_error', { message: 'Connection failed' });
      }
    });

    socket.on('supervisor_connect', (data) => {
      try {
        const { supervisorCode } = data || {};
        if (!supervisorCode) {
          socket.emit('connection_error', { message: 'Supervisor code required' });
          return;
        }
        const clean = String(supervisorCode).toUpperCase();
        supervisorConnections.set(clean, socket.id);
        socket.supervisorCode = clean;
        socket.userType = 'supervisor';

        const onlineAgents = [];
        const promises = [];

        activeConnections.forEach((sid, code) => {
          const s = io.sockets.sockets.get(sid);
          if (s && s.connected) {
            promises.push(
              Status.findOne({ agentCode: code }).sort({ timestamp: -1 }).limit(1).then(st => {
                onlineAgents.push({
                  agentCode: code,
                  status: st?.status || 'Available',
                  timestamp: st?.timestamp || new Date()
                });
              })
            );
          }
        });

        Promise.all(promises).then(() => {
          socket.emit('connection_success', {
            supervisorCode: clean,
            status: 'connected',
            timestamp: new Date(),
            onlineAgents
          });
        });
      } catch (e) {
        console.error('Supervisor connect error:', e);
        socket.emit('connection_error', { message: 'Connection failed' });
      }
    });

    socket.on('update_status', async (data) => {
      try {
        const { agentCode, status } = data || {};
        if (!agentCode || !status) {
          socket.emit('status_error', { message: 'agentCode and status required' });
          return;
        }
        const statusUpdate = await Status.create({
          agentCode: String(agentCode).toUpperCase(),
          status,
          timestamp: new Date()
        });
        socket.broadcast.emit('agent_status_update', {
          agentCode: String(agentCode).toUpperCase(),
          status,
          timestamp: statusUpdate.timestamp
        });
        socket.emit('status_updated', {
          agentCode: String(agentCode).toUpperCase(),
          status,
          timestamp: statusUpdate.timestamp
        });
      } catch (e) {
        console.error('Status update error:', e);
        socket.emit('status_error', { message: 'Failed to update status' });
      }
    });

    socket.on('send_message', async (data) => {
      try {
        const { fromCode, toCode, toTeamId, content, type } = data || {};
        const payload = {
          fromCode: String(fromCode).toUpperCase(),
          content: String(content),
          type: type || 'direct',
          timestamp: new Date(),
          isRead: false
        };
        if (payload.type === 'direct' && toCode) payload.toCode = String(toCode).toUpperCase();
        if (payload.type === 'broadcast' && toTeamId) payload.toTeamId = parseInt(toTeamId);

        const message = await Message.create(payload);

        if (payload.type === 'direct' && toCode) {
          const targetSocketId = activeConnections.get(String(toCode).toUpperCase());
          if (targetSocketId) {
            const messagePayload = {
              _id: message._id.toString(),
              messageId: message._id.toString(),
              fromCode: message.fromCode,
              content: message.content,
              timestamp: message.timestamp,
              type: 'direct',
              priority: message.priority,
              isRead: false
            };
            io.to(targetSocketId).emit('new_message', messagePayload);
          }
        } else if (payload.type === 'broadcast') {
          socket.broadcast.emit('new_message', {
            messageId: message._id,
            fromCode: message.fromCode,
            content: message.content,
            timestamp: message.timestamp,
            type: 'broadcast',
            toTeamId: toTeamId
          });
        }
        socket.emit('message_sent', { messageId: message._id, status: 'delivered' });
      } catch (e) {
        console.error('Send message error:', e);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      try {
        if (socket.agentCode) {
          const code = socket.agentCode;
          activeConnections.delete(code);
          const payload = { agentCode: code, timestamp: new Date() };
          socket.broadcast.emit('agent_disconnected', payload);
          supervisorConnections.forEach((sid) => io.to(sid).emit('agent_disconnected', payload));
        }
      } catch (e) {
        console.error('Disconnect error:', e);
      }
    });
  });
}

module.exports = socketHandler;
