const analyzeService = require('../services/analyzeService');

class AnalyzeController {
  async handleRecording(req, res) {
    const userId = req.user.id;
    const { recordingData } = req.body;

    if (!recordingData) {
      throw new Error('No recording data provided');
    }

    const result = await analyzeService.processRecording(userId, recordingData);
    return { success: true, data: result };
  }

  async handleFileUpload(req, res) {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      throw new Error('No file uploaded');
    }

    const result = await analyzeService.processFile(userId, file);
    return { success: true, data: result };
  }

  async getAnalysisHistory(req, res) {
    const userId = req.user.id;
    const history = await analyzeService.getUserAnalyses(userId);
    return { success: true, data: history };
  }
}

module.exports = new AnalyzeController(); 