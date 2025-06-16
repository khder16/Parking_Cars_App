import { StatusCodes } from "http-status-codes";
import ParkingOrder from "../modules/parking-order.js";
import User from "../modules/users.js";
import RepairOrder from "../modules/repair-order.js";

export const getAllParkingOrders = async (req, res) => {
  try {
    const { username } = req.user;
    if (!username) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("auth:username_required") });
    }
    const user = await User.findOne({ username: username });
    if (!user) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("user:user_not_found") });
    }
    const orders = await ParkingOrder.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "email firstName lastName")
      .populate("SelectedPark", "location.Price location.parkingName");
    if (!orders) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("orders:no_repair_orders") });
    }

    return res.status(StatusCodes.OK).json(orders);
  } catch (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "an Error Occured " });
  }
};
export const getAllRepairOrders = async (req, res) => {
  try {
    const { username } = req.user;
    if (!username) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("user:username_required") });
    }
    const user = await User.findOne({ username: username });
    if (!user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("user:user_not_found") });
    }
    const orders = await RepairOrder.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "email firstName lastName")
      .populate("SelectedPark", " location.parkingName")
      .populate("carProblem");
    if (!orders) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("orders:no_repair_orders") });
    }
    return res.status(StatusCodes.ACCEPTED).json(orders);
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error });
  }
};
export const DeleteOrderParking = async (req, res) => {
  const { id: orderId } = req.body;
  if (!orderId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: req.t("orders:order_not_found") });
  }
  const order = await ParkingOrder.findOneAndDelete({ _id: orderId });
  if (!order) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: req.t("orders:order_not_found") });
  }

  return res
    .status(StatusCodes.OK)
    .json({ messgae: req.t("orders:deleted_successfully") });
};

export const DeleteOrderRepair = async (req, res) => {
  const { id: orderId } = req.body;
  if (!orderId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: req.t("orders:provide_order_id") });
  }
  const order = await RepairOrder.findOneAndDelete({ _id: orderId });
  if (!order) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: req.t("orders:order_not_found") });
  }

  return res
    .status(StatusCodes.OK)
    .json({ messgae: req.t("orders:deleted_successfully") });
};
