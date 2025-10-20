// services/userService.js
const userRepository = require('../repositories/userRepository');

const userService = {
  async getAllUsers(filters = {}) {
    return await userRepository.findAll(filters);
  },

  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  async createUser(userData) {
    try {
      const usernameRegex = /^(AG|SP|AD)(00[1-9]|0[1-9]\d|[1-9]\d{2})$/;
      if (!usernameRegex.test(userData.username)) {
        throw new Error('Invalid username format. Use AGxxx, SPxxx, or ADxxx (001-999)');
      }

      const exists = await userRepository.usernameExists(userData.username);
      if (exists) throw new Error(`Username "${userData.username}" already exists`);

      // Role-specific rules
      if ((userData.role === 'Agent' || userData.role === 'Supervisor') && !userData.teamId) {
        throw new Error('Team ID is required for Agent and Supervisor roles');
      }
      if (userData.role === 'Admin') {
        userData.teamId = null;
      }

      const newUser = await userRepository.create(userData);
      return newUser;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        if (error.message.includes('UNIQUE')) {
          throw new Error(`Username "${userData.username}" already exists`);
        }
        if (error.message.includes('FOREIGN KEY')) {
          throw new Error(`Team ID ${userData.teamId} does not exist`);
        }
      }
      throw error;
    }
  },

  async updateUser(userId, userData) {
    // 1) must exist
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) throw new Error('User not found');

    // 2) username cannot change
    if (userData.username && userData.username !== existingUser.username) {
      throw new Error('Username cannot be changed');
    }

    // 3) role-specific rules if role/teamId present
    const nextRole = userData.role || existingUser.role;
    const nextTeamId = (userData.teamId !== undefined) ? userData.teamId : existingUser.teamId;

    if ((nextRole === 'Agent' || nextRole === 'Supervisor') && !nextTeamId) {
      throw new Error('Team ID is required for Agent and Supervisor roles');
    }
    if (nextRole === 'Admin') {
      userData.teamId = null; // force null
    }

    await userRepository.update(userId, userData);
    return await userRepository.findById(userId);
  },

  async deleteUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    await userRepository.softDelete(userId);
    return { success: true, message: 'User deleted successfully' };
  },

  validateUsername(username) {
    const regex = /^(AG|SP|AD)(00[1-9]|0[1-9]\d|[1-9]\d{2})$/;
    return regex.test(username);
  },

  getRoleFromUsername(username) {
    if (username.startsWith('AG')) return 'Agent';
    if (username.startsWith('SP')) return 'Supervisor';
    if (username.startsWith('AD')) return 'Admin';
    return null;
  }
};

module.exports = userService;