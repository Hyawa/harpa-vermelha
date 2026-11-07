import { readFileSync, writeFileSync } from 'node:fs'
const songs = JSON.parse(readFileSync('src/data/songs.json','utf8'))
let n=0
for(const s of songs){
  if(s.audioRemoteUrl){
    s.audioUrl = s.audioRemoteUrl
    delete s.audioRemoteUrl
    n++
  } else if(s.audioUrl && s.audioUrl.startsWith('/audio/')){
    // fallback: já sem remote, remove (não deve acontecer)
    delete s.audioUrl
  }
}
writeFileSync('src/data/songs.json', JSON.stringify(songs, null, 2), 'utf8')
console.log('streaming ok,', n, 'musicas com audioUrl remoto')
