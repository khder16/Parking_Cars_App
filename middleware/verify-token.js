import jwt from 'jsonwebtoken';
import User from '../modules/users.js'
import { sendEmail } from '../controllers/user.js';
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000)
};


export const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.body.token || req.query.token || req.headers["x-access-token"];

        if (!token) {
            res.status(400).json("A token is required for authentication");
        }

        const decoded = jwt.verify(token, process.env.TOKEN_KEY);

        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        req.user = { username: user.username }
        next();
    } catch (error) {
        res.status(400).json({ message: "Unauthorized", error: error });
        console.log(error);
    }
}
export const VerificationCode = async (req, res) => {

    try {
        const email = req.body.email;
        if (!email) {
            return res.status(400).json("Please provide the email")
        }
        const otp = generateVerificationCode()
        const message = `Your OTP code is: ${otp} the expiration time in 5 minutes`
        const subject = `Email Verification`
        const Expiration = Date.now() + 5 * 60 * 1000; // 5 minutes
        sendEmail(email, subject, message)

        const sentUser = await User.findOneAndUpdate({ email }, { expirationCodeTime: Expiration, verifyEmailCode: otp.toString() }, { new: true })
        next()
    } catch (error) {
        return res.status(400).json({ msg: "an error in middel ware" })



    }
}
