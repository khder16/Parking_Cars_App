import {Router} from 'express'
import {ProSubscribtion , UserPro} from '../controllers/Pro.js'
const router =Router()
router.route('/').post(ProSubscribtion)
router.route('/getPro').get(UserPro)
export default router