import { readFileSync } from 'node:fs'
const r = JSON.parse(readFileSync('scripts/mp3-results.json','utf8'))
console.log('COM MP3', r.filter(x=>x.hasMp3).length)
for(const x of r.filter(x=>x.hasMp3)){
  const t = String(x.title).replace(/\s+/g,' ').trim()
  console.log(String(x.number).padStart(3,'0'), '|', t, '|', x.mp3s[0])
}
console.log('---SEM---')
for(const x of r.filter(x=>!x.hasMp3)){
  const t = String(x.title).replace(/\s+/g,' ').trim()
  console.log(String(x.number).padStart(3,'0'), '|', t, '|', x.sourceUrl)
}
