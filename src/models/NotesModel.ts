import pool from '../config/database';
import { UserRecipient } from '../types/auth';

export interface Note {
  id: number;
  userId: string;
  note: string;
  attachment?: string;
  recipientIds?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteParams {
  userId: string;
  note: string;
  attachment?: string;
  recipientIds?: number[];
}

export interface UpdateNoteParams {
  note?: string;
  attachment?: string;
  recipientIds?: number[];
}

export interface NoteWithRecipients extends Note {
  recipients?: Array<UserRecipient>;
}

export class NotesModel {
  // Add a new note
  static async addNote(params: CreateNoteParams): Promise<Note> {
    const {
      userId,
      note,
      attachment,
      recipientIds
    } = params;

    // Validate recipient IDs belong to the user
    if (recipientIds && recipientIds.length > 0) {
      const validationQuery = `
        SELECT validate_recipient_ids($1, $2) as is_valid
      `;
      const validationResult = await pool.query(validationQuery, [userId, recipientIds]);
      
      if (!validationResult.rows[0].is_valid) {
        throw new Error('One or more recipient IDs are invalid or do not belong to this user');
      }
    }

    const query = `
      INSERT INTO user_notes (user_id, note, attachment, recipient_ids)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      note,
      attachment || null,
      recipientIds || null
    ]);

    return this.mapRowToNote(result.rows[0]);
  }

  // Update an existing note
  static async updateNote(noteId: number, userId: string, params: UpdateNoteParams): Promise<Note | null> {
    const {
      note,
      attachment,
      recipientIds
    } = params;

    // Validate recipient IDs belong to the user if provided
    if (recipientIds && recipientIds.length > 0) {
      const validationQuery = `
        SELECT validate_recipient_ids($1, $2) as is_valid
      `;
      const validationResult = await pool.query(validationQuery, [userId, recipientIds]);
      
      if (!validationResult.rows[0].is_valid) {
        throw new Error('One or more recipient IDs are invalid or do not belong to this user');
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (note !== undefined) {
      updates.push(`note = $${paramIndex++}`);
      values.push(note);
    }

    if (attachment !== undefined) {
      updates.push(`attachment = $${paramIndex++}`);
      values.push(attachment);
    }

    if (recipientIds !== undefined) {
      updates.push(`recipient_ids = $${paramIndex++}`);
      values.push(recipientIds);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    // Add WHERE conditions
    values.push(noteId, userId);
    const whereClause = `WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}`;

    const query = `
      UPDATE user_notes 
      SET ${updates.join(', ')}
      ${whereClause}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToNote(result.rows[0]);
  }

  // Delete a note
  static async deleteNote(noteId: number, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM user_notes 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [noteId, userId]);
    return result.rows.length > 0;
  }

  // Get all notes for a user
  static async getNotesByUserId(userId: string): Promise<Note[]> {
    const query = `
      SELECT * FROM user_notes 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(row => this.mapRowToNote(row));
  }

  // Get notes with recipient details
  static async getNotesWithRecipients(userId: string): Promise<NoteWithRecipients[]> {
    const query = `
      SELECT 
        n.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ur.id,
              'userId', ur.user_id,
              'recipientName', ur.recipient_name,
              'recipientEmail', ur.recipient_email,
              'recipientContactNumber1', ur.recipient_contact_number_1,
              'recipientContactNumber2', ur.recipient_contact_number_2,
              'recipientRelationship', ur.recipient_relationship,
              'recipientInstagram', ur.recipient_instagram,
              'recipientLinkedin', ur.recipient_linkedin,
              'recipientTwitter', ur.recipient_twitter,
              'recipientFacebook', ur.recipient_facebook,
              'createdAt', ur.created_at,
              'updatedAt', ur.updated_at
            )
          ) FILTER (WHERE ur.id IS NOT NULL), 
          '[]'::json
        ) as recipients
      FROM user_notes n
      LEFT JOIN LATERAL unnest(n.recipient_ids) WITH ORDINALITY AS t(recipient_id, ord) ON true
      LEFT JOIN user_recipients ur ON ur.id = t.recipient_id AND ur.user_id = n.user_id
      WHERE n.user_id = $1
      GROUP BY n.id, n.user_id, n.note, n.attachment, n.recipient_ids, n.created_at, n.updated_at
      ORDER BY n.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      ...this.mapRowToNote(row),
      recipients: (row.recipients || []).map((recipient: any) => ({
        id: recipient.id,
        userId: recipient.userId,
        recipientName: recipient.recipientName,
        recipientEmail: recipient.recipientEmail,
        recipientContactNumber1: recipient.recipientContactNumber1,
        recipientContactNumber2: recipient.recipientContactNumber2,
        recipientRelationship: recipient.recipientRelationship,
        recipientInstagram: recipient.recipientInstagram,
        recipientLinkedin: recipient.recipientLinkedin,
        recipientTwitter: recipient.recipientTwitter,
        recipientFacebook: recipient.recipientFacebook,
        createdAt: recipient.createdAt ? new Date(recipient.createdAt) : undefined,
        updatedAt: recipient.updatedAt ? new Date(recipient.updatedAt) : undefined
      }))
    }));
  }

  // Get a single note by ID
  static async getNoteById(noteId: number, userId: string): Promise<Note | null> {
    const query = `
      SELECT * FROM user_notes 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [noteId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToNote(result.rows[0]);
  }

  // Helper method to map database row to Note interface
  private static mapRowToNote(row: any): Note {
    return {
      id: row.id,
      userId: row.user_id,
      note: row.note,
      attachment: row.attachment,
      recipientIds: row.recipient_ids || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
