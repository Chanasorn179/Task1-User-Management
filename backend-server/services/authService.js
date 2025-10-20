const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '24h';

const authService = {
  loginWithoutPassword: async (username) => {
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Error('Invalid username');
    if (user.status !== 'Active') throw new Error('User account is inactive');

    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    await userRepository.updateLastLogin(user.id);
    return {
      success: true,
      user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, teamId: user.teamId },
      token,
      expiresIn: JWT_EXPIRES_IN
    };
  },
  verifyToken: (token) => jwt.verify(token, JWT_SECRET)
};

module.exports = authService;
