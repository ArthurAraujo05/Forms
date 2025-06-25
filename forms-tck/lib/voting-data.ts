import { promises as fs } from "fs"
import path from "path"

export interface Game {
  id: number
  name: string
  genre: string
  votes: number
}

export interface VotingData {
  games: Game[]
  userVotes: Record<string, number[]> // userId -> array of voted game IDs
}

const DATA_FILE = path.join(process.cwd(), "voting-data.json") // Arquivo na raiz do projeto

// Dados iniciais
const initialData: VotingData = {
  games: [],
  userVotes: {},
}

export async function readVotingData(): Promise<VotingData> {
  try {
    console.log("Tentando ler arquivo:", DATA_FILE)
    const data = await fs.readFile(DATA_FILE, "utf-8")
    const parsedData = JSON.parse(data)
    console.log("Dados carregados do arquivo:", parsedData.games.length, "jogos")
    return parsedData
  } catch (error) {
    console.log("Arquivo não encontrado, criando novo:", error)
    // Se não conseguir ler, criar arquivo inicial
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2))
      console.log("Arquivo criado com sucesso")
    } catch (writeError) {
      console.error("Erro ao criar arquivo:", writeError)
    }
    return initialData
  }
}

export async function writeVotingData(data: VotingData): Promise<void> {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
    console.log("Dados salvos com sucesso:", data.games.length, "jogos")
  } catch (error) {
    console.error("Erro ao salvar dados:", error)
    throw error
  }
}
