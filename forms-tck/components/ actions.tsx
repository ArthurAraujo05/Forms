"use server"

import { readVotingData, writeVotingData, type Game } from "@/lib/voting-data"

export async function getVotingData() {
  try {
    const data = await readVotingData()
    console.log("getVotingData - jogos encontrados:", data.games.length)
    return data
  } catch (error) {
    console.error("Erro em getVotingData:", error)
    return { games: [], userVotes: {} }
  }
}

export async function voteForGame(gameId: number, userId: string) {
  try {
    const data = await readVotingData()

    // Verificar se o usuário já votou neste jogo
    const userVotes = data.userVotes[userId] || []
    if (userVotes.includes(gameId)) {
      return { success: false, message: "Você já votou neste jogo" }
    }

    // Adicionar voto ao jogo
    const gameIndex = data.games.findIndex((g) => g.id === gameId)
    if (gameIndex === -1) {
      return { success: false, message: "Jogo não encontrado" }
    }

    data.games[gameIndex].votes += 1

    // Adicionar voto do usuário
    if (!data.userVotes[userId]) {
      data.userVotes[userId] = []
    }
    data.userVotes[userId].push(gameId)

    await writeVotingData(data)
    console.log("Voto registrado para jogo:", gameId, "por usuário:", userId)
    return { success: true, message: "Voto registrado com sucesso" }
  } catch (error) {
    console.error("Erro ao votar:", error)
    return { success: false, message: "Erro interno do servidor" }
  }
}

export async function addGame(name: string, genre = "Sugestão") {
  try {
    const data = await readVotingData()

    const newId = Math.max(...data.games.map((g) => g.id), 0) + 1
    const newGame: Game = {
      id: newId,
      name: name.trim(),
      genre,
      votes: 0,
    }

    data.games.push(newGame)
    await writeVotingData(data)

    console.log("Jogo adicionado:", newGame.name, "ID:", newId)
    return { success: true, game: newGame }
  } catch (error) {
    console.error("Erro ao adicionar jogo:", error)
    return { success: false, message: "Erro interno do servidor" }
  }
}

export async function removeGame(gameId: number) {
  try {
    const data = await readVotingData()

    data.games = data.games.filter((g) => g.id !== gameId)

    // Remover votos deste jogo de todos os usuários
    Object.keys(data.userVotes).forEach((userId) => {
      data.userVotes[userId] = data.userVotes[userId].filter((id) => id !== gameId)
    })

    await writeVotingData(data)
    console.log("Jogo removido:", gameId)
    return { success: true }
  } catch (error) {
    console.error("Erro ao remover jogo:", error)
    return { success: false, message: "Erro interno do servidor" }
  }
}

export async function resetAllVotes() {
  try {
    const data = await readVotingData()

    data.games = data.games.map((game) => ({ ...game, votes: 0 }))
    data.userVotes = {}

    await writeVotingData(data)
    console.log("Todos os votos resetados")
    return { success: true }
  } catch (error) {
    console.error("Erro ao resetar votos:", error)
    return { success: false, message: "Erro interno do servidor" }
  }
}

export async function clearAllGames() {
  try {
    const data = await readVotingData()

    data.games = []
    data.userVotes = {}

    await writeVotingData(data)
    console.log("Todos os jogos removidos")
    return { success: true }
  } catch (error) {
    console.error("Erro ao limpar jogos:", error)
    return { success: false, message: "Erro interno do servidor" }
  }
}
