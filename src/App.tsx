import { useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { Search, Heart, Home, BookOpen, Star, ArrowLeft, Minus, Plus, Moon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import songs from '@/data/songs.json'
import type { Song } from '@/data/types'

const allSongs = songs as Song[]
const CATEGORIES = ['Todas', ...Array.from(new Set(allSongs.map(s => s.category)))]

function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('hv:favorites') || '[]') } catch { return [] }
  })
  const toggle = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('hv:favorites', JSON.stringify(next))
      return next
    })
  }
  return { favorites, toggle }
}

function Header() {
  const [dark, setDark] = useState(false)
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Harpa Vermelha" className="h-10 w-10 rounded-xl" />
          <div>
            <h1 className="text-base font-bold leading-tight">Harpa Vermelha</h1>
            <p className="text-xs text-muted-foreground">Hinário revolucionário • {allSongs.length} hinos</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => { setDark(!dark); document.documentElement.classList.toggle('dark', !dark) }} aria-label="Alternar tema">
          <Moon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3">
        <NavLink to="/" className={({ isActive }) => cn('flex flex-col items-center gap-1 py-3 text-xs', isActive ? 'text-primary font-bold' : 'text-muted-foreground')}>
          <Home className="h-5 w-5" /> Início
        </NavLink>
        <NavLink to="/buscar" className={({ isActive }) => cn('flex flex-col items-center gap-1 py-3 text-xs', isActive ? 'text-primary font-bold' : 'text-muted-foreground')}>
          <Search className="h-5 w-5" /> Buscar
        </NavLink>
        <NavLink to="/favoritos" className={({ isActive }) => cn('flex flex-col items-center gap-1 py-3 text-xs', isActive ? 'text-primary font-bold' : 'text-muted-foreground')}>
          <Heart className="h-5 w-5" /> Favoritos
        </NavLink>
      </div>
    </nav>
  )
}

function SongList({ list, favorites, toggle }: { list: Song[]; favorites: string[]; toggle: (id: string) => void }) {
  if (list.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">Nenhum hino encontrado.</p>
  return (
    <ul className="divide-y">
      {list.map(song => {
        const isFav = favorites.includes(song.id)
        return (
          <li key={song.id} className="flex items-center gap-3 py-3">
            <Link to={`/musica/${song.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">{String(song.number).padStart(3,'0')}</span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{song.title}</span>
                <span className="block text-xs text-muted-foreground">{song.category}</span>
              </span>
            </Link>
            <Button variant={isFav ? 'default' : 'ghost'} size="icon" onClick={() => toggle(song.id)} aria-label="Favoritar">
              <Heart className={cn('h-5 w-5', isFav && 'fill-current')} />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

function HomePage() {
  const [category, setCategory] = useState('Todas')
  const { favorites, toggle } = useFavorites()
  const filtered = useMemo(() => category === 'Todas' ? allSongs : allSongs.filter(s => s.category === category), [category])
  const first = allSongs[0]
  return (
    <div className="pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        <Card className="mb-4 p-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" className="h-14 w-14 rounded-xl" alt="" />
            <div className="min-w-0">
              <h2 className="font-bold">Harpa Vermelha</h2>
              <p className="text-sm text-muted-foreground">Como um hinário, mas com as músicas revolucionárias do marxists.org</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to={`/musica/${first.id}`}><Button className="w-full"><BookOpen className="mr-2 h-4 w-4" /> Começar pelo 001</Button></Link>
            <Link to="/buscar"><Button variant="outline" className="w-full"><Search className="mr-2 h-4 w-4" /> Buscar hino</Button></Link>
          </div>
        </Card>
        <div className="mb-3 flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} onClick={() => setCategory(c)} className="rounded-full">{c} {c !== 'Todas' && <span className="ml-1 opacity-70">{allSongs.filter(s=>s.category===c).length}</span>}</Button>
          ))}
        </div>
        <SongList list={filtered} favorites={favorites} toggle={toggle} />
      </div>
    </div>
  )
}

function SearchPage() {
  const [q, setQ] = useState('')
  const { favorites, toggle } = useFavorites()
  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return allSongs.slice(0, 30)
    return allSongs.filter(s => s.title.toLowerCase().includes(term) || String(s.number).padStart(3,'0') === term || s.lyrics.toLowerCase().includes(term))
  }, [q])
  return (
    <div className="pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        <h2 className="mb-3 text-lg font-bold">Buscar hino</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input autoFocus placeholder="Título, número ou trecho da letra..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
        </div>
        <p className="mb-2 text-xs text-muted-foreground">{results.length} resultado(s)</p>
        <SongList list={results} favorites={favorites} toggle={toggle} />
      </div>
    </div>
  )
}

function FavoritesPage() {
  const { favorites, toggle } = useFavorites()
  const list = allSongs.filter(s => favorites.includes(s.id))
  return (
    <div className="pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        <h2 className="mb-3 text-lg font-bold">Favoritos</h2>
        {list.length === 0 ? (
          <Card className="p-6 text-center">
            <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Toque no coração de um hino para salvar aqui.</p>
          </Card>
        ) : <SongList list={list} favorites={favorites} toggle={toggle} />}
      </div>
    </div>
  )
}

function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const song = allSongs.find(s => s.id === id) || allSongs[0]
  const { favorites, toggle } = useFavorites()
  const [fontSize, setFontSize] = useState(18)
  const isFav = favorites.includes(song.id)
  const idx = allSongs.findIndex(s => s.id === song.id)
  const prev = allSongs[idx - 1]
  const next = allSongs[idx + 1]

  return (
    <div className="pb-28 pt-4">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Índice</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setFontSize(Math.max(14, fontSize - 2))}><Minus className="h-4 w-4" /></Button>
            <span className="text-xs">{fontSize}px</span>
            <Button variant="ghost" size="icon" onClick={() => setFontSize(Math.min(28, fontSize + 2))}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>

        <Card className="p-5 text-center">
          <Badge variant="secondary" className="mb-2">{song.category}</Badge>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Hino nº {String(song.number).padStart(3,'0')}</p>
          <h2 className="my-2 text-2xl font-bold leading-tight">{song.title}</h2>
          <div className="flex justify-center gap-2">
            <Button size="sm" variant={isFav ? 'default' : 'outline'} onClick={() => toggle(song.id)}><Heart className={cn('mr-2 h-4 w-4', isFav && 'fill-current')} /> {isFav ? 'Favoritado' : 'Favoritar'}</Button>
            <Button size="sm" variant="outline" asChild><a href={song.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Fonte</a></Button>
          </div>
        </Card>

        <Card className="mt-4 p-5">
          <p className="whitespace-pre-wrap leading-8" style={{ fontSize }}>{song.lyrics}</p>
          <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3" /> Fonte: marxists.org — {song.sourceUrl}</p>
        </Card>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {prev ? <Link to={`/musica/${prev.id}`}><Button variant="outline" className="w-full">← {prev.number}</Button></Link> : <span />}
          {next ? <Link to={`/musica/${next.id}`}><Button variant="outline" className="w-full">{next.number} →</Button></Link> : <span />}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/buscar" element={<SearchPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/musica/:id" element={<ReaderPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
