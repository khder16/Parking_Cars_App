import { StatusCodes } from "http-status-codes";
import Parking from "../modules/parking.js";
import User from "../modules/users.js";
import Cars from "../modules/cars.js";
import CarProblem from "../modules/car-problems.js";
import ParkingOrder from "../modules/parking-order.js";
import Admin from "../modules/admins.js";
import { io } from "../app.js";
import RepairOrder from "../modules/repair-order.js";

// Booking Spot By user

export const bookingPark = async (req, res) => {
  try {
    const { username, duration, Spot, date } = req.body;
    const parkingName = req.body.parkingName;
    if (!username || !duration || !Spot || !date) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("auth:all_input_required") });
    }
    const now = new Date();
    /// create and set time t0 00:00:00
    let ParkingStartingDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    // convert the time coming from request to 24 hour format
    const newDate = convertTo24HourFormat(date);
    // get the hour and minutes
    let [hour, minute] = newDate.split(":");

    hour = Number(hour) + 3;

    const BookineEndTime = ParkingStartingDate.setHours(
      hour + duration,
      minute
    );

    const parkChoosed = await Parking.findOne({
      "location.parkingName": parkingName,
    }).populate("Admin");
    if (!parkChoosed) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:parkingNotFound") });
    }
    const user = await User.findOne({ username }).populate("car");
    if (!user) {
      return res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ message: req.t("user:user_not_found") });
    }
    const carNumber = user.car.carNumber;

    const emptyPark = parkChoosed.park.find(
      (object) => object.parkNumber === Spot
    );
    if (!emptyPark) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:noEmptyParks") });
    }

    emptyPark.filled = true;
    emptyPark.carNumber = carNumber;
    emptyPark.bookingEndTime = BookineEndTime;
    emptyPark.duration = duration;
    await emptyPark.save();
    await parkChoosed.save();

    user.bookedPark = {
      parkNumber: emptyPark.parkNumber,
      bookingEndTime: emptyPark.bookingEndTime,
      ChoosedParkName: parkingName,
    };

    let paymentAmount = duration * parkChoosed.location.Price;
    // Discount for Pro User
    if (user.pro) {
      paymentAmount *= 0.75;
    }
    user.paymentAmount += paymentAmount;
    await user.save();
    const ParkOrder = await ParkingOrder.create({
      userId: user._id,
      SelectedPark: parkChoosed._id,
      duration: duration,
      Price: paymentAmount,
    });
    await ParkOrder.populate(
      "userId",
      "email firstName lastName bookedPark.bookingEndTime"
    );
    await ParkOrder.populate("SelectedPark", "location.parkingName");
    const ParkingOrder2 = await ParkingOrder.findOne({ _id: ParkOrder._id })
      .populate("userId", "email firstName lastName bookedPark.bookingEndTime")
      .populate("SelectedPark", "location.parkingName")
      .lean();
    ParkingOrder2.orderFinishDate =
      ParkingOrder2.userId.bookedPark.bookingEndTime;
    delete ParkingOrder2.userId.bookedPark;

    const AdminName = parkChoosed.Admin.username;
    let socketId = u.find((user) => user.user == AdminName);
    if (socketId) {
      io.to(socketId.id).emit("add", ParkingOrder2);
    }

    return res.status(200).json({
      parkNumber: emptyPark.parkNumber,
      carNumber: emptyPark.carNumber,
      bookingEndTime: emptyPark.bookingEndTime,
      parksNum: user.bookedPark.parkNumber,
      parkingName: parkingName,
      duration: emptyPark.duration,
      Price: paymentAmount,
    });
  } catch (error) {
    console.error("Error booking parking:", error);
    return res.status(500).json({ message: "Booking failed" });
  }
};

export const bookingRepairPark = async (req, res) => {
  try {
    const { parkNumber, Problem, userName } = req.body;

    if (!userName) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("user:user_not_found") });
    }
    if (!parkNumber) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:parkingNotFound") });
    }

    console.log();
    const user = await User.findOne({ username: userName }).populate({
      path: "car",
      model: "Cars",
    });
    if (!user) {
      const message =
        req.cookies.language === "ar"
          ? " لم يتم ايجاد اسم المستخدم"
          : "UserName not found";
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("user:user_not_found") });
    }
    const car = await Cars.findOne({ onerId: user._id });
    const ProblemInfo = await CarProblem.findOne({ Name: Problem });
    console.log(ProblemInfo);
    if (!car) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ messasge: req.t("repair:carNotFound") });
    }
    if (!ProblemInfo) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ messasge: req.t("repair:invalidProblem") });
    }

    if (ProblemInfo.ProblemType == "Mechanical") {
      car.carProblems.Mechanic.push(Problem);
    }
    if (ProblemInfo.ProblemType == "Electric") {
      car.carProblems.Electric.push(Problem);
    }
    await car.save();

    if (!user) {
      return res.status(400).json({ message: req.t("user:user_not_found") });
    }
    const userCar = user.car;

    const selectedPark = await Parking.findOne({
      "location.parkingNumber": parkNumber,
    });
    if (!selectedPark) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ messasge: req.t("parking:parkingNotFound") });
    }
    const emptyPark = selectedPark.carRepairPlaces.find((park) => !park.filled);
    if (!emptyPark) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:noEmptyParks") });
    }

    emptyPark.filled = true;
    emptyPark.carNumber = user.car.carNumber;
    await emptyPark.save();
    const Order = await RepairOrder.create({
      userId: user._id,
      carProblem: ProblemInfo._id,
      SelectedPark: selectedPark._id,
      orderPrice: ProblemInfo.Price,
    });
    if (!Order) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("orders:order_not_found") });
    }

    return res.status(200).json({
      Location: selectedPark.location.parkingName,
      Problem: Problem,
      EstimatedTime: ProblemInfo.duration,
      Price: ProblemInfo.Price,
      image: ProblemInfo.image,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
};

export const addParking = async (req, res) => {
  try {
    const {
      parkingNumber,
      parkingName,
      location,
      park,
      carRepairPlaces,
      Price,
      AdminEmail,
    } = req.body;
    const AdminId = await Admin.findOne({ email: AdminEmail });
    if (!AdminId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("admin:admin_not_found") });
    }
    const newParking = await Parking.create({
      Admin: AdminId._id,
      parkingNumber: parkingNumber,
      parkingName: parkingName,
      location: location,
      park: park,
      carRepairPlaces: carRepairPlaces,
      Price: Price,
    });
    return res.status(200).json({ newParking });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

export const ParkingTimer = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username }).populate("bookedPark");

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: req.t("orders:no_parking_orders"),
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    }

    const { parkNumber, bookingEndTime } = user.bookedPark;
    const parkingName = await Parking.findOne({
      "location.parkingName": user.bookedPark.ChoosedParkName,
    });
    if (!parkingName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: req.t("parking:noParkChosen"),
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    }
    const park = parkingName.park.find((park) => park.parkNumber == parkNumber);
    const duration = park.duration;
    const currentTime = new Date();

    // Assuming bookingEndTime is stored in UTC and adjusting for a timezone difference if necessary
    let adjustedBookingEndTime = new Date(bookingEndTime);
    adjustedBookingEndTime.setHours(
      bookingEndTime.getHours() - (park.duration + 3)
    );
    console.log(bookingEndTime + "     current Time :" + currentTime);

    // Check if the parking time hasn't started yet
    if (currentTime < adjustedBookingEndTime) {
      return res.status(StatusCodes.OK).json({
        message: req.t("parking:parkingNotStarted"),
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    }

    // Check if the parking time has ended
    if (
      currentTime >
      adjustedBookingEndTime.setHours(
        adjustedBookingEndTime.getHours() + park.duration
      )
    ) {
      park.duration = 0;
      park.filled = false;
      park.carNumber = null;
      (user.bookedPark.ChoosedParkName = null),
        (user.bookedPark.bookingEndTime = null),
        (user.bookedPark.parkNumber = null);
      await user.save();
      await parkingName.save();
      return res.status(StatusCodes.OK).json({
        message: req.t("parking:parkingTimeEnded"),
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    }

    // Calculate the remaining time in milliseconds
    const remainingTimeMillis =
      adjustedBookingEndTime.getTime() - currentTime.getTime();

    // Convert milliseconds to hours, minutes, and seconds
    const hours = Math.floor(remainingTimeMillis / (1000 * 60 * 60));
    const mins = Math.floor(
      (remainingTimeMillis % (1000 * 60 * 60)) / (1000 * 60)
    );
    const secs = Math.floor((remainingTimeMillis % (1000 * 60)) / 1000);

    return res
      .status(StatusCodes.OK)
      .json({ hours: hours, minutes: mins, seconds: secs });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while processing the parking timer.",
    });
  }
};

export const ExpandParkingTime = async (req, res) => {
  const { username, duration } = req.body;
  if (!username) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: req.t("auth:username_required") });
  }
  const user = await User.findOne({ username: username });
  if (!username) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: req.t("user:user_not_found") });
  }
  if (!user.bookedPark) {
    return res
      .status(StatusCodes.OK)
      .json({ message: req.t("parking:noParkChosen") });
  }
  let bookingEndTime = user.bookedPark.bookingEndTime;
  let newBookingEndDate = new Date(
    bookingEndTime.getTime() + duration * 60 * 60 * 1000
  );

  user.bookedPark.bookingEndTime =
    user.bookedPark.bookingEndTime.getTime() + duration * 60 * 60 * 1000;

  await user.save();
  const Park = await Parking.findOne({
    "location.parkingName": user.bookedPark.ChoosedParkName,
  });
  if (!Park) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ messgae: req.t("parking:parkingNotFound") });
  }
  const spot = Park.park.find(
    (object) => object.parkNumber == user.bookedPark.parkNumber
  );
  spot.bookingEndTime =
    user.bookedPark.bookingEndTime + duration * 60 * 60 * 1000;
  spot.duration += duration;
  await Park.save();
  const order = await ParkingOrder.findOne({ userId: user._id });
  if (!order) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: req.t("orders:order_not_found") });
  }
  const oldduration = order.duration;
  order.duration = oldduration + duration;
  const oldPrice = order.Price;
  order.Price = oldPrice + duration * Park.location.Price;

  order.save();
  return res
    .status(StatusCodes.OK)
    .json({ message: req.t("translation:expand.success") });
};

function convertTo24HourFormat(timeString) {
  const [time, period] = timeString.split(" ");
  const [hour, minute] = time.split(":");
  let formattedHour = parseInt(hour);

  if (period === "PM" && formattedHour != 12) {
    formattedHour += 12;
  }
  if (period === "AM" && formattedHour == 12) {
    formattedHour = 0;
  }
  //console.log(formattedHour);
  formattedHour = formattedHour.toString();

  return `${formattedHour}:${minute}`;
}
export const CanceLBooking = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("auth:email_required") });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("auth:user_not_found") });
    }

    const SelectedPark = await Parking.findOne({
      "location.parkingName": user.bookedPark.ChoosedParkName,
    });
    if (!SelectedPark) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:noParkChosen") });
    }

    const parkToUpdate = selectedPark.park[user.bookedPark.parkNumber - 1];
    parkToUpdate.duration = 0;
    parkToUpdate.filled = false;
    parkToUpdate.carNumber = null;
    parkToUpdate.bookingEndTime = null;

    await selectedPark.save();

    user.bookedPark.ChoosedParkName = "";
    user.bookedPark.parkNumber = null;
    user.bookedPark.bookingEndTime = null;
    await user.save();

    return res.status(StatusCodes.OK).json({ message: "Done Sucessfuly" });
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
  }
};
