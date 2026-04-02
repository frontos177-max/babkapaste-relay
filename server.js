const { WebSocketServer } = require('ws')
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 8080
const SECRET = process.env.SECRET || 'babkapaste'

const server = http.createServer((req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'radar.html'), 'utf8')
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(html)
})

const wss = new WebSocketServer({ server })

let source = null
let lastData = null

wss.on('connection', (ws, req) => {
  // check secret in query string OR header
  const url = new URL(req.url, `http://localhost`)
  const secretParam = url.searchParams.get('secret')
  const secretHeader = req.headers['x-secret']
  const isCheat = secretParam === SECRET || secretHeader === SECRET

  if (isCheat) {
    if (source) source.terminate()
    source = ws
    console.log('[+] cheat connected from', req.socket.remoteAddress)

    ws.on('message', data => {
      lastData = data
      wss.clients.forEach(c => {
        if (c !== source && c.readyState === 1) c.send(data)
      })
    })

    ws.on('close', () => {
      console.log('[-] cheat disconnected')
      if (source === ws) source = null
    })
    return
  }

  // viewer
  console.log('[+] viewer connected')
  if (lastData) ws.send(lastData) // send last known state immediately
  ws.on('close', () => console.log('[-] viewer disconnected'))
})

server.listen(PORT, () => console.log(`relay running on :${PORT}`))
