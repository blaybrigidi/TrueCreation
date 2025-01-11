module.exports = (controllerFunction) => {
  return async (req, res) => {
    try {
      const result = await controllerFunction(req);
      res.status(result.status).json({
        status: result.status,
        msg: result.msg,
        data: result.data,
      });
    } catch (error) {
      console.error("[ERROR] Handler error:", error);
      res.status(500).json({
        status: 500,
        msg: "Internal Server Error",
        data: null,
      });
    }
  };
}; 