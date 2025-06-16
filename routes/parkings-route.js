import { Router } from "express";
import { addParking,bookingPark,ParkingTimer,ExpandParkingTime ,bookingRepairPark,CanceLBooking} from "../controllers/booking.js";
import { getParkingLocations,getParkingSpots } from '../controllers/map.js'
import { qrcodeGenerator, getQrParkingSpots } from "../controllers/qr-code.js";
import { verifyToken } from "../middleware/verify-token.js";

const router = Router();


router.route('/bookingPark').post(verifyToken, bookingPark)
router.route('/addparking').post(verifyToken, addParking)
router.route('/getclosestpark').post(verifyToken, getParkingLocations)
router.route('/getParkingSpots').post(verifyToken, getParkingSpots)
router.route('/ParkingTimer').post(verifyToken, ParkingTimer)
router.route('/expandParkingTime').post(verifyToken, ExpandParkingTime)
router.route('/HomeParkingTimer').post(verifyToken, ParkingTimer)
router.route('/getSpotBycode').post(verifyToken, getQrParkingSpots)
router.route('/cancelbooking').post(verifyToken, CanceLBooking)
router.route('/generateqrcode/:id').get(qrcodeGenerator)




export default router