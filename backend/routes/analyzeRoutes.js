const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');
const { responseHandler } = require('../helper/responseHandler');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.post('/record', authMiddleware, responseHandler(analyzeController.handleRecording));
router.post('/file', authMiddleware, responseHandler(analyzeController.handleFileUpload));
router.get('/history', authMiddleware, responseHandler(analyzeController.getAnalysisHistory));

module.exports = router; 