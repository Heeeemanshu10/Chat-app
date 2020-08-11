const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser , getUser, getUsersInRoom } = require('./utils/user')


const app = express()
const server = http.createServer(app)
const port = 3000
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
        socket.on('join' , (options , callback) => {
        const {error, user} = addUser({ id: socket.id , ...options })
        if(error) {
        return  callback(error)
        }

            socket.join(user.room)

      socket.emit('message', generateMessage('Welcome!'))
      socket.broadcast.to(user.room).emit('message', generateMessage(user.username +'has joined'))

      callback()
    }) 
    
    socket.on('sendMessage' , (message , callback) => {
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }

        io.to('Center City').emit('message', generateMessage(message))
        callback()
    })
    
    socket.on('sendLocation', (coords,callback) => {
        io.emit('locationMessage', generateLocationMessage('https://google.com/maps?q='+coords.latitude+','+coords.longitude ))
        callback()
    })
    
socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if(user) {
        io.to(user.room).emit('message', generateMessage(user.username +'has left'))
    }
    
})

})


server.listen(port , (req,res) => {
    console.log('Servers are up and running' + port)
})