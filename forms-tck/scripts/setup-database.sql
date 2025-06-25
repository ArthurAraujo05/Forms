-- Criar tabela de jogos
CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT DEFAULT 'Sugestão',
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de votos
CREATE TABLE IF NOT EXISTS votes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Função para incrementar votos
CREATE OR REPLACE FUNCTION increment_votes(game_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE games 
  SET votes = votes + 1 
  WHERE id = game_id;
END;
$$ LANGUAGE plpgsql;

-- Habilitar Row Level Security (opcional)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso público (ajuste conforme necessário)
CREATE POLICY "Allow public read access on games" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on games" ON games FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on games" ON games FOR DELETE USING (true);

CREATE POLICY "Allow public read access on votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on votes" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access on votes" ON votes FOR DELETE USING (true);
