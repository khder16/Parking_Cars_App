import { Router } from 'express'
const router = Router()
import {
  getAllParkingOrders,
  getAllRepairOrders,
  DeleteOrderParking,
  DeleteOrderRepair,
} from "../controllers/order-controllers.js";
import { verifyToken } from "../middleware/verify-token.js";
router.route('/getParkingOrders').get(verifyToken, getAllParkingOrders)
router.route('/getReapirOrders').get(verifyToken, getAllRepairOrders)
router.route('/deleteOrder').delete(verifyToken, DeleteOrderParking)
router.route('/deleterepair').delete(verifyToken, DeleteOrderRepair)
export default router