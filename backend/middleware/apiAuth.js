require('dotenv').config();

const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    console.log('Received Headers:', {
        'x-api-key': apiKey,
        'x-api-secret': apiSecret
    });
    
    console.log('Expected Values:', {
        'API_KEY': process.env.API_KEY,
        'API_SECRET': process.env.API_SECRET
    });

    if (!apiKey || !apiSecret) {
        return res.status(401).send('API key and secret are required');
    }

    if (apiKey !== process.env.API_KEY || apiSecret !== process.env.API_SECRET) {
        return res.status(401).send('Invalid API credentials');
    }

    next();
};

module.exports = validateApiKey; 