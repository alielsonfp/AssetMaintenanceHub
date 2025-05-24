// backend/src/models/assetModel.ts
import db from '../config/db';

export interface Asset {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
  location?: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateAssetData {
  name: string;
  description?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface UpdateAssetData {
  name?: string;
  description?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

const assetModel = {
  async findAllByUserId(userId: number): Promise<Asset[]> {
    const result = await db.query(
      'SELECT * FROM assets WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findById(id: number, userId: number): Promise<Asset | null> {
    const result = await db.query(
      'SELECT * FROM assets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async create(userId: number, assetData: CreateAssetData): Promise<Asset> {
    const { name, description, location, status = 'active' } = assetData;

    const result = await db.query(
      `INSERT INTO assets (user_id, name, description, location, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, name, description, location, status]
    );

    return result.rows[0];
  },

  async update(id: number, userId: number, assetData: UpdateAssetData): Promise<Asset | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Construir query dinamicamente baseado nos campos fornecidos
    if (assetData.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(assetData.name);
      paramCount++;
    }

    if (assetData.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(assetData.description);
      paramCount++;
    }

    if (assetData.location !== undefined) {
      fields.push(`location = $${paramCount}`);
      values.push(assetData.location);
      paramCount++;
    }

    if (assetData.status !== undefined) {
      fields.push(`status = $${paramCount}`);
      values.push(assetData.status);
      paramCount++;
    }

    if (fields.length === 0) {
      // Nenhum campo para atualizar
      return await this.findById(id, userId);
    }

    // Adicionar updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Adicionar condições WHERE
    values.push(id, userId);

    const query = `
      UPDATE assets 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM assets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    return result.rows.length > 0;
  },

  async getAssetStats(userId: number) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
       FROM assets WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }
};

export default assetModel;