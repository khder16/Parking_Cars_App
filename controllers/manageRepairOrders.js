import { StatusCodes } from "http-status-codes";
import User from '../modules/users.js';
import RepairOrder from "../modules/RepairOrder.js";
import parking from '../modules/parking.js';
import Notification from '../modules/notifications.js';
import { sendNotification } from '../utils/sendNotifications.js'

export const allRepairOrdersList = async (req, res) => {
    try {
        const repairList = await RepairOrder.find({})
            .sort({ createrAt: -1 })
            .populate({ path: 'carProblem', model: 'CarProblem' })
            .populate({ path: 'userId', model: 'User', select: "email firstName lastName" })
            .populate({ path: 'SelectedPark', model: 'Parking', select: "location.parkingName" });
        if (!repairList) {
            return res.status(400).json({ message: 'There is no repair orders to show' });
        }
        console.log(repairList);
        return res.status(200).json(repairList);
    } catch (error) {
        console.log(error);
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Internal Server Error" });
    }
}


export const deleteRepairOrder = async (req, res) => {
    try {
        const { id: orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ message: 'please provide order Id' });
        }
        const deletedRpairOrder = await RepairOrder.findOneAndDelete({ _id: orderId });
        if (!deleteRepairOrder) {
            return res.status(400).json({ message: 'The order can not found' });
        }
        return res.status(200).json({ message: deleteRepairOrder });
    } catch (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Internal Server Error" });
    }
}

export const updateRepairOrderStatuse = async (req, res) => {
    try {
        const { orderId, price, date } = req.body;
        if (!orderId) {
            return res.status(400).json({ message: "orderId not found" });
        }
        if (!price || !date) {
            return res.status(400).json({ message: "Please provide price and date" });
        }


        const repairOrder = await RepairOrder.findOneAndUpdate(
            { _id: orderId },
            {
                orderStatus: true,
                orderPrice: price,
                orderFinishDate: date,
            },
            { new: true }
        ).populate("userId");
        console.log(repairOrder);
        if (!repairOrder) {
            return res.status(400).json({ message: 'The order cannot be found' });
        }
        const userId = repairOrder.userId

        const user = await User.findById(userId)
        if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: `user hasn't been found` })
        }
        const fcmToken = user.fcmToken

        // Store notification in the database
        const message = `Your repair order has been updated with a price of $${price} and will be ready by ${date}.`;


        const notification = await Notification.create({
            userId: userId,
            message: message,
            deliveryDate: date,
            price: price
        })

        await notification.save();

        // Send notification via Firebase Cloud Messaging
        await sendNotification(userId, message, fcmToken);

        res.status(StatusCodes.OK).json({ message: repairOrder });
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Internal Server Error" });
    }
};