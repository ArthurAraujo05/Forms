"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Settings, RotateCcw, EyeOff, RefreshCw, Users } from "lucide-react"
import { supabase, type Game } from "@/lib/supabase"

export default function GameVotingForm() {
  const [games, setGames] = useState<Game[]>([])
  const [userVotes, setUserVotes] = useState<number[]>([])
  const [userId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("voting-user-id")
      if (!id) {
        id = "user_" + Math.random().toString(36).substr(2, 9)
        localStorage.setItem("voting-user-id", id)
      }
      return id
    }
    return "user_" + Math.random().toString(36).substr(2, 9)
  })

  const [newGameName, setNewGameName] = useState("")
  const [showSuggestionForm, setShowSuggestionForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [totalUsers, setTotalUsers] = useState(0)

  // Admin states
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

  // Carregar dados do Supabase
  const loadData = async () => {
    try {
      setIsLoading(true)

      // Carregar jogos
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .order("votes", { ascending: false })

      if (gamesError) throw gamesError

      // Carregar votos do usuário
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("game_id")
        .eq("user_id", userId)

      if (votesError) throw votesError

      // Contar usuários únicos
      const { data: uniqueUsers, error: usersError } = await supabase.from("votes").select("user_id")

      if (!usersError && uniqueUsers) {
        const unique = new Set(uniqueUsers.map((v) => v.user_id))
        setTotalUsers(unique.size)
      }

      setGames(gamesData || [])
      setUserVotes(votesData?.map((v) => v.game_id) || [])

      console.log("Dados carregados:", gamesData?.length, "jogos")
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
  }, [userId])

  // Atualizar dados a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [userId])

  // Configurar real-time updates
  useEffect(() => {
    const gamesChannel = supabase
      .channel("games-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "games" }, () => {
        console.log("Mudança detectada nos jogos, recarregando...")
        loadData()
      })
      .subscribe()

    const votesChannel = supabase
      .channel("votes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        console.log("Mudança detectada nos votos, recarregando...")
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(gamesChannel)
      supabase.removeChannel(votesChannel)
    }
  }, [userId])

  const handleVote = async (gameId: number) => {
    if (userVotes.includes(gameId)) return

    try {
      setIsLoading(true)

      // Adicionar voto na tabela votes
      const { error: voteError } = await supabase.from("votes").insert({ user_id: userId, game_id: gameId })

      if (voteError) throw voteError

      // Incrementar contador de votos do jogo
      const { error: updateError } = await supabase.rpc("increment_votes", { game_id: gameId })

      if (updateError) throw updateError

      console.log("Voto registrado para jogo:", gameId)
      await loadData()
    } catch (error) {
      console.error("Erro ao votar:", error)
      alert("Erro ao registrar voto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestGame = async () => {
    if (!newGameName.trim()) return

    try {
      setIsLoading(true)

      const { error } = await supabase.from("games").insert({
        name: newGameName.trim(),
        genre: "Sugestão",
        votes: 0,
      })

      if (error) throw error

      setNewGameName("")
      setShowSuggestionForm(false)
      console.log("Jogo adicionado:", newGameName)
      await loadData()
    } catch (error) {
      console.error("Erro ao adicionar jogo:", error)
      alert("Erro ao adicionar jogo")
    } finally {
      setIsLoading(false)
    }
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

  const handleRemoveGame = async (gameId: number) => {
    if (!confirm("Tem certeza que deseja remover este jogo?")) return

    try {
      setIsLoading(true)

      // Remover votos do jogo
      await supabase.from("votes").delete().eq("game_id", gameId)

      // Remover jogo
      const { error } = await supabase.from("games").delete().eq("id", gameId)

      if (error) throw error

      console.log("Jogo removido:", gameId)
      await loadData()
    } catch (error) {
      console.error("Erro ao remover jogo:", error)
      alert("Erro ao remover jogo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetAllVotes = async () => {
    if (!confirm("Tem certeza que deseja resetar todos os votos?")) return

    try {
      setIsLoading(true)

      // Remover todos os votos
      await supabase.from("votes").delete().neq("id", 0)

      // Resetar contador de votos de todos os jogos
      const { error } = await supabase.from("games").update({ votes: 0 }).neq("id", 0)

      if (error) throw error

      console.log("Todos os votos resetados")
      await loadData()
    } catch (error) {
      console.error("Erro ao resetar votos:", error)
      alert("Erro ao resetar votos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAllGames = async () => {
    if (!confirm("Tem certeza que deseja remover TODOS os jogos?")) return

    try {
      setIsLoading(true)

      // Remover todos os votos
      await supabase.from("votes").delete().neq("id", 0)

      // Remover todos os jogos
      const { error } = await supabase.from("games").delete().neq("id", 0)

      if (error) throw error

      console.log("Todos os jogos removidos")
      await loadData()
    } catch (error) {
      console.error("Erro ao limpar jogos:", error)
      alert("Erro ao limpar jogos")
    } finally {
      setIsLoading(false)
    }
  }

  const totalVotes = games.reduce((sum, game) => sum + game.votes, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Admin Panel */}
        <div className="mb-6">
          {!isAdminMode ? (
            <div className="flex justify-between items-center">
              <Button onClick={loadData} variant="ghost" size="sm" className="text-gray-500" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
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
                    <Button onClick={handleResetAllVotes} variant="outline" size="sm" disabled={isLoading}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Resetar Votos
                    </Button>
                    <Button onClick={handleClearAllGames} variant="outline" size="sm" disabled={isLoading}>
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

          {/* Stats */}
          <div className="mt-4 flex justify-center gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 text-sm font-medium">
                  {totalUsers} {totalUsers === 1 ? "pessoa votou" : "pessoas votaram"}
                </span>
              </div>
            </div>

            {userVotes.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <span className="text-green-800 text-sm font-medium">
                  ✓ Você votou em {userVotes.length} jogo{userVotes.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Atualização em tempo real • {games.length} jogos • {totalVotes} votos totais
          </div>
        </div>

        {/* Games List */}
        <div className="space-y-4 mb-12">
          {games.length === 0 ? (
            <Card className="border border-gray-200">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Nenhum jogo disponível para votação.</p>
                <p className="text-sm text-gray-400 mt-2">Seja o primeiro a sugerir um jogo!</p>
              </CardContent>
            </Card>
          ) : (
            games.map((game, index) => {
              const hasVotedThisGame = userVotes.includes(game.id)
              const percentage = totalVotes > 0 ? Math.round((game.votes / totalVotes) * 100) : 0

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
                          {percentage > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {percentage}%
                            </Badge>
                          )}
                        </div>
                        {/* Barra de progresso */}
                        {totalVotes > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <div className="text-2xl font-light text-gray-900">{game.votes}</div>
                          <div className="text-sm text-gray-500">votos</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVote(game.id)}
                            disabled={hasVotedThisGame || isLoading}
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
                              disabled={isLoading}
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
              <Button
                onClick={() => setShowSuggestionForm(true)}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
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
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSuggestGame} disabled={!newGameName.trim() || isLoading} className="flex-1">
                    {isAdminMode ? "Adicionar" : "Sugerir"}
                  </Button>
                  <Button
                    onClick={() => setShowSuggestionForm(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={isLoading}
                  >
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
