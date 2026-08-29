import { Router } from 'express';
import { slackController } from '../controllers/slack.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/connect', authMiddleware, slackController.connectSlack);
router.post('/test', authMiddleware, slackController.triggerTestAlert);
router.post('/disconnect', authMiddleware, slackController.disconnectSlack);
router.get('/status', authMiddleware, slackController.getStatus);

export default router;
