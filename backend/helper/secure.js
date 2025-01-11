const crypto = require('crypto');
require('dotenv').config();

// Use environment variables for security
const algorithm = 'aes-256-cbc';
const key = Buffer.from('049c7e635ebc61027458aff460a5f86aae6efbef0ef530d8c1124840baad282d', 'hex');

class EncryptionService {
    static encrypt(data) {
        try {
            console.log('Encrypting data:', data);
            
            // Generate a new IV for each encryption
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            
            // Convert data to string if it's an object
            const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
            console.log('Data to encrypt:', text);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const result = {
                iv: iv.toString('hex'),
                encryptedData: encrypted
            };
            console.log('Encryption result:', result);

            return result;
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Encryption failed');
        }
    }

    static decrypt(encryptedData) {
        try {
            console.log('Decrypting data:', encryptedData);
            
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const encryptedText = encryptedData.encryptedData;

            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            console.log('Decrypted string:', decrypted);

            // Try to parse as JSON if possible
            try {
                const parsed = JSON.parse(decrypted);
                console.log('Parsed JSON:', parsed);
                return parsed;
            } catch {
                console.log('Not JSON, returning as string');
                return decrypted;
            }
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Decryption failed');
        }
    }

    static shouldEncrypt(data) {
        // Define what types of data should be encrypted
        const sensitiveFields = [
            'password',
            'email',
            'phone',
            'name',
            'token',
            'personalInfo',
            'analysisResults'
        ];

        if (typeof data !== 'object') return false;
        
        const shouldEncrypt = Object.keys(data).some(key => 
            sensitiveFields.includes(key.toLowerCase()) || 
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret')
        );
        
        console.log('Should encrypt data?', shouldEncrypt, 'Fields:', Object.keys(data));
        return shouldEncrypt;
    }
}

module.exports = EncryptionService; 