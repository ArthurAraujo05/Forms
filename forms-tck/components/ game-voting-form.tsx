"use client"

import { useState, useEffect, useCallback } from "react"
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

    // Estados de paginação
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Estado de busca
    const [searchTerm, setSearchTerm] = useState("")

    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_PASSWORD

    // Carregar dados do Supabase
    const loadData = useCallback(async () => {
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
    }, [userId])

    // Carregar dados iniciais
    useEffect(() => {
        loadData()
    }, [userId, loadData])

    // Atualizar dados a cada 10 segundos
    useEffect(() => {
        const interval = setInterval(loadData, 10000)
        return () => clearInterval(interval)
    }, [userId, loadData])

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
    }, [userId, loadData])

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

    // Lista de palavras proibidas (case-insensitive)
   const BLOCKED_WORDS = [
  // Racismo (BR)
  "negro", "preto", "crioulo", "criolinha", "macaco", "macaca", "escravo", "preto fedido", "negrinha",
  "negrume", "urubu", "senzala", "capitão do mato", "samba do crioulo doido",

  // Xenofobia (BR)
  "paraíba", "baianada", "nordestino burro", "índio preguiçoso", "selvagem", "bugre", "jeca", "matuto", "zé povinho",

  // Racismo (EUA)
  "nigger", "nigga", "coon", "porch monkey", "jiggaboo", "ape", "monkey", "uncle tom", "sambo",

  // Xenofobia (EUA)
  "spic", "beaner", "wetback", "chink", "gook", "zipperhead", "raghead", "terrorist", "camel jockey",

  // LGBTfobia
  "viado", "veado", "bicha", "bichinha", "sapatão", "dyke", "faggot", "fag", "traveco", "travec", "maricon",
  "homo", "boiola", "baitola", "frutinha", "viadinho",

  // Conteúdo sexual/adulto
  "sexo", "sex", "porn", "porno", "pornografia", "hentai", "nude", "naked", "strip", "stripper", "adult",
  "adulto", "erotic", "erotico", "fetish", "fetiche", "xxx", "18+", "nsfw", "milf", "dilf", "boquete", "chupada",
  "pussy", "dick", "cock", "fuck", "bunda", "bunduda", "buceta", "pica", "rola", "tesão", "gozada", "mamada",
  "corno", "corna", "corninho", "pau", "pauzudo", "rabuda", "peituda", "sexy", "orgasm", "orgasmo",

  // Drogas
  "droga", "drogado", "cocaine", "cocaina", "maconha", "marijuana", "crack", "heroína", "heroina", "meth",
  "metanfetamina", "ácido", "lsd", "êxtase", "ecstasy", "mdma", "baseado", "beck", "erva", "bong", "skank",

  // Violência, morte, terrorismo
  "matar", "kill", "death", "morte", "assassinato", "assassino", "terror", "terrorismo", "massacre", "bomba",
  "tiroteio", "bala perdida", "suicídio", "suicidio", "suicide", "enforcar", "pular da ponte", "tiro na cabeça",
  "genocida", "estupro", "rape", "estuprador", "abuso sexual", "pedofilia", "pedofilo",

  // Capacitismo e bullying
  "retardado", "retard", "aleijado", "cripple", "dumb", "imbecil", "idiota", "mongoloide", "anormal", "babaca",
  "defeituoso", "doente mental", "atrasado", "tapado", "cego", "surdo", "mudo", "burro", "burra",

  // Ofensas gerais / palavrões
  "merda", "porra", "caralho", "cu", "buceta", "bosta", "puta", "putinha", "viado", "piranha", "vagabunda",
  "safada", "otário", "otaria", "imbecil", "idiota", "chifrudo", "babaca", "arrombado", "lixo", "nojento",
  "nojenta", "desgraçado", "maldito", "corno", "fdp", "filho da puta", "pau no cu", "panaca", "escroto",
  "escrota", "cadela", "desgraça", "crápula", "energúmeno",

  // Extremismo político
  "hitler", "nazismo", "nazi", "fascismo", "fascist", "kkk", "supremacista", "white power", "heil hitler",

  // Palavras que causam problemas em ambientes de comunidade
  "ex", "julia", "jhulia", "xulia", "cu de burro simulato", "cocosimulator", "hentai simulator", "NUDES MAE DO TCK", "nudes", "nude", "nueds", "nuudes", "nude mae do tck", "n u d e s", "nu d es", "nude(s)", "xVideos",  "Vazadinhos Telegram", "Sua Mãe", "EROME.COM", "EROME.COM", "Erome.com", "Erome", "Erome.com", "Pika roxa", "pika roxa", "pika roxinha", "pika roxinha do tck", "pika roxinha do tckuu", "pika roxinha do tckuu simulator", "tckuu simulator", "tckuu simulator 2023", "tckuu simulator 2024", "tckuu simulator 2025",
   "cacete mole games", "cacete mole", "cacete mole games", "cacete mole games simulator", "cacete mole games simulator 2023", "cacete mole games simulator 2024", "cacete mole games simulator 2025", "cacete mole games simulator 2026", "cacete mole games simulator 2027", "cacete mole games simulator 2028", "cacete mole games simulator 2029", "cacete mole games simulator 2030", "amor peludo 2", "amor peludo 3", "amor peludo 4", "amor peludo 5", "amor peludo 6", "amor peludo 7", "amor peludo 8", "amor peludo 9", "amor peludo 10", "furry",
  "love with furry",
  "love with furry simulator",
  "furry simulator",
  "furry porn",
  "furry hentai",
  "furry hentai simulator",
  
]

    const validateGameName = (name: string): { isValid: boolean; reason?: string } => {
        const lowerName = name.toLowerCase().trim()

        // Verificar palavras proibidas
        for (const word of BLOCKED_WORDS) {
            if (lowerName.includes(word.toLowerCase())) {
                return {
                    isValid: false,
                    reason: `Conteúdo inadequado detectado. Por favor, sugira jogos apropriados para todos os públicos.`,
                }
            }
        }

        // Verificar se não é muito curto
        if (lowerName.length < 2) {
            return {
                isValid: false,
                reason: "O nome do jogo deve ter pelo menos 2 caracteres.",
            }
        }

        // Verificar se não é muito longo
        if (lowerName.length > 100) {
            return {
                isValid: false,
                reason: "O nome do jogo deve ter no máximo 100 caracteres.",
            }
        }

        return { isValid: true }
    }

    const handleSuggestGame = async () => {
        if (!newGameName.trim()) return

        // Validar conteúdo
        const validation = validateGameName(newGameName)
        if (!validation.isValid) {
            alert(validation.reason)
            return
        }

        // Verificar se já existe um jogo com o mesmo nome (case-insensitive)
        const existingGame = games.find((game) => game.name.toLowerCase().trim() === newGameName.toLowerCase().trim())

        if (existingGame) {
            alert(`O jogo "${existingGame.name}" já foi sugerido!`)
            return
        }

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

    // Filtrar jogos baseado na busca
    const filteredGames = games.filter(
        (game) =>
            game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.genre.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Reset página quando busca mudar
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    // Reset página quando jogos mudarem drasticamente
    useEffect(() => {
        const maxPage = Math.ceil(filteredGames.length / itemsPerPage)
        if (currentPage > maxPage && maxPage > 0) {
            setCurrentPage(maxPage)
        }
    }, [filteredGames.length, itemsPerPage, currentPage])

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

                {/* Suggestion Section */}
                <Card className="border border-gray-200 mb-4">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-gray-900">
                            {isAdminMode ? "Adicionar Novo Jogo" : "Sugerir Novo Jogo"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                ⚠️ <strong>Diretrizes:</strong> Sugestões devem ser apropriadas para todos os públicos. Conteúdo
                                inadequado será automaticamente rejeitado.
                            </p>
                        </div>

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

                {/* Search Bar */}
                <Card className="border border-gray-200 mb-4">
                    <CardContent className="p-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <Input
                                type="text"
                                placeholder="Buscar jogos por nome ou gênero..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4"
                            />
                            {searchTerm && (
                                <Button
                                    onClick={() => setSearchTerm("")}
                                    variant="ghost"
                                    size="sm"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                        {searchTerm && (
                            <div className="mt-2 text-sm text-gray-600">
                                {filteredGames.length} jogo{filteredGames.length !== 1 ? "s" : ""} encontrado
                                {filteredGames.length !== 1 ? "s" : ""} para &quot;{searchTerm}&quot;
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Games List com Paginação */}
                <div className="space-y-4 mb-12">
                    {/* Controles de Paginação - Topo */}
                    {filteredGames.length > 0 && (
                        <Card className="border border-gray-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm text-gray-600">Itens por página:</Label>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value))
                                                    setCurrentPage(1)
                                                }}
                                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredGames.length)} -{" "}
                                            {Math.min(currentPage * itemsPerPage, filteredGames.length)} de {filteredGames.length} jogos
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            variant="outline"
                                            size="sm"
                                        >
                                            ← Anterior
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.ceil(filteredGames.length / itemsPerPage) }, (_, i) => i + 1)
                                                .filter((page) => {
                                                    const totalPages = Math.ceil(filteredGames.length / itemsPerPage)
                                                    if (totalPages <= 7) return true
                                                    if (page === 1 || page === totalPages) return true
                                                    if (Math.abs(page - currentPage) <= 1) return true
                                                    return false
                                                })
                                                .map((page, index, array) => {
                                                    const prevPage = array[index - 1]
                                                    const showEllipsis = prevPage && page - prevPage > 1

                                                    return (
                                                        <div key={page} className="flex items-center">
                                                            {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                                                            <Button
                                                                onClick={() => setCurrentPage(page)}
                                                                variant={currentPage === page ? "default" : "outline"}
                                                                size="sm"
                                                                className="min-w-[32px] h-8"
                                                            >
                                                                {page}
                                                            </Button>
                                                        </div>
                                                    )
                                                })}
                                        </div>

                                        <Button
                                            onClick={() =>
                                                setCurrentPage(Math.min(Math.ceil(filteredGames.length / itemsPerPage), currentPage + 1))
                                            }
                                            disabled={currentPage === Math.ceil(filteredGames.length / itemsPerPage)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Próxima →
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lista de Jogos Paginada */}
                    {filteredGames.length === 0 ? (
                        <Card className="border border-gray-200">
                            <CardContent className="p-12 text-center">
                                <p className="text-gray-500">Nenhum jogo disponível para votação.</p>
                                <p className="text-sm text-gray-400 mt-2">Seja o primeiro a sugerir um jogo!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {filteredGames.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((game, index) => {
                                const hasVotedThisGame = userVotes.includes(game.id)
                                const percentage = totalVotes > 0 ? Math.round((game.votes / totalVotes) * 100) : 0
                                const globalIndex = (currentPage - 1) * itemsPerPage + index + 1

                                return (
                                    <Card key={game.id} className="border border-gray-200">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-sm font-medium text-gray-500">#{globalIndex}</span>
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
                            })}

                            {/* Controles de Paginação - Rodapé */}
                            {Math.ceil(filteredGames.length / itemsPerPage) > 1 && (
                                <Card className="border border-gray-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                onClick={() => setCurrentPage(1)}
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                            >
                                                ⏮ Primeira
                                            </Button>

                                            <Button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                            >
                                                ← Anterior
                                            </Button>

                                            <div className="flex items-center gap-1 mx-4">
                                                <span className="text-sm text-gray-600">
                                                    Página {currentPage} de {Math.ceil(filteredGames.length / itemsPerPage)}
                                                </span>
                                            </div>

                                            <Button
                                                onClick={() =>
                                                    setCurrentPage(Math.min(Math.ceil(filteredGames.length / itemsPerPage), currentPage + 1))
                                                }
                                                disabled={currentPage === Math.ceil(filteredGames.length / itemsPerPage)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Próxima →
                                            </Button>

                                            <Button
                                                onClick={() => setCurrentPage(Math.ceil(filteredGames.length / itemsPerPage))}
                                                disabled={currentPage === Math.ceil(filteredGames.length / itemsPerPage)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Última ⏭
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-16 border-t border-gray-200 pt-8">
                    <div className="text-center space-y-4">
                        {/* Informações principais */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-gray-900">Arthur Araújo</h3>
                            <p className="text-gray-600">Desenvolvedor Full Stack & Streamer</p>
                        </div>

                        {/* Links sociais */}
                        <div className="flex justify-center items-center gap-6">
                            <a
                                href="https://github.com/ArthurAraujo05"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                            </a>

                            <a
                                href="https://twitch.tv/seucanal"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                                </svg>
                                Twitch
                            </a>

                            <a
                                href="https://linkedin.com/in/arthur-araujo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                                LinkedIn
                            </a>

                            <a
                                href="mailto:arthur@exemplo.com"
                                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                Email
                            </a>
                        </div>

                        {/* Informações adicionais */}
                        <div className="text-sm text-gray-500 space-y-1">
                            <p>Sistema de Votação de Jogos • Desenvolvido com Next.js & Supabase</p>
                            <p>© 2024 Arthur Araújo. Todos os direitos reservados.</p>
                        </div>

                        {/* Badge de tecnologias */}
                        <div className="flex justify-center items-center gap-2 pt-2">
                            <Badge variant="outline" className="text-xs">
                                Next.js
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                React
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                Supabase
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                TypeScript
                            </Badge>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
