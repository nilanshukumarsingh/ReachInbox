import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/google', authController.googleLogin);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

export default router;
