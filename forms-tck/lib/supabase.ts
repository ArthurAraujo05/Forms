import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Game {
  id: number
  name: string
  genre: string
  votes: number
  created_at: string
}

export interface Vote {
  id: number
  user_id: string
  game_id: number
  created_at: string
}
