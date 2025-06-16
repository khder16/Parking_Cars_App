import {Router} from 'express'
const router=Router()
import {NumberOfParksByLocation,TotalRevenu,NumberOfLocationsByPark ,TotalRevenuByPark,RepairOrdersByproblem} from '../controllers/Statsics.js'
router.route('/numberofparks').get(NumberOfParksByLocation)
router.route('/totalRevenu').get(TotalRevenu)
router.route('/numberoflocationbypark').get(NumberOfLocationsByPark)
router.route('/TotalRevenueByPark').get(TotalRevenuByPark)
router.route('/RepairOrdersByproblem').get(RepairOrdersByproblem)

export default router