const { WebSocketServer } = require('ws')
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 8080
const SECRET = process.env.SECRET || 'babkapaste'

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'radar.html'), 'utf8')
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  } else {
    res.writeHead(404)
    res.end()
  }
})

const wss = new WebSocketServer({ server })

let source = null

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost`)
  const secret = url.searchParams.get('secret')

  // чит подключается с секретом
  if (secret === SECRET) {
    if (source) source.terminate()
    source = ws
    console.log('cheat connected')

    ws.on('message', data => {
      wss.clients.forEach(c => {
        if (c !== source && c.readyState === 1) c.send(data)
      })
    })

    ws.on('close', () => {
      console.log('cheat disconnected')
      source = null
    })
    return
  }

  // браузер подключается без секрета
  console.log('viewer connected')
  ws.on('close', () => console.log('viewer disconnected'))
})

server.listen(PORT, () => console.log(`relay running on port ${PORT}`))
