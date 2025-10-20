// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validation = require('../middleware/validation');

router.get('/', validation.validateUserFilters, validation.handleValidationErrors, userController.getAllUsers);
router.get('/:id', validation.validateUserId, validation.handleValidationErrors, userController.getUserById);
router.post('/', validation.validateCreateUser, validation.handleValidationErrors, userController.createUser);
router.put('/:id', validation.validateUpdateUser, validation.handleValidationErrors, userController.updateUser);
router.delete('/:id', validation.validateUserId, validation.handleValidationErrors, userController.deleteUser);

module.exports = router;