import express, { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { UserProfileModel } from '../models/UserProfile';
import { RecipientProfileModel } from '../models/RecipientProfile';
import { NotesModel } from '../models/NotesModel';
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

// === EXTENDED PROFILE ENDPOINTS ===

// Get complete user profile with approvers
router.get('/profile/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const completeProfile = await UserProfileModel.getCompleteProfile(userId);
    
    if (!completeProfile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    res.json(completeProfile);
  } catch (error) {
    console.error('Error fetching complete profile:', error);
    res.status(500).json({
      error: 'Failed to fetch complete profile',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Create/Update extended profile
router.put('/profile/extended', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      age,
      contactNumber1,
      contactNumber2,
      instagramHandle,
      linkedinProfile,
      twitterHandle,
      facebookProfile
    } = req.body;

    // Basic validation
    if (!contactNumber1) {
      return res.status(400).json({
        error: 'Primary contact number is required'
      });
    }

    if (age && (age < 13 || age > 120)) {
      return res.status(400).json({
        error: 'Age must be between 13 and 120'
      });
    }

    const updatedProfile = await UserProfileModel.upsertProfile(userId, {
      age,
      contactNumber1,
      contactNumber2,
      instagramHandle,
      linkedinProfile,
      twitterHandle,
      facebookProfile
    });

    res.json({
      message: 'Extended profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating extended profile:', error);
    res.status(500).json({
      error: 'Failed to update extended profile',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Add approver
router.post('/profile/approvers', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      approverName,
      approverEmail,
      approverContactNumber1,
      approverContactNumber2,
      approverRelationship,
      approverInstagram,
      approverLinkedin,
      approverTwitter,
      approverFacebook,
    } = req.body;

    // Validation
    if (!approverName || !approverEmail) {
      return res.status(400).json({
        error: 'Approver name and email are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(approverEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    const newApprover = await UserProfileModel.addApprover({
      userId,
      approverName,
      approverEmail,
      approverContactNumber1,
      approverContactNumber2,
      approverRelationship,
      approverInstagram,
      approverLinkedin,
      approverTwitter,
      approverFacebook
    });

    res.status(201).json({
      message: 'Approver added successfully',
      approver: newApprover
    });
  } catch (error) {
    console.error('Error adding approver:', error);
    res.status(500).json({
      error: 'Failed to add approver',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update approver
router.put('/profile/approvers/:approverId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { approverId } = req.params;
    const approverIdInt = parseInt(approverId);
    
    if (isNaN(approverIdInt)) {
      return res.status(400).json({
        error: 'Invalid approver ID'
      });
    }

    const updatedApprover = await UserProfileModel.updateApprover(approverIdInt, req.body);
    
    if (!updatedApprover) {
      return res.status(404).json({
        error: 'Approver not found'
      });
    }

    res.json({
      message: 'Approver updated successfully',
      approver: updatedApprover
    });
  } catch (error) {
    console.error('Error updating approver:', error);
    res.status(500).json({
      error: 'Failed to update approver',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Delete approver
router.delete('/profile/approvers/:approverId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { approverId } = req.params;
    const approverIdInt = parseInt(approverId);
    
    if (isNaN(approverIdInt)) {
      return res.status(400).json({
        error: 'Invalid approver ID'
      });
    }

    const deleted = await UserProfileModel.deleteApprover(userId, approverIdInt);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Approver not found'
      });
    }

    res.json({
      message: 'Approver deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting approver:', error);
    res.status(500).json({
      error: 'Failed to delete approver',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Add recipient profile
router.post('/profile/recipients', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      recipientName,
      recipientEmail,
      recipientContactNumber1,
      recipientContactNumber2,
      recipientRelationship,
      recipientInstagram,
      recipientLinkedin,
      recipientTwitter,
      recipientFacebook
    } = req.body;

    // Validation
    if (!recipientName || !recipientEmail) {
      return res.status(400).json({
        error: 'Recipient name and email are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    const newRecipient = await RecipientProfileModel.addRecipient({
      userId,
      recipientName,
      recipientEmail,
      recipientContactNumber1,
      recipientContactNumber2,
      recipientRelationship,
      recipientInstagram,
      recipientLinkedin,
      recipientTwitter,
      recipientFacebook
    });

    res.status(201).json({
      message: 'Recipient added successfully',
      recipient: newRecipient
    });
  } catch (error) {
    console.error('Error adding recipient:', error);
    res.status(500).json({
      error: 'Failed to add recipient',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update recipient profile
router.put('/profile/recipients/:recipientId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params;
    const recipientIdInt = parseInt(recipientId);
    
    if (isNaN(recipientIdInt)) {
      return res.status(400).json({
        error: 'Invalid recipient ID'
      });
    }

    const updatedRecipient = await RecipientProfileModel.updateRecipient(recipientIdInt, req.body);
    
    if (!updatedRecipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    res.json({
      message: 'Recipient updated successfully',
      recipient: updatedRecipient
    });
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({
      error: 'Failed to update recipient',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Delete recipient profile
router.delete('/profile/recipients/:recipientId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { recipientId } = req.params;
    const recipientIdInt = parseInt(recipientId);
    
    if (isNaN(recipientIdInt)) {
      return res.status(400).json({
        error: 'Invalid recipient ID'
      });
    }

    const deleted = await RecipientProfileModel.deleteRecipient(userId, recipientIdInt);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    res.json({
      message: 'Recipient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({
      error: 'Failed to delete recipient',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// === NOTES MANAGEMENT ENDPOINTS ===

// Get all notes for current user
router.get('/notes', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notes = await NotesModel.getNotesWithRecipients(userId);
    
    res.json({
      message: 'Notes retrieved successfully',
      notes: notes
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      error: 'Failed to fetch notes',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Add new note
router.post('/notes', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      note,
      attachment,
      recipientIds
    } = req.body;

    // Validation
    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        error: 'Note content is required'
      });
    }

    if (note.length > 10000) {
      return res.status(400).json({
        error: 'Note content is too long (maximum 10000 characters)'
      });
    }

    if (recipientIds && !Array.isArray(recipientIds)) {
      return res.status(400).json({
        error: 'recipientIds must be an array'
      });
    }

    const newNote = await NotesModel.addNote({
      userId,
      note: note.trim(),
      attachment,
      recipientIds
    });

    res.status(201).json({
      message: 'Note added successfully',
      note: newNote
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      error: 'Failed to add note',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update existing note
router.put('/notes/:noteId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const userId = req.user!.id;
    const noteIdInt = parseInt(noteId);
    
    if (isNaN(noteIdInt)) {
      return res.status(400).json({
        error: 'Invalid note ID'
      });
    }

    const {
      note,
      attachment,
      recipientIds
    } = req.body;

    // Validation
    if (note !== undefined && (!note || note.trim().length === 0)) {
      return res.status(400).json({
        error: 'Note content cannot be empty'
      });
    }

    if (note !== undefined && note.length > 10000) {
      return res.status(400).json({
        error: 'Note content is too long (maximum 10000 characters)'
      });
    }

    if (recipientIds !== undefined && !Array.isArray(recipientIds)) {
      return res.status(400).json({
        error: 'recipientIds must be an array'
      });
    }

    const updateData: any = {};
    if (note !== undefined) updateData.note = note.trim();
    if (attachment !== undefined) updateData.attachment = attachment;
    if (recipientIds !== undefined) updateData.recipientIds = recipientIds;

    const updatedNote = await NotesModel.updateNote(noteIdInt, userId, updateData);
    
    if (!updatedNote) {
      return res.status(404).json({
        error: 'Note not found'
      });
    }

    res.json({
      message: 'Note updated successfully',
      note: updatedNote
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      error: 'Failed to update note',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Delete note
router.delete('/notes/:noteId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const userId = req.user!.id;
    const noteIdInt = parseInt(noteId);
    
    if (isNaN(noteIdInt)) {
      return res.status(400).json({
        error: 'Invalid note ID'
      });
    }

    const deleted = await NotesModel.deleteNote(noteIdInt, userId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Note not found'
      });
    }

    res.json({
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      error: 'Failed to delete note',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get single note by ID
router.get('/notes/:noteId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const userId = req.user!.id;
    const noteIdInt = parseInt(noteId);
    
    if (isNaN(noteIdInt)) {
      return res.status(400).json({
        error: 'Invalid note ID'
      });
    }

    const note = await NotesModel.getNoteById(noteIdInt, userId);
    
    if (!note) {
      return res.status(404).json({
        error: 'Note not found'
      });
    }

    res.json({
      message: 'Note retrieved successfully',
      note: note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      error: 'Failed to fetch note',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
