// backend/src/models/userModel.ts
import db from '../config/db';
import bcrypt from 'bcrypt';

interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  password_hash?: string;
  created_at?: Date;
  updated_at?: Date;
}

const userModel = {
  async findByEmail(email: string) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findById(id: number) {
    const result = await db.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async create(user: User) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(user.password!, salt);

    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at, updated_at',
      [user.name, user.email, password_hash]
    );

    return result.rows[0];
  },

  async validatePassword(plainPassword: string, hashedPassword: string) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  async updatePasswordHash(userId: number, newPassword: string) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [password_hash, userId]
    );

    return result.rows[0];
  }
};

export default userModel;