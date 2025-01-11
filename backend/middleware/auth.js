const TokenService = require('../helper/tokenService');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 401,
                msg: 'Authentication required',
                data: null
            });
        }

        const token = authHeader.split(' ')[1];
        const userId = await TokenService.validateToken(token);

        if (!userId) {
            return res.status(401).json({
                status: 401,
                msg: 'Invalid or expired token',
                data: null
            });
        }

        // Get user data
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({
                status: 401,
                msg: 'User not found',
                data: null
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            status: 500,
            msg: 'Authentication failed',
            data: null
        });
    }
};

module.exports = authMiddleware; 