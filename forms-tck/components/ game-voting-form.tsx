"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Settings, RotateCcw, EyeOff } from "lucide-react"

interface Game {
  id: number
  name: string
  genre: string
  votes: number
}

export default function GameVotingForm() {
  const [games, setGames] = useState<Game[]>([])
  const [votedGames, setVotedGames] = useState<number[]>([])
  const [newGameName, setNewGameName] = useState("")
  const [showSuggestionForm, setShowSuggestionForm] = useState(false)

  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  const ADMIN_PASSWORD = "tckforever1234fofo"

  useEffect(() => {
    const savedGames = localStorage.getItem("voting-games")
    const savedVotedGames = localStorage.getItem("voting-voted-games")

    if (savedGames) {
      try {
        setGames(JSON.parse(savedGames))
      } catch (error) {
        console.error("Erro ao carregar jogos salvos:", error)
      }
    } else {
      setGames([
        { id: 1, name: "The Legend of Zelda: Tears of the Kingdom", genre: "Aventura", votes: 45 },
        { id: 2, name: "Baldur's Gate 3", genre: "RPG", votes: 38 },
        { id: 3, name: "Spider-Man 2", genre: "Ação", votes: 32 },
        { id: 4, name: "Hogwarts Legacy", genre: "RPG", votes: 28 },
        { id: 5, name: "Cyberpunk 2077", genre: "RPG", votes: 25 },
        { id: 6, name: "Elden Ring", genre: "Souls-like", votes: 22 },
      ])
    }

    if (savedVotedGames) {
      try {
        setVotedGames(JSON.parse(savedVotedGames))
      } catch (error) {
        console.error("Erro ao carregar votos salvos:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("voting-games", JSON.stringify(games))
  }, [games])

  useEffect(() => {
    localStorage.setItem("voting-voted-games", JSON.stringify(votedGames))
  }, [votedGames])

  const handleVote = (gameId: number) => {
    if (votedGames.includes(gameId)) return

    setGames(games.map((game) => (game.id === gameId ? { ...game, votes: game.votes + 1 } : game)))
    setVotedGames([...votedGames, gameId])
  }

  const handleSuggestGame = () => {
    if (!newGameName.trim()) return

    const newGame: Game = {
      id: Math.max(...games.map((g) => g.id), 0) + 1,
      name: newGameName,
      genre: "Sugestão",
      votes: 0,
    }

    setGames([...games, newGame])
    setNewGameName("")
    setShowSuggestionForm(false)
  }

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminMode(true)
      setShowAdminLogin(false)
      setAdminPassword("")
    } else {
      alert("Senha incorreta!")
    }
  }

  const handleAdminLogout = () => {
    setIsAdminMode(false)
  }

  const handleRemoveGame = (gameId: number) => {
    if (confirm("Tem certeza que deseja remover este jogo?")) {
      setGames(games.filter((game) => game.id !== gameId))
      setVotedGames(votedGames.filter((id) => id !== gameId))
    }
  }

  const handleResetAllVotes = () => {
    if (confirm("Tem certeza que deseja resetar todos os votos?")) {
      setGames(games.map((game) => ({ ...game, votes: 0 })))
      setVotedGames([])
    }
  }

  const handleClearAllGames = () => {
    if (confirm("Tem certeza que deseja remover TODOS os jogos?")) {
      setGames([])
      setVotedGames([])
    }
  }

  const sortedGames = [...games].sort((a, b) => b.votes - a.votes)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* ...restante da UI igual ao anterior... */}
      </div>
    </div>
  )
}
