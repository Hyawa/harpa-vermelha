export interface Song {
  id: string
  number: number
  title: string
  category: string
  sourceUrl: string
  lyrics: string
  /** URL remota do MP3 no marxists.org para streaming dentro do app */
  audioUrl?: string
}
