import { Router } from 'express';
import { emailController } from '../controllers/email.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/schedule', authMiddleware, emailController.scheduleEmails);
router.get('/scheduled', emailController.getScheduledEmails);
router.get('/sent', emailController.getSentEmails);
router.post('/star/:id', emailController.toggleStar);
router.delete('/:id', emailController.deleteEmail);
router.get('/stats', emailController.getStats);
router.post('/parse-csv', emailController.parseCsv);

export default router;
