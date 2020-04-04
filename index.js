const express = require('express')
var app = express()

const http = require('http').Server(app);
const io = require('socket.io')(http)
const path = require('path')

const port = process.env.PORT || 3000


app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

let clients = []
let content = ""

io.on('connect', (client) => {
    clients.push(client)
    client.emit('update', content)

    console.log('Novo cliente conectado!')
    client.on('type', (data) => {
        content = data
        clients.forEach((c) => {
            if (c.id !== client.id)
                c.emit('update', content)
        })
    })
})

http.listen(port, function() {
    console.log(`Servidor inicializado na porta ${port}`)
})