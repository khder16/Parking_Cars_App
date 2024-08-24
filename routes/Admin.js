import { Router } from 'express'
const router = Router()
import { registerAdmin, addPark, editPark, loginAdmin, getMyParks, Settings } from '../controllers/Admins.js'
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.get('/my-parks', getMyParks);
router.post('/settings', settings);
router.post('/add-park', addPark);
router.put('/edit-park/:parkId', editPark);

export default router