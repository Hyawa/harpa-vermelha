import { readFileSync } from 'node:fs'
const r = JSON.parse(readFileSync('scripts/mp3-results.json','utf8')).filter(x=>x.hasMp3)
console.log('total to dl', r.length)
let total=0
for(const s of r){
  // special handling for chinese 75-86: map index
  let url = s.mp3s[0]
  if(s.number>=75 && s.number<=86){
    const idx = s.number-74
    url = `https://www.marxists.org/subject/china/music/audio/cult_rev_${String(idx).padStart(2,'0')}.mp3`
  }
  try{
    const res = await fetch(url, {method:'HEAD', headers:{'User-Agent':'Mozilla/5.0'}})
    const len = res.headers.get('content-length')
    const n = len? parseInt(len,10):0
    total+=n
    console.log(String(s.number).padStart(3,'0'), (n/1024).toFixed(1)+'KB', res.status, url)
  }catch(e){ console.log(String(s.number).padStart(3,'0'), 'ERR', e.message, url) }
  await new Promise(r=>setTimeout(r,80))
}
console.log('TOTAL MB', (total/1024/1024).toFixed(2))
