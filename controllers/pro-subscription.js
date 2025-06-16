import { StatusCodes } from "http-status-codes";
import User from "../modules/users.js";

export const ProSubscribtion = async (req, res) => {
  const pro = [
    " 35% Discount on every service ",
    "Ad-Free Experience",
    "you’ll have access to our dedicated customer support team",
  ];
  try {
    return res.status(StatusCodes.OK).json({ pro: pro });
  } catch (error) {}
  return res.status(StatusCodes.OK).json({ pro: pro });
};
export const UserPro = async (req, res) => {
  try {
    const { username, Payment } = req.body;
    if (!username || !Payment) {
      return res
        .status(StatusCodes.OK)
        .json({ message: req.t("parking:missingInputs") });
    }
    const user = await User.findOne({ username: username });
    if (!user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("user:user_not_found") });
    }
    user.pro = true;
    await user.save();
    return res
      .status(StatusCodes.OK)
      .json({ message: req.t("user:pro_upgrade_success") });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal server error" });
  }
};
