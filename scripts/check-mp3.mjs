import { readFileSync, writeFileSync } from 'node:fs'
import * as cheerio from 'cheerio'

const songs = JSON.parse(readFileSync('src/data/songs.json','utf8'))
console.log(`total ${songs.length}`)

async function fetchHtml(url){
  const res = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 HarpaVermelha/1.0'}})
  if(!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const header = buf.slice(0,4000).toString('utf8').toLowerCase()
  let enc='iso-8859-1'
  const m=header.match(/charset=([a-z0-9-]+)/)
  if(m) enc=m[1]
  try{ return new TextDecoder(enc).decode(buf)}catch{ return buf.toString('utf8')}
}

const results=[]
for(const s of songs){
  console.log(`${String(s.number).padStart(3,'0')} ${s.title} ...`)
  try{
    const html = await fetchHtml(s.sourceUrl)
    const $ = cheerio.load(html)
    const mp3s=[]
    $('a[href]').each((_,a)=>{
      const href=$(a).attr('href')||''
      const txt=$(a).text().trim()
      if(/\.mp3/i.test(href)){
        const abs = href.startsWith('http')?href:new URL(href,s.sourceUrl).toString()
        mp3s.push({href:abs,text:txt})
      }
    })
    // também embeds <audio>, <source>, <embed>, media?
    // fallback regex no html cru por .mp3 / .wav / .ogg / .ra / .rm
    // regex para audio files gerais
    const audioRe = /href=["'][^"']+\.(mp3|wma|ogg|wav|ra|rm|mid|midi)["']/gi
    const rawAudio = [...html.matchAll(audioRe)].map(m=>m[0])
    // dedup
    const uniq = [...new Set(mp3s.map(m=>m.href))]
    results.push({...s, mp3s:uniq, hasMp3: uniq.length>0, rawAudio})
    console.log(`  -> mp3: ${uniq.length} ${uniq.length? 'OK ['+uniq.join(' | ')+']':''}`)
  }catch(e){
    console.log('  erro',e.message)
    results.push({...s, mp3s:[], hasMp3:false, error:e.message})
  }
  await new Promise(r=>setTimeout(r,120))
}
writeFileSync('scripts/mp3-results.json',JSON.stringify(results,null,2))
console.log('---')
const withMp3 = results.filter(r=>r.hasMp3)
console.log(`COM MP3: ${withMp3.length}/${results.length}`)
for(const r of withMp3){
  console.log(`${String(r.number).padStart(3,'0')} ${r.title} :: ${r.mp3s[0]}`)
}
console.log('--- SEM MP3 ---')
for(const r of results.filter(r=>!r.hasMp3)){
  console.log(`${String(r.number).padStart(3,'0')} ${r.title} :: ${r.sourceUrl}`)
}
