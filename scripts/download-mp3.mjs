// Baixa os MP3s do marxists.org para public/audio/NNN.mp3
// Uso: node scripts/download-mp3.mjs [--skip-existing]
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, statSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { createWriteStream } from 'node:fs'

const results = JSON.parse(readFileSync('scripts/mp3-results.json','utf8'))
const songs = JSON.parse(readFileSync('src/data/songs.json','utf8'))

// mapa id -> url remota (com correção para chinesas 75-86)
function remoteUrlFor(entry){
  if(entry.number>=75 && entry.number<=86){
    const idx = entry.number-74 // 75->01 ... 86->12
    return `https://www.marxists.org/subject/china/music/audio/cult_rev_${String(idx).padStart(2,'0')}.mp3`
  }
  return entry.mp3s[0] || ''
}

mkdirSync('public/audio', {recursive:true})

const queue = results.filter(r=>r.hasMp3).map(r=>({
  id: r.id,
  number: r.number,
  title: String(r.title).replace(/\s+/g,' ').trim(),
  remote: remoteUrlFor(r),
  local: `public/audio/${String(r.number).padStart(3,'0')}.mp3`,
  publicUrl: `/audio/${String(r.number).padStart(3,'0')}.mp3`,
}))
console.log(`A baixar ${queue.length} MP3s...`)

// dedup: baixa uma vez por URL, copia para os outros
const byRemote = new Map()
for(const q of queue){
  if(!byRemote.has(q.remote)) byRemote.set(q.remote, [])
  byRemote.get(q.remote).push(q)
}
console.log(`${new Set(queue.map(q=>q.remote)).size} URLs únicas, ${queue.length} músicas`)

const skipExisting = process.argv.includes('--skip-existing')
let done=0, totalBytes=0, failed=[]

async function downloadOne(remote, dest){
  if(skipExisting && existsSync(dest)){
    const sz = statSync(dest).size
    totalBytes += sz
    console.log(`  [skip] ${dest} (${(sz/1024).toFixed(0)} KB)`)
    return true
  }
  const res = await fetch(remote, {headers:{'User-Agent':'Mozilla/5.0 HarpaVermelha/1.0'}})
  if(!res.ok) throw new Error(`HTTP ${res.status}`)
  if(!res.body) throw new Error('sem body')
  await pipeline(res.body, createWriteStream(dest))
  const sz = statSync(dest).size
  totalBytes += sz
  console.log(`  [ok] ${dest} (${(sz/1024/1024).toFixed(2)} MB) <- ${remote}`)
  return true
}

for(const [remote, qs] of byRemote){
  try{
    const first = qs[0]
    const tmp = first.local // baixa no primeiro destino
    await downloadOne(remote, tmp)
    // copia para duplicados
    for(let i=1;i<qs.length;i++){
      copyFileSync(tmp, qs[i].local)
      console.log(`  [copy] ${qs[i].local} (duplicado de ${first.local})`)
    }
    done += qs.length
  }catch(e){
    console.log(`  [erro] ${remote} -> ${qs[0].local}: ${e.message}`)
    failed.push({remote, error:e.message, targets: qs.map(q=>q.local)})
    done += qs.length
  }
  await new Promise(r=>setTimeout(r,150))
}

console.log(`\nConcluído: ${queue.length - failed.reduce((a,f)=>a+f.targets.length,0)}/${queue.length} ok | ${(totalBytes/1024/1024).toFixed(2)} MB total | ${failed.length} URLs com erro`)
if(failed.length){
  console.log('Falhas:')
  for(const f of failed) console.log(' -', f.remote, f.error, f.targets.join(', '))
}

// atualiza songs.json com audioUrl (local) + audioRemoteUrl
const remoteById = new Map(queue.map(q=>[q.id, q]))
for(const s of songs){
  const q = remoteById.get(s.id)
  if(q){
    s.audioUrl = q.publicUrl
    s.audioRemoteUrl = q.remote
  } else {
    delete s.audioUrl
    delete s.audioRemoteUrl
  }
}
writeFileSync('src/data/songs.json', JSON.stringify(songs, null, 2), 'utf8')
console.log('✅ src/data/songs.json atualizado com audioUrl')
console.log(`💾 Arquivos em public/audio/`)
