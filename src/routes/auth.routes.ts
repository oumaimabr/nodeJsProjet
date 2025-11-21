import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  resetPasswordWithCode,
  updatePassword,
  refreshToken
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/resetpassword-code', resetPasswordWithCode);
router.put('/updatepassword', protect, updatePassword);
router.post('/refresh-token', refreshToken);

export default router;
