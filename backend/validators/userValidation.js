const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateSignupBody = (req, res, next) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
        return res.status(400).send("Missing required fields");
    }
    
    if (!validateEmail(email)) {
        return res.status(400).send("Invalid email format");
    }
    
    next();
};

const validateLoginBody = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send("Email and password are required");
    }

    if (!validateEmail(email)) {
        return res.status(400).send("Invalid email format");
    }
    
    next();
};

module.exports = {
    validateSignupBody,
    validateLoginBody
}; 