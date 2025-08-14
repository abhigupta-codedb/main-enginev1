import pool from '../config/database';
import { User } from '../types/auth';

export class UserModel {
  // Find user by Google ID
  static async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [googleId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        createdAt: user.created_at,
        lastLogin: user.last_login
      };
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        createdAt: user.created_at,
        lastLogin: user.last_login
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    provider: string;
  }): Promise<User> {
    try {
      const query = `
        INSERT INTO users (id, email, name, picture, provider, created_at, last_login)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [
        userData.id,
        userData.email,
        userData.name,
        userData.picture || null,
        userData.provider
      ];
      
      const result = await pool.query(query, values);
      const user = result.rows[0];
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        createdAt: user.created_at,
        lastLogin: user.last_login
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user's last login
  static async updateLastLogin(userId: string): Promise<User | null> {
    try {
      const query = `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        createdAt: user.created_at,
        lastLogin: user.last_login
      };
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // Get all users (for admin purposes)
  static async findAll(): Promise<User[]> {
    try {
      const query = `
        SELECT * FROM users 
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }));
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updateData: {
    name?: string;
    picture?: string;
  }): Promise<User | null> {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updateData.name) {
        setClause.push(`name = $${paramCount}`);
        values.push(updateData.name);
        paramCount++;
      }

      if (updateData.picture) {
        setClause.push(`picture = $${paramCount}`);
        values.push(updateData.picture);
        paramCount++;
      }

      if (setClause.length === 0) {
        return await this.findByGoogleId(userId);
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
        UPDATE users 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        createdAt: user.created_at,
        lastLogin: user.last_login
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Delete user
  static async delete(userId: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      const result = await pool.query(query, [userId]);
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
