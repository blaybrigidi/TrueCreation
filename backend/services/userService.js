const { User } = require('../models');
const bcrypt = require('bcrypt');
const TokenService = require('../helper/tokenService');

class UserService {
  async createUser(userData) {
    try {
      const { name, email, phone, password } = userData;
      
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return {
          status: 400,
          msg: "Email already registered",
          data: null
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword
      });

      const tokenData = await TokenService.createToken(user.id);

      return {
        status: 201,
        msg: "User created successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          token: tokenData.token,
          expiresAt: tokenData.expiresAt
        }
      };
    } catch (error) {
      console.error("[ERROR] Failed to create user:", error);
      return {
        status: 500,
        msg: "Failed to create user",
        data: null
      };
    }
  }

  async loginUser(credentials) {
    try {
      const { email, password } = credentials;
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return {
          status: 401,
          msg: "Invalid credentials",
          data: null
        };
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return {
          status: 401,
          msg: "Invalid credentials",
          data: null
        };
      }

      const tokenData = await TokenService.createToken(user.id);

      return {
        status: 200,
        msg: "Login successful",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          token: tokenData.token,
          expiresAt: tokenData.expiresAt
        }
      };
    } catch (error) {
      console.error("[ERROR] Login failed:", error);
      return {
        status: 500,
        msg: "Login failed",
        data: null
      };
    }
  }

  async logoutUser(token) {
    try {
      if (!token) {
        return {
          status: 400,
          msg: "Token is required",
          data: null
        };
      }

      const success = await TokenService.removeToken(token);
      
      if (!success) {
        return {
          status: 400,
          msg: "Logout failed",
          data: null
        };
      }

      return {
        status: 200,
        msg: "Logged out successfully",
        data: null
      };
    } catch (error) {
      console.error("[ERROR] Logout failed:", error);
      return {
        status: 500,
        msg: "Logout failed",
        data: null
      };
    }
  }

  async getUserProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      throw new Error('User not found');
    }
    return { success: true, user };
  }

  async updateUserProfile(userId, updateData) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update(updateData);
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    };
  }
}

module.exports = UserService; 