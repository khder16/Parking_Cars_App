import { StatusCodes } from "http-status-codes";
import parking from "../modules/parking.js";
import QRCode from "qrcode";
import fs from "fs";

export const qrcodeGenerator = async (req, res) => {
  const { id: ParkingNumber } = req.params;
  if (!ParkingNumber) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: req.t("parking:parkingNotFound") });
  }

  const code = await QRCode.toDataURL(`${ParkingNumber}`, {
    type: "image/jpeg",
  });

  return res.send(`<img src= "${code}" >`);
};

export const getQrParkingSpots = async (req, res) => {
  try {
    const { ParkingNumber } = req.body;
    if (!ParkingNumber) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:parkingNotFound") });
    }
    let ParkingSpots = await parking
      .findOne({ "location.parkingNumber": ParkingNumber })
      .select("park location.parkingName location.Price");
    if (!ParkingSpots) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:parkingNotFound") });
    }

    const spots = ParkingSpots.park.find((object) => object.filled != true);
    if (!spots) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:noEmptyParks") });
    }

    return res.status(StatusCodes.OK).json({
      ParkingName: ParkingSpots.location.parkingName,
      Price: ParkingSpots.location.Price,
      spot: spots.parkNumber,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: req.t("common:internal_server_error") });
  }
};
