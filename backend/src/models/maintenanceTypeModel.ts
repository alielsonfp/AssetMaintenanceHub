// backend/src/models/maintenanceTypeModel.ts
import db from '../config/db';

export interface MaintenanceType {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateMaintenanceTypeData {
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface UpdateMaintenanceTypeData {
  name?: string;
  description?: string;
  is_default?: boolean;
}

const maintenanceTypeModel = {
  async findAllByUserId(userId: number): Promise<MaintenanceType[]> {
    const result = await db.query(
      'SELECT * FROM maintenance_types WHERE user_id = $1 ORDER BY is_default DESC, name ASC',
      [userId]
    );
    return result.rows;
  },

  async findById(id: number, userId: number): Promise<MaintenanceType | null> {
    const result = await db.query(
      'SELECT * FROM maintenance_types WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async create(userId: number, data: CreateMaintenanceTypeData): Promise<MaintenanceType> {
    const { name, description, is_default = false } = data;

    const result = await db.query(
      `INSERT INTO maintenance_types (user_id, name, description, is_default) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, name, description, is_default]
    );

    return result.rows[0];
  },

  async update(id: number, userId: number, data: UpdateMaintenanceTypeData): Promise<MaintenanceType | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Construir query dinamicamente
    if (data.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(data.name);
      paramCount++;
    }

    if (data.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(data.description);
      paramCount++;
    }

    if (data.is_default !== undefined) {
      fields.push(`is_default = $${paramCount}`);
      values.push(data.is_default);
      paramCount++;
    }

    if (fields.length === 0) {
      return await this.findById(id, userId);
    }

    // Adicionar updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Adicionar condições WHERE
    values.push(id, userId);

    const query = `
      UPDATE maintenance_types 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM maintenance_types WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    return result.rows.length > 0;
  },

  async getStats(userId: number) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_default = true THEN 1 END) as defaults,
        COUNT(CASE WHEN is_default = false THEN 1 END) as custom
       FROM maintenance_types WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  },

  async createDefaultTypes(userId: number): Promise<MaintenanceType[]> {
    const defaultTypes = [
      { name: 'Troca de óleo', description: 'Troca de óleo do motor e filtro', is_default: true },
      { name: 'Revisão geral', description: 'Inspeção completa do equipamento', is_default: true },
      { name: 'Lubrificação', description: 'Lubrificação de peças móveis', is_default: true },
      { name: 'Limpeza', description: 'Limpeza geral e verificação visual', is_default: true },
      { name: 'Calibração', description: 'Calibração de instrumentos e sensores', is_default: true }
    ];

    const createdTypes = [];

    for (const typeData of defaultTypes) {
      const result = await db.query(
        `INSERT INTO maintenance_types (user_id, name, description, is_default) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [userId, typeData.name, typeData.description, typeData.is_default]
      );
      createdTypes.push(result.rows[0]);
    }

    return createdTypes;
  }
};

export default maintenanceTypeModel;