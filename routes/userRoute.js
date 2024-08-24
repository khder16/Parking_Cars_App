import { Router } from "express";
const router = Router()

import { register, getDeviceLang, sendCode, verifyCode, login, verifyResetPasswordCode, logout, resetPassword, forgotPassword, UpdateUser } from '../controllers/user.js'
import { verifyToken, VerificationCode } from '../middleware/verifyToken.js'


router.route('/register').post(register);
router.route('/sendCode').post(sendCode);
router.route('/verifyCode').post(verifyCode);
router.route('/settings').put(UpdateUser)
router.route('/login').post(login);
router.route('/logout').get(verifyToken, logout);
router.route('/forgotpassword').post(forgotPassword);
router.route('/verifyResetPassCode').post(verifyResetPasswordCode);
router.route('/resetPassword').post(resetPassword)
router.route('/getDeviceLang').post(getDeviceLang)







export default router