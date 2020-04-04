const app = require('express')()
const http = require('http').Server(app);
const io = require('socket.io')(http)

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

http.listen(8080, function() {
    console.log("Servidor inicializado na porta 8080")
})