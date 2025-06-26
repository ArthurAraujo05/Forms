# 🎮 Sistema de Votação de Jogos para Streamers

Um sistema moderno e interativo para que a comunidade vote nos jogos que o streamer deve jogar nas próximas lives. Desenvolvido com Next.js, Supabase e design gaming.

![Sistema de Votação](https://img.shields.io/badge/Status-Ativo-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)

## ✨ Funcionalidades

### 🗳️ **Sistema de Votação**
- Votação em tempo real com atualizações automáticas
- Um voto por jogo por usuário
- Estatísticas visuais com barras de progresso
- Contagem total de votos e usuários únicos

### 🎯 **Sugestões da Comunidade**
- Qualquer usuário pode sugerir novos jogos
- Validação automática de conteúdo inadequado
- Prevenção de jogos duplicados
- Sistema de filtro por palavras bloqueadas

### 🔍 **Busca e Navegação**
- Busca por nome do jogo ou gênero
- Paginação inteligente e responsiva
- Controles de itens por página (5, 10, 20, 50)
- Interface limpa e intuitiva

### 👨‍💼 **Painel Administrativo**
- Login protegido por senha
- Remover jogos inadequados
- Resetar todos os votos
- Limpar lista completa de jogos
- Adicionar jogos diretamente

### 🎨 **Design Gaming**
- Background com imagens de gaming sobrepostas
- Efeito glassmorphism nos cards
- Textos em branco com drop-shadow
- Responsivo para todos os dispositivos
- Animações suaves e modernas

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Deploy**: Vercel
- **Icons**: Lucide React

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Conta no Vercel (opcional)

### 1. Clone o repositório
\`\`\`bash
git clone https://github.com/ArthurAraujo05/voting-form.git
cd voting-form
\`\`\`

### 2. Instale as dependências
\`\`\`bash
npm install
# ou
yarn install
\`\`\`

### 3. Configure as variáveis de ambiente
Copie o arquivo \`.env.example\` para \`.env.local\`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Configure as seguintes variáveis:

\`\`\`env
# Configuração do Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima

# Senha do administrador
NEXT_PUBLIC_ADMIN_PASSWORD=sua_senha_secreta

# Lista de palavras bloqueadas (opcional)
NEXT_PUBLIC_BLOCKED_WORDS=palavra1,palavra2,palavra3
\`\`\`

### 4. Configure o banco de dados
Execute o script SQL no Supabase:

\`\`\`sql
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
\`\`\`

### 5. Execute o projeto
\`\`\`bash
npm run dev
# ou
yarn dev
\`\`\`

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🔧 Configuração do Supabase

### 1. Crie um novo projeto
- Acesse [supabase.com](https://supabase.com)
- Crie uma nova organização e projeto
- Anote a URL e a chave anônima

### 2. Configure as políticas RLS
No SQL Editor do Supabase, execute:

\`\`\`sql
-- Habilitar Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público
CREATE POLICY "Allow public access" ON games FOR ALL USING (true);
CREATE POLICY "Allow public access" ON votes FOR ALL USING (true);
\`\`\`

### 3. Configure Realtime
- Vá em Database > Replication
- Ative a replicação para as tabelas \`games\` e \`votes\`

## 🎯 Como Usar

### Para Usuários
1. **Votar**: Clique em "Votar" no jogo desejado
2. **Sugerir**: Use o botão "+ Adicionar Jogo" para sugerir novos jogos
3. **Buscar**: Use a barra de busca para encontrar jogos específicos
4. **Acompanhar**: Veja os resultados em tempo real

### Para Administradores
1. **Login**: Clique em "Admin" e digite a senha
2. **Gerenciar**: Remova jogos inadequados ou resete votos
3. **Adicionar**: Adicione jogos diretamente sem moderação
4. **Monitorar**: Acompanhe as estatísticas em tempo real

## 🛡️ Segurança

### Filtro de Conteúdo
- Lista configurável de palavras bloqueadas
- Validação automática de sugestões
- Prevenção de conteúdo inadequado

### Controle de Acesso
- Painel admin protegido por senha
- Validação de entrada em todos os formulários
- Sanitização de dados do usuário

### Rate Limiting
- Um voto por jogo por usuário
- Prevenção de spam de sugestões
- Validação de duplicatas

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- 📱 **Mobile**: iPhone, Android
- 📱 **Tablet**: iPad, tablets Android  
- 💻 **Desktop**: Todos os tamanhos de tela
- 🖥️ **Ultra-wide**: Monitores grandes

## 🎨 Personalização

### Cores e Tema
Edite o arquivo \`tailwind.config.ts\` para personalizar:
- Cores primárias e secundárias
- Gradientes de fundo
- Sombras e bordas

### Imagens de Background
Substitua as URLs no componente principal:
\`\`\`typescript
// Primeira imagem
backgroundImage: \`url('sua-imagem-1.jpg')\`

// Segunda imagem  
backgroundImage: \`url('sua-imagem-2.jpg')\`
\`\`\`

### Palavras Bloqueadas
Configure via variável de ambiente:
\`\`\`env
NEXT_PUBLIC_BLOCKED_WORDS=palavra1,palavra2,palavra3
\`\`\`

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas
- **Netlify**: Suporte completo ao Next.js
- **Railway**: Deploy direto do GitHub
- **DigitalOcean**: App Platform

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit suas mudanças (\`git commit -m 'Add some AmazingFeature'\`)
4. Push para a branch (\`git push origin feature/AmazingFeature\`)
5. Abra um Pull Request

## 📋 Roadmap

- [ ] **Sistema de notificações** push
- [ ] **Integração com Twitch** API
- [ ] **Modo escuro** automático
- [ ] **Histórico de votações** passadas
- [ ] **Sistema de categorias** de jogos
- [ ] **Votação por tempo limitado**
- [ ] **Integração com Discord** bot
- [ ] **Analytics** avançados
- [ ] **Sistema de moderação** automático
- [ ] **API pública** para desenvolvedores

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Arthur Araújo**
- GitHub: [@ArthurAraujo05](https://github.com/ArthurAraujo05)
- LinkedIn: [Arthur Araújo](https://www.linkedin.com/in/arthur-araujo-7bb8041a9/)

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) pela framework incrível
- [Supabase](https://supabase.com/) pelo backend poderoso
- [Tailwind CSS](https://tailwindcss.com/) pelo styling eficiente
- [shadcn/ui](https://ui.shadcn.com/) pelos componentes elegantes

---

⭐ **Se este projeto te ajudou, deixe uma estrela no repositório!**

\`\`\`
Desenvolvido com ❤️ para a comunidade de streamers
\`\`\`
