import pool from '../config/database';

export interface FixedDateNote {
  id: number;
  userId: string;
  notesId: number;
  deliveryDate: Date;
  status: 'scheduled' | 'delivered' | 'cancelled' | 'failed';
  deletionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFixedDateNoteParams {
  userId: string;
  notesId: number;
  deliveryDate: Date;
  status?: 'scheduled' | 'delivered' | 'cancelled' | 'failed';
}

export interface UpdateFixedDateNoteParams {
  deliveryDate?: Date;
  status?: 'scheduled' | 'delivered' | 'cancelled' | 'failed';
  deletionDate?: Date;
}

export interface FixedDateNoteWithNote extends FixedDateNote {
  note?: {
    id: number;
    note: string;
    attachment?: string;
    recipientIds?: number[];
    createdAt: Date;
    updatedAt: Date;
  };
}

export class FixedDateNotesModel {
  // Create a new fixed date note
  static async createFixedDateNote(params: CreateFixedDateNoteParams): Promise<FixedDateNote> {
    const {
      userId,
      notesId,
      deliveryDate,
      status = 'scheduled'
    } = params;

    // Validate that the note belongs to the user
    const validationQuery = `
      SELECT validate_note_ownership($1, $2) as is_valid
    `;
    const validationResult = await pool.query(validationQuery, [userId, notesId]);
    
    if (!validationResult.rows[0].is_valid) {
      throw new Error('Note does not belong to this user or does not exist');
    }

    // Check if delivery date is in the future
    if (deliveryDate <= new Date()) {
      throw new Error('Delivery date must be in the future');
    }

    const query = `
      INSERT INTO fixed_date_notes (user_id, notes_id, delivery_date, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      notesId,
      deliveryDate,
      status
    ]);

    return this.mapRowToFixedDateNote(result.rows[0]);
  }

  // Update an existing fixed date note
  static async updateFixedDateNote(
    fixedDateNoteId: number, 
    userId: string, 
    params: UpdateFixedDateNoteParams
  ): Promise<FixedDateNote | null> {
    const {
      deliveryDate,
      status,
      deletionDate
    } = params;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (deliveryDate !== undefined) {
      // Validate future date if updating delivery date
      if (deliveryDate <= new Date()) {
        throw new Error('Delivery date must be in the future');
      }
      updates.push(`delivery_date = $${paramIndex++}`);
      values.push(deliveryDate);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (deletionDate !== undefined) {
      updates.push(`deletion_date = $${paramIndex++}`);
      values.push(deletionDate);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    // Add WHERE conditions
    values.push(fixedDateNoteId, userId);
    const whereClause = `WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}`;

    const query = `
      UPDATE fixed_date_notes 
      SET ${updates.join(', ')}
      ${whereClause}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFixedDateNote(result.rows[0]);
  }

  // Delete a fixed date note
  static async deleteFixedDateNote(fixedDateNoteId: number, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM fixed_date_notes 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [fixedDateNoteId, userId]);
    return result.rows.length > 0;
  }

  // Get all fixed date notes for a user
  static async getFixedDateNotesByUserId(userId: string): Promise<FixedDateNote[]> {
    const query = `
      SELECT * FROM fixed_date_notes 
      WHERE user_id = $1 
      ORDER BY delivery_date ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(row => this.mapRowToFixedDateNote(row));
  }

  // Get fixed date notes with associated note details
  static async getFixedDateNotesWithNoteDetails(userId: string): Promise<FixedDateNoteWithNote[]> {
    const query = `
      SELECT 
        fdn.*,
        un.note,
        un.attachment,
        un.recipient_ids,
        un.created_at as note_created_at,
        un.updated_at as note_updated_at
      FROM fixed_date_notes fdn
      INNER JOIN user_notes un ON fdn.notes_id = un.id
      WHERE fdn.user_id = $1
      ORDER BY fdn.delivery_date ASC
    `;

    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      ...this.mapRowToFixedDateNote(row),
      note: {
        id: row.notes_id,
        note: row.note,
        attachment: row.attachment,
        recipientIds: row.recipient_ids || [],
        createdAt: new Date(row.note_created_at),
        updatedAt: new Date(row.note_updated_at)
      }
    }));
  }

  // Get fixed date notes by status
  static async getFixedDateNotesByStatus(
    userId: string, 
    status: 'scheduled' | 'delivered' | 'cancelled' | 'failed'
  ): Promise<FixedDateNote[]> {
    const query = `
      SELECT * FROM fixed_date_notes 
      WHERE user_id = $1 AND status = $2 
      ORDER BY delivery_date ASC
    `;

    const result = await pool.query(query, [userId, status]);
    return result.rows.map(row => this.mapRowToFixedDateNote(row));
  }

  // Get fixed date notes due for delivery (for scheduling system)
  static async getNotesForDelivery(beforeDate: Date = new Date()): Promise<FixedDateNote[]> {
    const query = `
      SELECT * FROM fixed_date_notes 
      WHERE status = 'scheduled' 
      AND delivery_date <= $1
      ORDER BY delivery_date ASC
    `;

    const result = await pool.query(query, [beforeDate]);
    return result.rows.map(row => this.mapRowToFixedDateNote(row));
  }

  // Get a single fixed date note by ID
  static async getFixedDateNoteById(fixedDateNoteId: number, userId: string): Promise<FixedDateNote | null> {
    const query = `
      SELECT * FROM fixed_date_notes 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [fixedDateNoteId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFixedDateNote(result.rows[0]);
  }

  // Mark notes as delivered (for scheduling system)
  static async markAsDelivered(fixedDateNoteIds: number[]): Promise<void> {
    if (fixedDateNoteIds.length === 0) return;

    const placeholders = fixedDateNoteIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      UPDATE fixed_date_notes 
      SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    await pool.query(query, fixedDateNoteIds);
  }

  // Helper method to map database row to FixedDateNote interface
  private static mapRowToFixedDateNote(row: any): FixedDateNote {
    return {
      id: row.id,
      userId: row.user_id,
      notesId: row.notes_id,
      deliveryDate: new Date(row.delivery_date),
      status: row.status,
      deletionDate: row.deletion_date ? new Date(row.deletion_date) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
