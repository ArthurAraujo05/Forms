"use server"

import { readVotingData, writeVotingData, type Game } from "@/lib/voting-data"

export async function getVotingData() {
  return await readVotingData()
}

export async function voteForGame(gameId: number, userId: string) {
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
  return { success: true, message: "Voto registrado com sucesso" }
}

export async function addGame(name: string, genre = "Sugestão") {
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

  return { success: true, game: newGame }
}

export async function removeGame(gameId: number) {
  const data = await readVotingData()

  data.games = data.games.filter((g) => g.id !== gameId)

  // Remover votos deste jogo de todos os usuários
  Object.keys(data.userVotes).forEach((userId) => {
    data.userVotes[userId] = data.userVotes[userId].filter((id) => id !== gameId)
  })

  await writeVotingData(data)
  return { success: true }
}

export async function resetAllVotes() {
  const data = await readVotingData()

  data.games = data.games.map((game) => ({ ...game, votes: 0 }))
  data.userVotes = {}

  await writeVotingData(data)
  return { success: true }
}

export async function clearAllGames() {
  const data = await readVotingData()

  data.games = []
  data.userVotes = {}

  await writeVotingData(data)
  return { success: true }
}
