import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  /**
   * Google OAuth Login endpoint
   */
  public async googleLogin(req: Request, res: Response) {
    try {
      const { email, name, avatar, googleId } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find or create user
      const user = await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: name || email.split('@')[0],
          avatar: avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          googleId,
        },
        update: {
          name: name || undefined,
          avatar: avatar || undefined,
          googleId: googleId || undefined,
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          slackConnected: !!user.slackWebhookUrl,
        },
      });
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      return res.status(500).json({ error: 'Google login failed', details: error.message });
    }
  }

  /**
   * Standard / Demo Login endpoint (matching Figma)
   */
  public async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const targetEmail = email || 'oliver.brown@domain.io';
      const targetName = email ? email.split('@')[0] : 'Oliver Brown';

      const user = await prisma.user.upsert({
        where: { email: targetEmail },
        create: {
          email: targetEmail,
          name: targetName,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        },
        update: {},
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          slackConnected: !!user.slackWebhookUrl,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Login failed', details: error.message });
    }
  }

  /**
   * Get current authenticated user
   */
  public async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        // Return default Figma mock user if not logged in
        return res.json({
          user: {
            id: 'mock-user-1',
            name: 'Oliver Brown',
            email: 'oliver.brown@domain.io',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            slackConnected: false,
          },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          slackConnected: !!user.slackWebhookUrl,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
  }
}

export const authController = new AuthController();
