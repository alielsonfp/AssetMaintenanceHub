-- Script para inserir dados de demonstração para novos usuários

-- Função para criar dados demo para um usuário
CREATE OR REPLACE FUNCTION create_demo_data(p_user_id INTEGER)
RETURNS void AS $$
BEGIN
    -- 1. CRIAR TIPOS DE MANUTENÇÃO PADRÃO
    INSERT INTO maintenance_types (user_id, name, description, is_default) VALUES
    (p_user_id, 'Troca de óleo', 'Troca de óleo do motor e filtros', true),
    (p_user_id, 'Revisão preventiva', 'Revisão completa do equipamento', true),
    (p_user_id, 'Lubrificação', 'Lubrificação de peças móveis', true),
    (p_user_id, 'Limpeza', 'Limpeza geral e verificação visual', true),
    (p_user_id, 'Inspeção técnica', 'Inspeção técnica obrigatória', true),
    (p_user_id, 'Calibração', 'Calibração de instrumentos e sensores', true),
    (p_user_id, 'Alinhamento', 'Alinhamento e balanceamento', true),
    (p_user_id, 'Backup de sistema', 'Backup e manutenção de TI', true);

    -- 2. CRIAR ATIVOS DE DEMONSTRAÇÃO
    INSERT INTO assets (user_id, name, description, location, status) VALUES
    (p_user_id, 'Caminhão Mercedes Accelo', 'Caminhão de entrega, placa BRA-2E19, ano 2019', 'Garagem Principal - Filial Centro', 'active'),
    (p_user_id, 'Van Iveco Daily', 'Van para transporte de funcionários, placa ABC-1234', 'Estacionamento da Fábrica', 'maintenance'),
    (p_user_id, 'Empilhadeira Toyota', 'Empilhadeira elétrica 2.5 toneladas, patrimônio EMP-001', 'Galpão A - Setor de Armazenagem', 'active'),
    (p_user_id, 'Compressor Schulz 20HP', 'Compressor de ar industrial, modelo MSW60/425', 'Sala de Compressores - Térreo', 'active'),
    (p_user_id, 'Ponte Rolante 5 Toneladas', 'Ponte rolante para movimentação de cargas pesadas', 'Galpão B - Linha de Produção 2', 'active'),
    (p_user_id, 'Gerador Diesel 100KVA', 'Gerador de emergência Cummins, modelo C100D6', 'Casa de Máquinas - Externa', 'inactive'),
    (p_user_id, 'Ar-Condicionado Split Reunião', 'Ar Split Samsung 18.000 BTUs, instalado em 2022', 'Sala de Reuniões - 2º Andar', 'active'),
    (p_user_id, 'Servidor Principal Dell', 'Dell PowerEdge R740, 64GB RAM, 2TB Storage', 'Sala de TI - Data Center', 'active');

    -- 3. INSERIR REGISTROS DE MANUTENÇÃO (HISTÓRICO)
    -- Pegar IDs dos ativos e tipos criados
    DECLARE
        asset_caminhao INTEGER;
        asset_van INTEGER;
        asset_empilhadeira INTEGER;
        asset_compressor INTEGER;
        asset_ponte INTEGER;
        asset_gerador INTEGER;
        asset_ar INTEGER;
        asset_servidor INTEGER;
        
        tipo_oleo INTEGER;
        tipo_revisao INTEGER;
        tipo_lubrificacao INTEGER;
        tipo_limpeza INTEGER;
        tipo_inspecao INTEGER;
        tipo_calibracao INTEGER;
        tipo_alinhamento INTEGER;
        tipo_backup INTEGER;
    BEGIN
        -- Buscar IDs dos ativos
        SELECT id INTO asset_caminhao FROM assets WHERE user_id = p_user_id AND name = 'Caminhão Mercedes Accelo';
        SELECT id INTO asset_van FROM assets WHERE user_id = p_user_id AND name = 'Van Iveco Daily';
        SELECT id INTO asset_empilhadeira FROM assets WHERE user_id = p_user_id AND name = 'Empilhadeira Toyota';
        SELECT id INTO asset_compressor FROM assets WHERE user_id = p_user_id AND name = 'Compressor Schulz 20HP';
        SELECT id INTO asset_ponte FROM assets WHERE user_id = p_user_id AND name = 'Ponte Rolante 5 Toneladas';
        SELECT id INTO asset_gerador FROM assets WHERE user_id = p_user_id AND name = 'Gerador Diesel 100KVA';
        SELECT id INTO asset_ar FROM assets WHERE user_id = p_user_id AND name = 'Ar-Condicionado Split Reunião';
        SELECT id INTO asset_servidor FROM assets WHERE user_id = p_user_id AND name = 'Servidor Principal Dell';

        -- Buscar IDs dos tipos
        SELECT id INTO tipo_oleo FROM maintenance_types WHERE user_id = p_user_id AND name = 'Troca de óleo';
        SELECT id INTO tipo_revisao FROM maintenance_types WHERE user_id = p_user_id AND name = 'Revisão preventiva';
        SELECT id INTO tipo_lubrificacao FROM maintenance_types WHERE user_id = p_user_id AND name = 'Lubrificação';
        SELECT id INTO tipo_limpeza FROM maintenance_types WHERE user_id = p_user_id AND name = 'Limpeza';
        SELECT id INTO tipo_inspecao FROM maintenance_types WHERE user_id = p_user_id AND name = 'Inspeção técnica';
        SELECT id INTO tipo_calibracao FROM maintenance_types WHERE user_id = p_user_id AND name = 'Calibração';
        SELECT id INTO tipo_alinhamento FROM maintenance_types WHERE user_id = p_user_id AND name = 'Alinhamento';
        SELECT id INTO tipo_backup FROM maintenance_types WHERE user_id = p_user_id AND name = 'Backup de sistema';

        -- REGISTROS DE MANUTENÇÃO
        INSERT INTO maintenance_records (asset_id, maintenance_type_id, date_performed, notes, cost) VALUES
        -- Maio 2025
        (asset_caminhao, tipo_oleo, '2025-05-15', 'Óleo 15W40, filtro de óleo e ar trocados', 280.00),
        (asset_empilhadeira, tipo_lubrificacao, '2025-05-10', 'Lubrificação de todos os pontos, verificação de níveis', 120.00),
        (asset_compressor, tipo_limpeza, '2025-05-08', 'Limpeza realizada pela equipe interna', 0.00),
        
        -- Abril 2025
        (asset_van, tipo_revisao, '2025-04-22', 'Pastilhas dianteiras e traseiras, discos verificados', 450.00),
        (asset_ponte, tipo_inspecao, '2025-04-18', 'Empresa terceirizada XYZ Guindastes, certificado emitido', 850.00),
        (asset_servidor, tipo_backup, '2025-04-12', 'Realizado pela equipe de TI, backup testado com sucesso', 0.00),
        (asset_ar, tipo_limpeza, '2025-04-05', 'Gás R410A, limpeza do evaporador e condensador', 180.00),
        
        -- Março 2025
        (asset_caminhao, tipo_alinhamento, '2025-03-28', 'Alinhamento 3D, balanceamento das 4 rodas', 150.00),
        (asset_empilhadeira, tipo_revisao, '2025-03-20', 'Revisão de 1000h, troca de filtros, verificação elétrica', 680.00),
        (asset_van, tipo_oleo, '2025-03-15', 'Óleo 10W40, filtros de óleo, ar e combustível', 240.00),
        
        -- Fevereiro 2025
        (asset_compressor, tipo_oleo, '2025-02-25', 'Óleo compressor específico, 20 litros', 320.00),
        (asset_gerador, tipo_inspecao, '2025-02-10', 'Teste mensal obrigatório, funcionamento normal', 200.00);

        -- 4. CRIAR AGENDAMENTOS FUTUROS
        INSERT INTO maintenance_schedules (asset_id, maintenance_type_id, scheduled_date, frequency_type, frequency_value, status) VALUES
        -- PRÓXIMOS (urgentes)
        (asset_caminhao, tipo_revisao, '2025-05-31', 'months', 6, 'pending'),
        (asset_compressor, tipo_oleo, '2025-06-02', 'months', 3, 'pending'),
        
        -- ATRASADOS (para mostrar alertas)
        (asset_van, tipo_inspecao, '2025-05-25', 'months', 12, 'pending'),
        (asset_empilhadeira, tipo_calibracao, '2025-05-20', 'months', 6, 'pending'),
        
        -- FUTUROS
        (asset_ponte, tipo_inspecao, '2025-06-15', 'months', 12, 'pending'),
        (asset_servidor, tipo_backup, '2025-06-10', 'months', 1, 'pending'),
        (asset_ar, tipo_limpeza, '2025-07-01', 'months', 3, 'pending');
    END;
END;
$$ LANGUAGE plpgsql;