import pool from '../config/database';
import { UserRecipient  } from '../types/auth';

export class RecipientProfileModel {
  // Add recipient
  static async addRecipient(recipientData: UserRecipient): Promise<UserRecipient> {
    try {
      const query = `
        INSERT INTO user_recipients (
          user_id, recipient_name, recipient_email, recipient_contact_number_1, recipient_contact_number_2, recipient_relationship,
          recipient_instagram, recipient_linkedin, recipient_twitter, recipient_facebook
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        recipientData.userId,
        recipientData.recipientName,
        recipientData.recipientEmail,
        recipientData.recipientContactNumber1 || null,
        recipientData.recipientContactNumber2 || null,
        recipientData.recipientRelationship || null,
        recipientData.recipientInstagram || null,
        recipientData.recipientLinkedin || null,
        recipientData.recipientTwitter || null,
        recipientData.recipientFacebook || null
      ];

      const result = await pool.query(query, values);
      const row = result.rows[0];

      return {
        id: row.id,
        userId: row.user_id,
        recipientName: row.recipient_name,
        recipientEmail: row.recipient_email,
        recipientContactNumber1: row.recipient_contact_number_1,
        recipientContactNumber2: row.recipient_contact_number_2,
        recipientRelationship: row.recipient_relationship,
        recipientInstagram: row.recipient_instagram,
        recipientLinkedin: row.recipient_linkedin,
        recipientTwitter: row.recipient_twitter,
        recipientFacebook: row.recipient_facebook,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error adding recipient:', error);
      throw error;
    }
  }
  // Update recipient
  static async updateRecipient(recipientId: number, recipientData: Partial<UserRecipient>): Promise<UserRecipient | null> {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      Object.entries(recipientData).forEach(([key, value]) => {
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
      values.push(recipientId);

      const query = `
        UPDATE user_recipients
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
        recipientName: row.recipient_name,
        recipientEmail: row.recipient_email,
        recipientContactNumber1: row.recipient_contact_number_1,
        recipientContactNumber2: row.recipient_contact_number_2,
        recipientRelationship: row.recipient_relationship,
        recipientInstagram: row.recipient_instagram,
        recipientLinkedin: row.recipient_linkedin,
        recipientTwitter: row.recipient_twitter,
        recipientFacebook: row.recipient_facebook,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error updating recipient:', error);
      throw error;
    }
  }
  // Delete recipient
  static async deleteRecipient(userId: string, recipientId: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM user_recipients WHERE id = $1 AND user_id = $2';
      const result = await pool.query(query, [recipientId, userId]);

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting recipient:', error);
      throw error;
    }
  }

}