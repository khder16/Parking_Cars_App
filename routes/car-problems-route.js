import { Router } from "express";
import { getParkingLocations } from "../controllers/map.js";
import {
  selectProblem,
  AddProblem,
  getProblems,
} from "../controllers/problems-cars.js";
import { bookingRepairPark } from "../controllers/booking.js";
const router = Router();
router.post("/select-problem", selectProblem);
router.post("/add-problem", AddProblem);
router.get("/problem-types", getProblems);
router.post("/order-problem", bookingRepairPark);
router.post("/repair-places", getParkingLocations);
export default router;
