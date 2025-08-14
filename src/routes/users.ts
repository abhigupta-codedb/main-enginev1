import express, { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { requireAuth } from './auth';

const router = express.Router();

// Get all users (admin only - for now just requires auth)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json(req.user);
});

// Update current user profile
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, picture } = req.body;
    const userId = req.user!.id;

    const updatedUser = await UserModel.updateProfile(userId, { name, picture });
    
    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get user by ID (admin only - for now just requires auth)
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findByGoogleId(id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Delete user (admin only - for now just requires auth)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    
    // Prevent users from deleting themselves
    if (id === currentUserId) {
      return res.status(400).json({
        error: 'Cannot delete your own account'
      });
    }

    const deleted = await UserModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
