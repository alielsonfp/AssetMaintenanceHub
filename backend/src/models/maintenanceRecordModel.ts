// backend/src/models/maintenanceRecordModel.ts
import db from '../config/db';

export interface MaintenanceRecord {
  id?: number;
  asset_id: number;
  maintenance_type_id?: number;
  date_performed: string;
  notes?: string;
  cost?: number;
  created_at?: Date;
  updated_at?: Date;
  // Campos extras para joins
  asset_name?: string;
  maintenance_type_name?: string;
}

export interface CreateMaintenanceRecordData {
  asset_id: number;
  maintenance_type_id?: number;
  date_performed: string;
  notes?: string;
  cost?: number;
}

export interface UpdateMaintenanceRecordData {
  maintenance_type_id?: number | null;
  date_performed?: string;
  notes?: string | null;
  cost?: number | null;
}

const maintenanceRecordModel = {
  async findAllByUserId(userId: number): Promise<MaintenanceRecord[]> {
    const result = await db.query(
      `SELECT 
        mr.*,
        a.name as asset_name,
        mt.name as maintenance_type_name
       FROM maintenance_records mr
       JOIN assets a ON mr.asset_id = a.id
       LEFT JOIN maintenance_types mt ON mr.maintenance_type_id = mt.id
       WHERE a.user_id = $1
       ORDER BY mr.date_performed DESC, mr.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findByAssetId(assetId: number, userId: number): Promise<MaintenanceRecord[]> {
    const result = await db.query(
      `SELECT 
        mr.*,
        a.name as asset_name,
        mt.name as maintenance_type_name
       FROM maintenance_records mr
       JOIN assets a ON mr.asset_id = a.id
       LEFT JOIN maintenance_types mt ON mr.maintenance_type_id = mt.id
       WHERE mr.asset_id = $1 AND a.user_id = $2
       ORDER BY mr.date_performed DESC, mr.created_at DESC`,
      [assetId, userId]
    );
    return result.rows;
  },

  async findById(id: number, userId: number): Promise<MaintenanceRecord | null> {
    const result = await db.query(
      `SELECT 
        mr.*,
        a.name as asset_name,
        mt.name as maintenance_type_name
       FROM maintenance_records mr
       JOIN assets a ON mr.asset_id = a.id
       LEFT JOIN maintenance_types mt ON mr.maintenance_type_id = mt.id
       WHERE mr.id = $1 AND a.user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async create(userId: number, data: CreateMaintenanceRecordData): Promise<MaintenanceRecord> {
    const { asset_id, maintenance_type_id, date_performed, notes, cost } = data;

    // Verificar se o ativo pertence ao usuário
    const assetCheck = await db.query(
      'SELECT id FROM assets WHERE id = $1 AND user_id = $2',
      [asset_id, userId]
    );

    if (assetCheck.rows.length === 0) {
      throw new Error('Ativo não encontrado ou não pertence ao usuário');
    }

    // Verificar se o tipo de manutenção pertence ao usuário (se fornecido)
    if (maintenance_type_id) {
      const typeCheck = await db.query(
        'SELECT id FROM maintenance_types WHERE id = $1 AND user_id = $2',
        [maintenance_type_id, userId]
      );

      if (typeCheck.rows.length === 0) {
        throw new Error('Tipo de manutenção não encontrado ou não pertence ao usuário');
      }
    }

    const result = await db.query(
      `INSERT INTO maintenance_records (asset_id, maintenance_type_id, date_performed, notes, cost) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [asset_id, maintenance_type_id, date_performed, notes, cost]
    );

    return result.rows[0];
  },

  async update(id: number, userId: number, data: UpdateMaintenanceRecordData): Promise<MaintenanceRecord | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Verificar se o registro existe e pertence ao usuário
    const existingRecord = await this.findById(id, userId);
    if (!existingRecord) {
      throw new Error('Registro de manutenção não encontrado');
    }

    // Validar tipo de manutenção se fornecido
    if (data.maintenance_type_id !== undefined && data.maintenance_type_id !== null) {
      const typeCheck = await db.query(
        'SELECT id FROM maintenance_types WHERE id = $1 AND user_id = $2',
        [data.maintenance_type_id, userId]
      );

      if (typeCheck.rows.length === 0) {
        throw new Error('Tipo de manutenção não encontrado ou não pertence ao usuário');
      }
    }

    // Construir query dinamicamente
    if (data.maintenance_type_id !== undefined) {
      fields.push(`maintenance_type_id = $${paramCount}`);
      values.push(data.maintenance_type_id);
      paramCount++;
    }

    if (data.date_performed !== undefined) {
      fields.push(`date_performed = $${paramCount}`);
      values.push(data.date_performed);
      paramCount++;
    }

    if (data.notes !== undefined) {
      fields.push(`notes = $${paramCount}`);
      values.push(data.notes);
      paramCount++;
    }

    if (data.cost !== undefined) {
      fields.push(`cost = $${paramCount}`);
      values.push(data.cost);
      paramCount++;
    }

    if (fields.length === 0) {
      return existingRecord;
    }

    // Adicionar updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Adicionar condição WHERE
    values.push(id);

    const query = `
      UPDATE maintenance_records 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  async delete(id: number, userId: number): Promise<boolean> {
    // Verificar se o registro existe e pertence ao usuário
    const existingRecord = await this.findById(id, userId);
    if (!existingRecord) {
      return false;
    }

    const result = await db.query(
      'DELETE FROM maintenance_records WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  },

  async getStats(userId: number) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT mr.asset_id) as assets_with_maintenance,
        SUM(CASE WHEN mr.cost IS NOT NULL THEN mr.cost ELSE 0 END) as total_cost,
        AVG(CASE WHEN mr.cost IS NOT NULL THEN mr.cost ELSE NULL END) as average_cost,
        COUNT(CASE WHEN mr.date_performed >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
        COUNT(CASE WHEN mr.date_performed >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as last_90_days
       FROM maintenance_records mr
       JOIN assets a ON mr.asset_id = a.id
       WHERE a.user_id = $1`,
      [userId]
    );

    return result.rows[0];
  },

  async getRecentMaintenances(userId: number, limit: number = 10): Promise<MaintenanceRecord[]> {
    const result = await db.query(
      `SELECT 
        mr.*,
        a.name as asset_name,
        mt.name as maintenance_type_name
       FROM maintenance_records mr
       JOIN assets a ON mr.asset_id = a.id
       LEFT JOIN maintenance_types mt ON mr.maintenance_type_id = mt.id
       WHERE a.user_id = $1
       ORDER BY mr.date_performed DESC, mr.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async getMaintenancesByDateRange(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<MaintenanceRecord[]> {
    const result = await db.query(
      `SELECT 
        mr.*,
        a.name as asset_name,
        mt.name as maintenance_type_name
       FROM maintenance_records mr
       JOIN assets a ON mr.asset_id = a.id
       LEFT JOIN maintenance_types mt ON mr.maintenance_type_id = mt.id
       WHERE a.user_id = $1 
       AND mr.date_performed >= $2 
       AND mr.date_performed <= $3
       ORDER BY mr.date_performed DESC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  },

  async getMaintenancesByType(userId: number, typeId: number): Promise<MaintenanceRecord[]> {
    const result = await db.query(
      `SELECT 
        mr.*,
        a.name as asset_name,
        mt.name as maintenance_type_name
       FROM maintenance_records mr
       JOIN assets a ON mr.asset_id = a.id
       LEFT JOIN maintenance_types mt ON mr.maintenance_type_id = mt.id
       WHERE a.user_id = $1 AND mr.maintenance_type_id = $2
       ORDER BY mr.date_performed DESC`,
      [userId, typeId]
    );
    return result.rows;
  }
};

export default maintenanceRecordModel;