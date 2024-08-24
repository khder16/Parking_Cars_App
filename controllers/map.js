
import parking from "../modules/parking.js";
import { StatusCodes } from 'http-status-codes'

import User from '../modules/users.js';



export const getParkingLocations = async (req, res) => {
    try {
        const { userLatitude, userLongitude } = req.body;
        console.log(userLatitude);
        console.log(userLongitude);

            if(!userLatitude && !userLongitude) {
                return res.status(StatusCodes.NotFound).json({message:"Please Provide UserLatitude and UserLangtitude"})
            }
        const parkingLocations = await parking.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [userLongitude, userLatitude]
                    },
                    $maxDistance: 100000 // Maximum distance in meters 
                }
            }
        }, { parkingName: 1, location: 1, parkingNumber: 1, })
            .lean();

        console.log(parkingLocations);
        return res.status(200).json({ parkingLocations: parkingLocations });

    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
}
export const getParkingSpots = async (req, res) => {
    try {
        const { ParkingNumber, username } = req.body
        if (!ParkingNumber) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: " Please Provide Park Number" })

        }
        let ParkingSpots = await parking.findOne({ 'location.parkingNumber': ParkingNumber }).select('park location.parkingName location.Price')

        const spots = ParkingSpots.park.find(object => object.filled != true)
        if (!spots) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "no empty Spots Availabel in Parking Place" })
        }

        const user = await User.findOne({ username: username })
        return res.status(StatusCodes.OK).json(ParkingSpots)

    } catch (error) {
        console.log(error);
        return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message })

    }


}