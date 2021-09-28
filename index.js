const express = require('express')
var app = express()

const http = require('http').createServer(app);
const io = require('socket.io')(http)
const path = require('path')

io.origins(['http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:4200', 'http://localhost:4200', 'https://colaborative-text-editor-serve.herokuapp.com'])

const port = process.env.PORT || 3000
const useHTTPS = process.env.HTTPS || false

if (useHTTPS) {
    app.use(function(req, res, next) {
        if (req.headers["x-forwarded-proto"] === "https")
            return next();

        res.redirect("https://" + req.headers.host + req.url);
    });
}

app.use(express.static('public'))
app.get('/', (req, res) => res.sendFile(path.resolve('public/index.html')))

let clients = []
let content = ""
let typing = {
    username: null,
    id: null
}
let timer

function updateUsersList() {
    clients.forEach(c => c.client.emit('updateUsersList', { users: clients.map(c => c.data.username) }))
}

function onType(client, data) {
    if (typing.id === client.id || typing.id === null) {
        content = data
        clients.forEach(c => {
            if (c.client.id !== client.id)
                return
            typing.username = c.data.username
            typing.id = c.client.id
        })
        clients.forEach(c => {
            if (c.client.id === client.id)
                return c.client.emit('typing', typing.username)

            c.client.emit('update', content)
            c.client.emit('typing', typing.username)

        })
        clearTimeout(timer)
        timer = setTimeout(() => {
            typing.id = null
            typing.username = null
            clients.forEach(c => c.client.emit('typing', null))
        }, 600)
    }
}

function identify(client, username) {
    console.log(`Novo cliente conectado : ${username}`)

    clients.push({
        data: {
            username: username
        },
        client: client
    })
    updateUsersList()
    client.on('type', data => onType(client, data))
    client.on('disconnect', () => disconnect(client))
    client.emit('update', content)
}

function disconnect(client) {
    clients.forEach((c, idx) => {
        if (c.client.id === client.id)
            clients.splice(idx, 1)
    })
    updateUsersList()
}

function connect(client) {
    client.on('identify', username => identify(client, username))
}

io.on('connect', (client) => connect(client))

http.listen(port, function() {
    console.log(`Servidor inicializado na porta ${port}`)
})