import { Router } from 'express';
const router = Router()
import { allRepairOrdersList, deleteRepairOrder, updateRepairOrderStatuse } from '../controllers/manageRepairOrders.js';

import { verifyToken } from '../middleware/verifyToken.js'


router.get('/all-repair-orders', verifyToken, allRepairOrdersList);
router.delete('/delete-repair-order/:orderId', verifyToken, deleteRepairOrder); 
router.put('/update-repair-order/:orderId', verifyToken, updateRepairOrderStatuse);





export default router