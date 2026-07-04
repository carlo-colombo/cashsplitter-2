const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3333
const root = __dirname

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

http.createServer((req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url
  let filePath = path.join(root, urlPath)

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(root, 'index.html'), (err2, data2) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not found')
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(data2)
        }
      })
    } else {
      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      res.end(data)
    }
  })
}).listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
