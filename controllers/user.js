import User from "../modules/users.js";
import Cars from "../modules/cars.js";
import jwt from "jsonwebtoken";
import nodemailer, { createTransport } from "nodemailer";
import bcrypt from "bcryptjs";
import validator from "validator";
import CryptoJS from "crypto-js";
import { StatusCodes } from "http-status-codes";
import Admins from "../modules/admins.js";
import { SendVerifyCode } from "../utils/send-otp-code.js";

export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      username,
      firstName,
      lastName,
      carNumber,
      carModel,
      carType,
      fcmToken,
    } = req.body;

    if (
      !(
        email &&
        password &&
        username &&
        firstName &&
        lastName &&
        carNumber &&
        carModel &&
        carType
      )
    ) {
      return res.status(400).send(req.t("auth:all_input_required"));
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: req.t("auth.invalid_email") });
    }
    if (!validator.isLength(password, { min: 6 })) {
      return res
        .status(400)
        .json({ message: req.t("auth:password_min_length") });
    }
    if (!validator.isLength(confirmPassword, { min: 6 })) {
      return res.status(400).json({
        message: req.t("auth:confirm_password_min_length"),
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: req.t("auth:passwords_not_match"),
      });
    }
    if (!validator.isLength(username, { min: 3, max: 10 })) {
      return res.status(400).json({ message: req.t("auth:username_required") });
    }
    if (!validator.isLength(firstName, { min: 1, max: 10 })) {
      return res
        .status(400)
        .json({ message: req.t("auth:first_name_required") });
    }
    if (!validator.isLength(lastName, { min: 1, max: 10 })) {
      last_name_required;
      return res
        .status(400)
        .json({ message: req.t("auth:passwords_not_match") });
    }
    const isExist = await User.findOne({ $or: [{ email }, { username }] });
    if (isExist) {
      return res.status(409).json({
        message: req.t("auth:email_username_exists"),
      });
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: encryptedPassword,
      username: username,
      firstName: firstName,
      lastName: lastName,
      fcmToken: fcmToken,
    });
    const newUserCar = await Cars.create({
      onerId: newUser._id,
      carModel: carModel,
      carType: carType,
      carNumber: carNumber,
    });
    newUser.car = newUserCar._id;
    await newUser.save();
    await SendVerifyCode(email);

    return res
      .status(200)
      .json({ message: req.t("auth:registration_successful") });
  } catch (error) {
    throw new Error(error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use translation key for missing credentials
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: req.t("auth:all_input_required") });
    }

    const Admin = await Admins.findOne({ email: email });
    if (Admin) {
      // Use translation key for admin login prompt
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("auth:admin_login_required") });
    }

    const user = await User.findOne({ email }).populate(
      "car",
      "carModel carType carNumber"
    );

    if (user && (await bcrypt.compare(password.toString(), user.password))) {
      // Use translation key for unverified email
      if (user.emailVerified == false) {
        return res
          .status(400)
          .json({ message: req.t("auth:email_not_verified") });
      }

      console.log(`${user.username} Loged-in`);
      const token = jwt.sign({ email: user.email }, process.env.TOKEN_KEY, {
        expiresIn: "90d",
      });
      res.cookie("token", token, { maxAge: 240 * 60 * 60 * 1000 });

      res.status(200).json({
        message: req.t("auth:login_successful"),
        token: token,
        user: user,
      });
    } else {
      // Use translation key for incorrect credentials
      return res
        .status(400)
        .json({ message: req.t("auth:invalid_credentials") });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: req.t("error.server_error") }); // Added a generic server error translation
  }
};

export const logout = async (req, res) => {
  try {
    const token = "";
    res.cookie("token", token);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!validator.isLength(code, { min: 6, max: 6 })) {
      return res.status(400).json({ message: req.t("auth:code_length_error") });
    }
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: req.t("auth:incorrect_email_password") });
    }
    const user = await User.findOne({ email }).populate(
      "car",
      "carModel carType carNumber"
    );
    if (!user) {
      return res.status(400).json({ message: req.t("user:user_not_found") });
    }
    const verifyEmailCode = user.verifyEmailCode;
    console.log();
    const expirationCodeTime = user.expirationCodeTime;
    if (code.toString() !== verifyEmailCode) {
      return res.status(400).json({ message: req.t("auth:incorrect_code") });
    } else if (Date.now() > expirationCodeTime) {
      return res.status(400).json({ message: req.t("auth:expired_code") });
    } else {
      const updatedUser = await User.findOneAndUpdate(
        { email },
        { emailVerified: true },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: req.t("auth:user_not_found") });
      }

      const token = jwt.sign({ email: user.email }, process.env.TOKEN_KEY, {
        expiresIn: "90d",
      });
      // res.cookie('token', token, { maxAge: 240 * 60 * 60 * 1000 });
      return res.status(200).json({
        message: req.t("auth:code_verified"),
        token: token,
        user: user,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: req.t("invalid_email") });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: req.t("auth:not_found") });
    }
    const userResetPasswordCode = generateVerificationCode();
    const subject = "Reset Password email";
    const message = `Your reset password code  is: ${userResetPasswordCode} the expiration time in 5 minutes`;
    await sendEmail(email, subject, message);
    user.resetPasswordCode = userResetPasswordCode;
    user.resetPasswordExpiration = Date.now() + 5 * 60 * 1000;
    await user.save();
    return res
      .status(200)
      .json({ message: req.t("auth:password_reset_email_sent") });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    const email = req.body.email;
    if (!validator.isLength(newPassword, { min: 6 })) {
      return res
        .status(400)
        .json({ message: req.t("auth:password_min_length") });
    }
    if (!validator.isLength(confirmPassword, { min: 6 })) {
      return res
        .status(400)
        .json({ message: req.t("auth:confirm_password_min_length") });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: req.t("auth:passwords_not_match") });
    }
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const userUpdated = await User.findOneAndUpdate(
      { email: email },
      { password: encryptedPassword },
      { new: true }
    );
    res.status(200).json({ message: req.t("auth:password_reset_success") });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const verifyResetPasswordCode = async (req, res) => {
  try {
    const code = req.body.code;
    if (!validator.isLength(code, { min: 6, max: 6 })) {
      return res.status(400).json({ message: req.t("auth:code_length_error") });
    }
    const usermail = req.body.email;
    if (!validator.isEmail(usermail)) {
      return res.status(400).json({ message: req.t("auth:invalid_email") });
    }
    let user = await User.findOne({ email: usermail });
    if (!user) {
      return res.status(400).json({ message: req.t("auth:user_not_found") });
    }
    const verifyResetPassordCode = user.resetPasswordCode;
    const expirationResetPasswordCodeTime = user.resetPasswordExpiration;

    if (code.toString() !== verifyResetPassordCode) {
      return res.status(400).json({ message: req.t("auth:incorrect_code") });
    } else if (Date.now() > expirationResetPasswordCodeTime) {
      return res.status(400).json({ message: req.t("auth:expired_code") });
    } else {
      return res.status(200).json({ message: req.t("auth:code_verified") });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const sendCode = async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(400).json("Please provide the email");
    }
    const otp = generateVerificationCode();
    const message = `Your OTP code is: ${otp} the expiration time in 5 minutes`;
    const subject = `Email Verification`;
    const Expiration = Date.now() + 5 * 60 * 1000; // 5 minutes
    sendEmail(email, subject, message);
    const sentUser = await User.findOneAndUpdate(
      { email },
      { expirationCodeTime: Expiration, verifyEmailCode: otp.toString() },
      { new: true }
    );
    return res.status(200).json({ verifyEmailCode: sentUser.verifyEmailCode });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

export const sendEmail = async (email, subject, message) => {
  try {
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: "hashoomhashem112233@gmail.com",
        pass: "affv hfjb pmzm uolb",
      },
    });
    transporter.sendMail({
      from: "hashoomhashem112233@gamil.com",
      to: email,
      subject: subject,
      text: message,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.log("email not sent");
    console.log(error);
    throw new Error(error);
  }
};
export const UpdateUser = async (req, res) => {
  try {
    const {
      username,
      firstName,
      lastName,
      newusername,
      carNumber,
      carModel,
      carType,
    } = req.body;
    if (
      !username ||
      firstName ||
      lastName ||
      newusername ||
      carNumber ||
      carModel ||
      carType
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please send Full info " });
    }
    const user = await User.findOne({ username: username }).populate(
      "car",
      "carNumber carModel carType"
    );
    if (!user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: `Cannot find user ${username}` });
    }
    user.username = newusername;
    user.firstName = firstName;
    user.lastName = lastName;

    user.save();
    const UserCar = await Cars.findOne({ onerId: user._id });
    if (!UserCar) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Cannot find Specified Car for this user" });
    }
    (UserCar.carModel = carModel),
      (UserCar.carNumber = carNumber),
      (UserCar.carType = carType);
    UserCar.save();

    return res.status(StatusCodes.OK).json({ message: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const changeLanguage = (req, res) => {
  const { lng } = req.query;
  // Validate supported languages
  const supportedLangs = ["en", "ar"];
  if (!lng || !supportedLangs.includes(lng)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Unsupported language. Use "en" or "ar".',
    });
  }

  // Set language cookie (expires in 30 days)
  res.cookie("i18next", lng, {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
  });
};
