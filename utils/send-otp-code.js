import { sendEmail } from '../controllers/user.js';
import User from '../modules/users.js';
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000)
};


export const SendVerifyCode = async (email) => {

    try {
      const otp = generateVerificationCode();
      const message = `Your OTP code is: ${otp} the expiration time in 5 minutes`;
      const subject = `Email Verification`;
      const Expiration = Date.now() + 5 * 60 * 1000; // 5 minutes
      await sendEmail(email, subject, message);
      const sentUser = await User.findOneAndUpdate(
        { email },
        { expirationCodeTime: Expiration, verifyEmailCode: otp.toString() },
        { new: true }
      );
      console.log(sentUser);
      return otp.toString();
    } catch (error) {
      console.log(error);
    }
}