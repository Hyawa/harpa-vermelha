// Importer: lê marxists.org e gera src/data/songs.json
// Uso: pnpm run import:songs
import { writeFileSync, mkdirSync } from 'node:fs'
import * as cheerio from 'cheerio'

const BASE = 'https://www.marxists.org/portugues/tematica/musica'
const SOURCES = [
  { url: `${BASE}/index.htm`, category: 'Internacional', limit: 43 },
  { url: `${BASE}/sovietica.htm`, category: 'Soviética' },
  { url: 'https://www.marxists.org/subject/china/music/index.htm', category: 'Chinesa' },
  { url: 'https://www.marxists.org/romana/tematica/muzica/index.htm', category: 'Romena' },
]

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'HarpaVermelha/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const header = buf.slice(0, 2000).toString('utf8').toLowerCase()
  let enc = 'utf-8'
  const m = header.match(/charset=([a-z0-9-]+)/)
  if (m) enc = m[1]
  try { return new TextDecoder(enc).decode(buf) } catch { return buf.toString('utf8') }
}

function cleanLines(html, $) {
  const $body = $('body')
  let text = $body.text()
  // preserva quebras por <p>, <br>
  const html2 = $body.html() || ''
  // remove script/style
  const $clone = $('body').clone()
  $clone.find('script,style,nav,footer,header').remove()
  // substitui <br>/<p> por \n
  $clone.find('br').replaceWith('\n')
  $clone.find('p,div,li,h1,h2,h3,h4').each((_i, el) => {
    $(el).after('\n')
  })
  text = $clone.text()
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map(s => s.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extractLyrics(url) {
  try {
    const html = await fetchText(url)
    const $ = cheerio.load(html)
    // tenta remover cabeçalho do MIA
    const text = cleanLines(html, $)
    // pega depois do título H1/H3
    const lines = text.split('\n')
    // remove linhas repetidas de navegação
    const filtered = lines.filter(l => !l.startsWith('Arquivo Marxista') && !l.startsWith('Temas') && !l.includes('www.marxists.org'))
    const lyrics = filtered.slice(0, 400).join('\n')
    return lyrics.length > 40 ? lyrics : null
  } catch (e) {
    console.warn('  falha lyrics', url, e.message)
    return null
  }
}

async function main() {
  const songs = []
  let n = 1
  for (const src of SOURCES) {
    console.log('Fonte:', src.url, src.category)
    const html = await fetchText(src.url)
    const $ = cheerio.load(html)
    const links = []
    $('a[href]').each((_i, a) => {
      const href = $(a).attr('href') || ''
      const title = $(a).text().trim()
      if (!title || title.length < 2) return
      if (href.startsWith('#')) return
      if (href.includes('.mp3') || href.includes('.pdf') || href.includes('.mid') || href.includes('.ram') || href.includes('.rm')) return
      // só links que parecem música
      const isSong = /\.(htm|html)$/i.test(href) && !href.includes('index') && !href.includes('sovietica') && href !== 'international.htm'
      if (!isSong) return
      links.push({ href, title })
    })
    // dedup por href
    const seen = new Set()
    const uniq = links.filter(l => { if (seen.has(l.href)) return false; seen.add(l.href); return true })
    console.log('  links encontrados:', uniq.length)
    for (const link of uniq.slice(0, 60)) {
      const abs = link.href.startsWith('http') ? link.href : new URL(link.href, src.url).toString()
      console.log(`  ${String(n).padStart(3,'0')} ${link.title} -> ${abs}`)
      const lyrics = await extractLyrics(abs)
      songs.push({
        id: `song-${String(n).padStart(3,'0')}`,
        number: n,
        title: link.title,
        category: src.category,
        sourceUrl: abs,
        lyrics: lyrics || `Letra completa disponível na fonte:\n${abs}`,
      })
      n++
      // pausa para não saturar
      await new Promise(r => setTimeout(r, 200))
    }
  }
  // inserts manuais importantes se não já cobertos
  const hasInternacional = songs.some(s => /internacional/i.test(s.title))
  if (!hasInternacional) {
    songs.unshift({
      id: 'song-001', number: 1, title: 'A Internacional', category: 'Internacional',
      sourceUrl: `${BASE}/international.htm`,
      lyrics: 'De pé! Ó vítimas da fome\nDe pé! famélicos da terra\nA indolente razão ruge e consome\nA crosta bruta que a soterra!\n\nDe pé! De pé não mais senhores!\nSe nada somos em tal mundo,\nSejamos todos, ó produtores!\n\nRefrão:\nBem unidos, façamos,\nNesta luta final.\nUma terra sem amo,\nA Internacional!\n\nMessias, Deus, chefes supremos,\nNada esperamos de nenhum!\nSejamos nós que conquistemos\nA terra mãe livre e comum!\n\nPara não ter protestos vãos,\nPara sair deste antro estreito,\nFaçamos nós por nossas mãos,\nTudo que a nós nos diz respeito.\n\nRefrão:\nBem unidos, façamos,\nNesta luta final.\nUma terra sem amo,\nA Internacional!'
    })
    // renumera
    songs.forEach((s,i)=>{ s.number=i+1; s.id=`song-${String(i+1).padStart(3,'0')}` })
  }
  mkdirSync('src/data', { recursive: true })
  writeFileSync('src/data/songs.json', JSON.stringify(songs, null, 2), 'utf8')
  console.log(`✅ ${songs.length} músicas salvas em src/data/songs.json`)
}

main().catch(e => { console.error(e); process.exit(1) })
