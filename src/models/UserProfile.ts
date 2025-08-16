import pool from '../config/database';
import { UserProfile, UserApprover, CompleteUserProfile } from '../types/auth';

export class UserProfileModel {
  // Get complete user profile with approvers
  static async getCompleteProfile(userId: string): Promise<CompleteUserProfile | null> {
    try {
      // Get basic user info
      const userQuery = 'SELECT * FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return null;
      }

      const user = userResult.rows[0];
      
      // Get profile
      const profileQuery = 'SELECT * FROM user_profiles WHERE user_id = $1';
      const profileResult = await pool.query(profileQuery, [userId]);
      
      // Get approvers
      const approversQuery = `
        SELECT * FROM user_approvers 
        WHERE user_id = $1 
        ORDER BY is_primary DESC, created_at ASC
      `;
      const approversResult = await pool.query(approversQuery, [userId]);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          provider: user.provider,
          createdAt: user.created_at,
          lastLogin: user.last_login
        },
        profile: profileResult.rows.length > 0 ? {
          id: profileResult.rows[0].id,
          userId: profileResult.rows[0].user_id,
          age: profileResult.rows[0].age,
          contactNumber1: profileResult.rows[0].contact_number_1,
          contactNumber2: profileResult.rows[0].contact_number_2,
          instagramHandle: profileResult.rows[0].instagram_handle,
          linkedinProfile: profileResult.rows[0].linkedin_profile,
          twitterHandle: profileResult.rows[0].twitter_handle,
          facebookProfile: profileResult.rows[0].facebook_profile,
          createdAt: profileResult.rows[0].created_at,
          updatedAt: profileResult.rows[0].updated_at
        } : undefined,
        approvers: approversResult.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          approverName: row.approver_name,
          approverEmail: row.approver_email,
          approverContactNumber1: row.approver_contact_number_1,
          approverContactNumber2: row.approver_contact_number_2,
          approverRelationship: row.approver_relationship,
          approverInstagram: row.approver_instagram,
          approverLinkedin: row.approver_linkedin,
          approverTwitter: row.approver_twitter,
          approverFacebook: row.approver_facebook,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))
      };
    } catch (error) {
      console.error('Error getting complete profile:', error);
      throw error;
    }
  }
  // Create or update user profile
  static async upsertProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const query = `
        INSERT INTO user_profiles (
          user_id, age, contact_number_1, contact_number_2, 
          instagram_handle, linkedin_profile, twitter_handle, facebook_profile
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id) 
        DO UPDATE SET
          age = EXCLUDED.age,
          contact_number_1 = EXCLUDED.contact_number_1,
          contact_number_2 = EXCLUDED.contact_number_2,
          instagram_handle = EXCLUDED.instagram_handle,
          linkedin_profile = EXCLUDED.linkedin_profile,
          twitter_handle = EXCLUDED.twitter_handle,
          facebook_profile = EXCLUDED.facebook_profile,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [
        userId,
        profileData.age || null,
        profileData.contactNumber1 || null,
        profileData.contactNumber2 || null,
        profileData.instagramHandle || null,
        profileData.linkedinProfile || null,
        profileData.twitterHandle || null,
        profileData.facebookProfile || null,
      ];

      const result = await pool.query(query, values);
      const row = result.rows[0];

      return {
        id: row.id,
        userId: row.user_id,
        age: row.age,
        contactNumber1: row.contact_number_1,
        contactNumber2: row.contact_number_2,
        instagramHandle: row.instagram_handle,
        linkedinProfile: row.linkedin_profile,
        twitterHandle: row.twitter_handle,
        facebookProfile: row.facebook_profile,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error upserting profile:', error);
      throw error;
    }
  }
  // Add approver
  static async addApprover(approverData: UserApprover): Promise<UserApprover> {
    try {
      const query = `
        INSERT INTO user_approvers (
          user_id, approver_name, approver_email, approver_phone,
          approver_relationship, approver_instagram, approver_linkedin,
          approver_twitter
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        approverData.userId,
        approverData.approverName,
        approverData.approverEmail,
        approverData.approverContactNumber1 || null,
        approverData.approverContactNumber2 || null,
        approverData.approverRelationship || null,
        approverData.approverInstagram || null,
        approverData.approverLinkedin || null,
        approverData.approverTwitter || null,
        approverData.approverFacebook || null
      ];

      const result = await pool.query(query, values);
      const row = result.rows[0];

      return {
        id: row.id,
        userId: row.user_id,
        approverName: row.approver_name,
        approverEmail: row.approver_email,
        approverContactNumber1: row.approver_contact_number_1,
        approverContactNumber2: row.approver_contact_number_2,
        approverRelationship: row.approver_relationship,
        approverInstagram: row.approver_instagram,
        approverLinkedin: row.approver_linkedin,
        approverTwitter: row.approver_twitter,
        approverFacebook: row.approver_facebook,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error adding approver:', error);
      throw error;
    }
  }
  // Update approver
  static async updateApprover(approverId: number, approverData: Partial<UserApprover>): Promise<UserApprover | null> {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      Object.entries(approverData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'userId') {
          const dbColumn = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          setClause.push(`${dbColumn} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (setClause.length === 0) {
        return null;
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(approverId);

      const query = `
        UPDATE user_approvers 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        approverName: row.approver_name,
        approverEmail: row.approver_email,
        approverContactNumber1: row.approver_contact_number_1,
        approverContactNumber2: row.approver_contact_number_2,
        approverRelationship: row.approver_relationship,
        approverInstagram: row.approver_instagram,
        approverLinkedin: row.approver_linkedin,
        approverTwitter: row.approver_twitter,
        approverFacebook: row.approver_facebook,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error updating approver:', error);
      throw error;
    }
  }
  // Delete approver
  static async deleteApprover(userId: string, approverId: number): Promise<boolean> {
    try {
      // Check if this would leave less than 2 active approvers
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM user_approvers 
        WHERE user_id = $1 AND id != $2
      `;
      const countResult = await pool.query(countQuery, [userId, approverId]);
      
      if (parseInt(countResult.rows[0].count) < 2) {
        throw new Error('Cannot delete approver. User must have at least 2 active approvers.');
      }

      const query = 'DELETE FROM user_approvers WHERE id = $1 AND user_id = $2';
      const result = await pool.query(query, [approverId, userId]);
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting approver:', error);
      throw error;
    }
  }
  // Validate minimum approvers (business rule)
  static async validateMinimumApprovers(userId: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM user_approvers 
        WHERE user_id = $1
      `;
      const result = await pool.query(query, [userId]);
      const count = parseInt(result.rows[0].count);
      
      return count >= 2;
    } catch (error) {
      console.error('Error validating minimum approvers:', error);
      throw error;
    }
  }
}
