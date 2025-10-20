// controllers/userController.js
const userService = require('../services/userService');

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const { role, status, teamId } = req.query;
      const users = await userService.getAllUsers({ role, status, teamId });
      res.status(200).json({ success: true, data: users, count: users.length });
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  createUser: async (req, res) => {
    try {
      const newUser = await userService.createUser(req.body);
      res.status(201).json({ success: true, message: 'User created successfully', data: newUser });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('already exists')) statusCode = 409;
      else if (error.message.includes('Invalid') || error.message.includes('required')) statusCode = 400;
      else if (error.message.includes('does not exist')) statusCode = 404;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await userService.updateUser(id, req.body);
      res.status(200).json({ success: true, message: 'User updated successfully', data: updated });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'User not found') statusCode = 404;
      else if (error.message.includes('cannot be changed') || error.message.includes('required') || error.message.includes('Invalid')) statusCode = 400;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }
};

module.exports = userController;