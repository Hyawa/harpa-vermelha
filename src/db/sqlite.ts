// SQLite via Capacitor Community — pronto para migrar songs.json para SQLite
// No web, usa localStorage; no mobile, usa @capacitor-community/sqlite
import { Capacitor } from '@capacitor/core'
import songs from '@/data/songs.json'
import type { Song } from '@/data/types'

export const isNative = Capacitor.isNativePlatform()

export async function initDatabase() {
  if (!isNative) return null
  try {
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
    const sqlite = CapacitorSQLite as any
    const db = await sqlite.createConnection({ database: 'harpa-vermelha', encrypted: false })
    await db.open()
    await db.execute(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        source_url TEXT NOT NULL,
        lyrics TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS favorites (
        song_id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
    // seed songs se vazio
    const check = await db.query('SELECT COUNT(*) as c FROM songs')
    if ((check.values?.[0] as any)?.c === 0) {
      for (const s of songs as Song[]) {
        await db.execute({
          statement: 'INSERT OR REPLACE INTO songs (id, number, title, category, source_url, lyrics) VALUES (?, ?, ?, ?, ?, ?)',
          values: [s.id, s.number, s.title, s.category, s.sourceUrl, s.lyrics],
        })
      }
    }
    return db
  } catch (e) {
    console.warn('SQLite init falhou, usando fallback JSON', e)
    return null
  }
}
