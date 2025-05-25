// backend/src/models/maintenanceScheduleModel.ts
import db from '../config/db';

export interface MaintenanceSchedule {
  id?: number;
  asset_id: number;
  maintenance_type_id?: number;
  based_on_record_id?: number;
  scheduled_date: string;
  status: 'pending' | 'completed' | 'overdue';
  frequency_type: 'days' | 'weeks' | 'months' | 'kilometers' | 'hours';
  frequency_value: number;
  created_at?: Date;
  updated_at?: Date;
  // Campos extras para joins
  asset_name?: string;
  maintenance_type_name?: string;
  last_maintenance_date?: string;
}

export interface CreateMaintenanceScheduleData {
  asset_id: number;
  maintenance_type_id?: number;
  based_on_record_id?: number;
  frequency_type: 'days' | 'weeks' | 'months' | 'kilometers' | 'hours';
  frequency_value: number;
  scheduled_date?: string; // Se não fornecido, será calculado automaticamente
}

export interface UpdateMaintenanceScheduleData {
  scheduled_date?: string;
  status?: 'pending' | 'completed' | 'overdue';
  frequency_type?: 'days' | 'weeks' | 'months' | 'kilometers' | 'hours';
  frequency_value?: number;
}

const maintenanceScheduleModel = {
  // Buscar todos os agendamentos do usuário
  async findAllByUserId(userId: number): Promise<MaintenanceSchedule[]> {
    const result = await db.query(
      `SELECT 
        ms.*,
        a.name as asset_name,
        mt.name as maintenance_type_name,
        mr.date_performed as last_maintenance_date
       FROM maintenance_schedules ms
       JOIN assets a ON ms.asset_id = a.id
       LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
       LEFT JOIN maintenance_records mr ON ms.based_on_record_id = mr.id
       WHERE a.user_id = $1
       ORDER BY ms.scheduled_date ASC, ms.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Buscar agendamentos por ativo
  async findByAssetId(assetId: number, userId: number): Promise<MaintenanceSchedule[]> {
    const result = await db.query(
      `SELECT 
        ms.*,
        a.name as asset_name,
        mt.name as maintenance_type_name,
        mr.date_performed as last_maintenance_date
       FROM maintenance_schedules ms
       JOIN assets a ON ms.asset_id = a.id
       LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
       LEFT JOIN maintenance_records mr ON ms.based_on_record_id = mr.id
       WHERE ms.asset_id = $1 AND a.user_id = $2
       ORDER BY ms.scheduled_date ASC`,
      [assetId, userId]
    );
    return result.rows;
  },

  // Buscar agendamento específico
  async findById(id: number, userId: number): Promise<MaintenanceSchedule | null> {
    const result = await db.query(
      `SELECT 
        ms.*,
        a.name as asset_name,
        mt.name as maintenance_type_name,
        mr.date_performed as last_maintenance_date
       FROM maintenance_schedules ms
       JOIN assets a ON ms.asset_id = a.id
       LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
       LEFT JOIN maintenance_records mr ON ms.based_on_record_id = mr.id
       WHERE ms.id = $1 AND a.user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  },

  // Criar novo agendamento
  async create(userId: number, data: CreateMaintenanceScheduleData): Promise<MaintenanceSchedule> {
    const { asset_id, maintenance_type_id, based_on_record_id, frequency_type, frequency_value } = data;

    // Verificar se o ativo pertence ao usuário
    const assetCheck = await db.query(
      'SELECT id FROM assets WHERE id = $1 AND user_id = $2',
      [asset_id, userId]
    );

    if (assetCheck.rows.length === 0) {
      throw new Error('Ativo não encontrado ou não pertence ao usuário');
    }

    // Calcular data agendada se não fornecida
    let scheduled_date = data.scheduled_date;
    if (!scheduled_date) {
      scheduled_date = this.calculateNextMaintenanceDate(
        based_on_record_id ? null : new Date(), // Se baseado em registro, buscaremos a data depois
        frequency_type,
        frequency_value
      );
    }

    const result = await db.query(
      `INSERT INTO maintenance_schedules 
       (asset_id, maintenance_type_id, based_on_record_id, scheduled_date, frequency_type, frequency_value) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [asset_id, maintenance_type_id, based_on_record_id, scheduled_date, frequency_type, frequency_value]
    );

    return result.rows[0];
  },

  // Atualizar agendamento
  async update(id: number, userId: number, data: UpdateMaintenanceScheduleData): Promise<MaintenanceSchedule | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Verificar se o agendamento existe e pertence ao usuário
    const existingSchedule = await this.findById(id, userId);
    if (!existingSchedule) {
      throw new Error('Agendamento não encontrado');
    }

    // Construir query dinamicamente
    if (data.scheduled_date !== undefined) {
      fields.push(`scheduled_date = $${paramCount}`);
      values.push(data.scheduled_date);
      paramCount++;
    }

    if (data.status !== undefined) {
      fields.push(`status = $${paramCount}`);
      values.push(data.status);
      paramCount++;
    }

    if (data.frequency_type !== undefined) {
      fields.push(`frequency_type = $${paramCount}`);
      values.push(data.frequency_type);
      paramCount++;
    }

    if (data.frequency_value !== undefined) {
      fields.push(`frequency_value = $${paramCount}`);
      values.push(data.frequency_value);
      paramCount++;
    }

    if (fields.length === 0) {
      return existingSchedule;
    }

    // Adicionar updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Adicionar condição WHERE
    values.push(id);

    const query = `
      UPDATE maintenance_schedules 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  // Deletar agendamento
  async delete(id: number, userId: number): Promise<boolean> {
    // Verificar se o agendamento existe e pertence ao usuário
    const existingSchedule = await this.findById(id, userId);
    if (!existingSchedule) {
      return false;
    }

    const result = await db.query(
      'DELETE FROM maintenance_schedules WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  },

  // Buscar manutenções próximas (próximos 7 dias)
  async findUpcoming(userId: number, days: number = 7): Promise<MaintenanceSchedule[]> {
    const result = await db.query(
      `SELECT 
        ms.*,
        a.name as asset_name,
        mt.name as maintenance_type_name,
        mr.date_performed as last_maintenance_date
       FROM maintenance_schedules ms
       JOIN assets a ON ms.asset_id = a.id
       LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
       LEFT JOIN maintenance_records mr ON ms.based_on_record_id = mr.id
       WHERE a.user_id = $1 
       AND ms.status = 'pending'
       AND ms.scheduled_date <= CURRENT_DATE + INTERVAL '${days} days'
       AND ms.scheduled_date >= CURRENT_DATE
       ORDER BY ms.scheduled_date ASC`,
      [userId]
    );
    return result.rows;
  },

  // Buscar manutenções atrasadas
  async findOverdue(userId: number): Promise<MaintenanceSchedule[]> {
    const result = await db.query(
      `SELECT 
        ms.*,
        a.name as asset_name,
        mt.name as maintenance_type_name,
        mr.date_performed as last_maintenance_date
       FROM maintenance_schedules ms
       JOIN assets a ON ms.asset_id = a.id
       LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
       LEFT JOIN maintenance_records mr ON ms.based_on_record_id = mr.id
       WHERE a.user_id = $1 
       AND ms.status = 'pending'
       AND ms.scheduled_date < CURRENT_DATE
       ORDER BY ms.scheduled_date ASC`,
      [userId]
    );
    return result.rows;
  },

  // Marcar agendamento como completo e criar próximo
  async markAsCompleted(scheduleId: number, userId: number, recordId: number): Promise<MaintenanceSchedule | null> {
    // Buscar o agendamento atual
    const currentSchedule = await this.findById(scheduleId, userId);
    if (!currentSchedule) {
      throw new Error('Agendamento não encontrado');
    }

    // Marcar como completo
    await this.update(scheduleId, userId, { status: 'completed' });

    // Criar próximo agendamento baseado na frequência
    const nextScheduledDate = this.calculateNextMaintenanceDate(
      new Date(), // A partir de hoje
      currentSchedule.frequency_type,
      currentSchedule.frequency_value
    );

    const nextSchedule = await this.create(userId, {
      asset_id: currentSchedule.asset_id,
      maintenance_type_id: currentSchedule.maintenance_type_id,
      based_on_record_id: recordId,
      frequency_type: currentSchedule.frequency_type,
      frequency_value: currentSchedule.frequency_value,
      scheduled_date: nextScheduledDate
    });

    return nextSchedule;
  },

  // Atualizar status de agendamentos (para detecção automática de atrasos)
  async updateOverdueStatus(userId: number): Promise<number> {
    const result = await db.query(
      `UPDATE maintenance_schedules 
       SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
       FROM assets a
       WHERE maintenance_schedules.asset_id = a.id
       AND a.user_id = $1
       AND maintenance_schedules.status = 'pending'
       AND maintenance_schedules.scheduled_date < CURRENT_DATE
       RETURNING maintenance_schedules.id`,
      [userId]
    );

    return result.rows.length;
  },

  // Calcular próxima data de manutenção
  calculateNextMaintenanceDate(
    baseDate: Date | null,
    frequencyType: string,
    frequencyValue: number
  ): string {
    const date = baseDate || new Date();

    switch (frequencyType) {
      case 'days':
        date.setDate(date.getDate() + frequencyValue);
        break;
      case 'weeks':
        date.setDate(date.getDate() + (frequencyValue * 7));
        break;
      case 'months':
        date.setMonth(date.getMonth() + frequencyValue);
        break;
      // Para kilometers e hours, usaremos uma aproximação em dias
      case 'kilometers':
        // Assumindo uso médio de 50km/dia
        const daysForKm = Math.ceil(frequencyValue / 50);
        date.setDate(date.getDate() + daysForKm);
        break;
      case 'hours':
        // Assumindo uso médio de 8h/dia
        const daysForHours = Math.ceil(frequencyValue / 8);
        date.setDate(date.getDate() + daysForHours);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default: 1 mês
    }

    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  },

  // Estatísticas de agendamentos
  async getStats(userId: number) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_schedules,
        COUNT(CASE WHEN ms.status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN ms.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN ms.status = 'overdue' THEN 1 END) as overdue,
        COUNT(CASE WHEN ms.status = 'pending' AND ms.scheduled_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as upcoming_week,
        COUNT(CASE WHEN ms.status = 'pending' AND ms.scheduled_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as upcoming_month
       FROM maintenance_schedules ms
       JOIN assets a ON ms.asset_id = a.id
       WHERE a.user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }
};

export default maintenanceScheduleModel;