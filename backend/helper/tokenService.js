const crypto = require('crypto');
const { Token } = require('../models');
require('dotenv').config();

class TokenService {
    static generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    static async createToken(userId) {
        try {
            console.log('Creating token for user:', userId);
            const token = this.generateToken();
            const expiresIn = 24 * 60 * 60 * 1000; // 24 hours
            const expiresAt = new Date(Date.now() + expiresIn);

            console.log('Attempting to save token to database...');
            const tokenRecord = await Token.create({
                user_id: userId,
                token,
                expires_at: expiresAt,
                last_used_at: new Date()
            });
            console.log('Token saved successfully:', tokenRecord.id);

            return {
                token,
                expiresAt
            };
        } catch (error) {
            console.error('Token creation error:', error);
            throw new Error('Failed to create token');
        }
    }

    static async validateToken(token) {
        try {
            console.log('Validating token:', token);
            const tokenData = await Token.findOne({
                where: { token }
            });
            
            if (!tokenData) {
                console.log('Token not found in database');
                return false;
            }

            // Check if token is expired
            if (new Date() > tokenData.expires_at) {
                console.log('Token is expired');
                await this.removeToken(token);
                return false;
            }

            // Update last used timestamp
            await tokenData.update({
                last_used_at: new Date()
            });
            console.log('Token is valid for user:', tokenData.user_id);

            return tokenData.user_id;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    static async removeToken(token) {
        try {
            console.log('Removing token:', token);
            await Token.destroy({
                where: { token }
            });
            console.log('Token removed successfully');
            return true;
        } catch (error) {
            console.error('Token removal error:', error);
            return false;
        }
    }

    static async removeUserTokens(userId) {
        try {
            console.log('Removing all tokens for user:', userId);
            await Token.destroy({
                where: { user_id: userId }
            });
            console.log('User tokens removed successfully');
            return true;
        } catch (error) {
            console.error('User tokens removal error:', error);
            return false;
        }
    }
}

module.exports = TokenService; 