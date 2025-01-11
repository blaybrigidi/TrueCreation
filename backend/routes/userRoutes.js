const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const responseHandler = require('../helper/encryptRes');
const authMiddleware = require('../middleware/auth');
const validateApiKey = require('../middleware/apiAuth');
const { validateSignupBody, validateLoginBody } = require('../validators/userValidation');

// Apply API key validation to all routes
router.use(validateApiKey);

// Public routes
router.post('/signup', 
  validateSignupBody,
  (req, res, next) => {
    console.log("Received signup request:", req.body);
    next();
  }, 
  responseHandler(userController.signup)
);

router.post('/login',
  validateLoginBody,
  responseHandler(userController.login)
);

// Protected routes - require authentication
router.use(authMiddleware);

router.post('/logout', responseHandler(userController.logout));
router.get('/profile', responseHandler(userController.getProfile));
router.put('/profile', responseHandler(userController.updateProfile));

// Protected audio routes
router.post('/upload', responseHandler(userController.uploadAudio));
router.post('/search', responseHandler(userController.searchAudio));
router.get('/analysis-history', responseHandler(userController.getAnalysisHistory));

module.exports = router; 