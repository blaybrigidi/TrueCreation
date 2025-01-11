const EncryptionService = require("./secure");

const responseHandler = (controllerFn) => async (req, res, next) => {
    try {
        const result = await controllerFn(req, res, next);
        console.log('Response handler received result:', result);
        
        // If response has already been sent, don't send again
        if (res.headersSent) {
            return;
        }

        // If no result, send empty success response
        if (!result) {
            return res.status(200).send();
        }

        // Set status code from result or default to 200
        const statusCode = result.status || 200;

        // If data needs encryption
        if (result.data && EncryptionService.shouldEncrypt(result.data)) {
            console.log('Encrypting response data:', result.data);
            const encryptedData = EncryptionService.encrypt(result.data);
            console.log('Encrypted response:', encryptedData);
            
            return res.status(statusCode).json({
                status: statusCode,
                msg: result.msg || 'Success',
                data: encryptedData
            });
        }

        console.log('Sending unencrypted response:', result.data);
        // Send regular response
        return res.status(statusCode).json({
            status: statusCode,
            msg: result.msg || 'Success',
            data: result.data
        });
    } catch (error) {
        console.error('Error in response handler:', error);
        
        // If response has already been sent, don't send again
        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            status: 500,
            msg: 'Internal server error',
            data: null
        });
    }
};

module.exports = responseHandler; 