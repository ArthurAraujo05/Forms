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
    const [games, setGames] = useState<Game[]>([
        { id: 1, name: "The Legend of Zelda: Tears of the Kingdom", genre: "Aventura", votes: 45 },
        { id: 2, name: "Baldur's Gate 3", genre: "RPG", votes: 38 },
        { id: 3, name: "Spider-Man 2", genre: "Ação", votes: 32 },
        { id: 4, name: "Hogwarts Legacy", genre: "RPG", votes: 28 },
        { id: 5, name: "Cyberpunk 2077", genre: "RPG", votes: 25 },
        { id: 6, name: "Elden Ring", genre: "Souls-like", votes: 22 },
    ])

    const [votedGames, setVotedGames] = useState<number[]>([]) // Array dos IDs dos jogos que já votou
    const [newGameName, setNewGameName] = useState("")
    const [showSuggestionForm, setShowSuggestionForm] = useState(false)

    // Admin states
    const [isAdminMode, setIsAdminMode] = useState(false)
    const [adminPassword, setAdminPassword] = useState("")
    const [showAdminLogin, setShowAdminLogin] = useState(false)

    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

    // Carregar dados do localStorage quando o componente montar
    useEffect(() => {
        const savedGames = localStorage.getItem("voting-games")
        const savedVotedGames = localStorage.getItem("voting-voted-games")

        if (savedGames) {
            try {
                setGames(JSON.parse(savedGames))
            } catch (error) {
                console.error("Erro ao carregar jogos salvos:", error)
            }
        }

        if (savedVotedGames) {
            try {
                setVotedGames(JSON.parse(savedVotedGames))
            } catch (error) {
                console.error("Erro ao carregar votos salvos:", error)
            }
        }
    }, [])

    // Salvar jogos no localStorage sempre que a lista mudar
    useEffect(() => {
        localStorage.setItem("voting-games", JSON.stringify(games))
    }, [games])

    // Salvar votos no localStorage sempre que mudar
    useEffect(() => {
        localStorage.setItem("voting-voted-games", JSON.stringify(votedGames))
    }, [votedGames])

    const handleVote = (gameId: number) => {
        // Verifica se já votou neste jogo
        if (votedGames.includes(gameId)) return

        // Adiciona o voto ao jogo
        setGames(games.map((game) => (game.id === gameId ? { ...game, votes: game.votes + 1 } : game)))

        // Adiciona o jogo à lista de jogos votados
        setVotedGames([...votedGames, gameId])
    }

    const handleSuggestGame = () => {
        if (!newGameName.trim()) return

        const newGame: Game = {
            id: Math.max(...games.map((g) => g.id), 0) + 1, // ID único baseado no maior ID existente
            name: newGameName,
            genre: "Sugestão",
            votes: 0,
        }

        setGames([...games, newGame])
        setNewGameName("")
        setShowSuggestionForm(false)
    }

    // Admin functions
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
            // Remove o jogo da lista de votados se estava lá
            setVotedGames(votedGames.filter((id) => id !== gameId))
        }
    }

    const handleResetAllVotes = () => {
        if (confirm("Tem certeza que deseja resetar todos os votos?")) {
            setGames(games.map((game) => ({ ...game, votes: 0 })))
            setVotedGames([]) // Limpa a lista de jogos votados
        }
    }

    const handleClearAllGames = () => {
        if (confirm("Tem certeza que deseja remover TODOS os jogos?")) {
            setGames([])
            setVotedGames([]) // Limpa a lista de jogos votados
        }
    }

    const sortedGames = [...games].sort((a, b) => b.votes - a.votes)

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Admin Panel */}
                <div className="mb-6">
                    {!isAdminMode ? (
                        <div className="flex justify-end">
                            {!showAdminLogin ? (
                                <Button onClick={() => setShowAdminLogin(true)} variant="ghost" size="sm" className="text-gray-500">
                                    <Settings className="h-4 w-4 mr-1" />
                                    Admin
                                </Button>
                            ) : (
                                <Card className="w-80">
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <Label htmlFor="adminPassword" className="text-sm font-medium">
                                                Senha do Administrador
                                            </Label>
                                            <Input
                                                id="adminPassword"
                                                type="password"
                                                value={adminPassword}
                                                onChange={(e) => setAdminPassword(e.target.value)}
                                                placeholder="Digite a senha"
                                                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                                            />
                                            <div className="flex gap-2">
                                                <Button onClick={handleAdminLogin} size="sm" className="flex-1">
                                                    Entrar
                                                </Button>
                                                <Button onClick={() => setShowAdminLogin(false)} variant="outline" size="sm" className="flex-1">
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-red-600" />
                                        <span className="font-medium text-red-800">Modo Administrador Ativo</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleResetAllVotes} variant="outline" size="sm">
                                            <RotateCcw className="h-4 w-4 mr-1" />
                                            Resetar Votos
                                        </Button>
                                        <Button onClick={handleClearAllGames} variant="outline" size="sm">
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Limpar Tudo
                                        </Button>
                                        <Button onClick={handleAdminLogout} variant="ghost" size="sm">
                                            <EyeOff className="h-4 w-4 mr-1" />
                                            Sair
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-light text-gray-900 mb-2">Votação de Jogos</h1>
                    <p className="text-gray-600">Escolha qual jogo deve ser jogado na próxima stream</p>
                    {votedGames.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                ✓ Você votou em {votedGames.length} jogo{votedGames.length > 1 ? "s" : ""}
                            </p>
                        </div>
                    )}
                </div>

                {/* Games List */}
                <div className="space-y-4 mb-12">
                    {sortedGames.length === 0 ? (
                        <Card className="border border-gray-200">
                            <CardContent className="p-12 text-center">
                                <p className="text-gray-500">Nenhum jogo disponível para votação.</p>
                                {isAdminMode && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        Use a seção &quot;Sugerir Novo Jogo&quot; para adicionar jogos.
                                    </p>
                                )}
                            </CardContent>

                        </Card>
                    ) : (
                        sortedGames.map((game, index) => {
                            const hasVotedThisGame = votedGames.includes(game.id)
                            return (
                                <Card key={game.id} className="border border-gray-200">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                                    <h3 className="text-lg font-medium text-gray-900">{game.name}</h3>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {game.genre}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-2xl font-light text-gray-900">{game.votes}</div>
                                                    <div className="text-sm text-gray-500">votos</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleVote(game.id)}
                                                        disabled={hasVotedThisGame}
                                                        variant={hasVotedThisGame ? "secondary" : "default"}
                                                        className="min-w-[80px]"
                                                    >
                                                        {hasVotedThisGame ? "✓ Votado" : "Votar"}
                                                    </Button>
                                                    {isAdminMode && (
                                                        <Button
                                                            onClick={() => handleRemoveGame(game.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>

                {/* Suggestion Section */}
                <Card className="border border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-gray-900">
                            {isAdminMode ? "Adicionar Novo Jogo" : "Sugerir Novo Jogo"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!showSuggestionForm ? (
                            <Button onClick={() => setShowSuggestionForm(true)} variant="outline" className="w-full">
                                + Adicionar Jogo
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="gameName" className="text-sm font-medium text-gray-700">
                                        Nome do Jogo
                                    </Label>
                                    <Input
                                        id="gameName"
                                        value={newGameName}
                                        onChange={(e) => setNewGameName(e.target.value)}
                                        placeholder="Digite o nome do jogo"
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleSuggestGame} disabled={!newGameName.trim()} className="flex-1">
                                        {isAdminMode ? "Adicionar" : "Sugerir"}
                                    </Button>
                                    <Button onClick={() => setShowSuggestionForm(false)} variant="outline" className="flex-1">
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
