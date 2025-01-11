const UserService = require('../services/userService');
const userService = new UserService();

exports.signup = async (req, res, next) => {
    const result = await userService.createUser(req.body);
    return result;
};

exports.login = async (req, res, next) => {
    const result = await userService.loginUser(req.body);
    return result;
};

exports.logout = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await userService.logoutUser(token);
    return result;
};

exports.getProfile = async (req, res, next) => {
    return {
        status: 200,
        msg: 'Profile retrieved successfully',
        data: req.user
    };
};

exports.updateProfile = async (req, res, next) => {
    const result = await userService.updateUserProfile(req.user.id, req.body);
    return result;
}; 