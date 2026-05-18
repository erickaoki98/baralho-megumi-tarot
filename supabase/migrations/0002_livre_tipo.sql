-- Adiciona tipo 'livre' para tiragens com número de cartas flexível.
ALTER TABLE readings DROP CONSTRAINT readings_tipo_check;
ALTER TABLE readings ADD CONSTRAINT readings_tipo_check
  CHECK (tipo IN ('1_carta', '3_cartas', 'celta', 'livre'));
