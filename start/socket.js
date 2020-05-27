'use strict'

/*
|--------------------------------------------------------------------------
| Websocket
|--------------------------------------------------------------------------
|
| This file is used to register websocket channels and start the Ws server.
| Learn more about same in the official documentation.
| https://adonisjs.com/docs/websocket
|
| For middleware, do check `wsKernel.js` file.
|
*/

const Ws = use('Ws')
const User = use('App/Models/User')

Ws.channel('scheduling', async ({ socket, auth }) => {

    socket.emit('config', socket.id)
    socket.emit('config', auth.user.id)

    const user = await User.find(auth.user.id)

    socket.emit('config', user)

    user.socket_id = socket.id

    await user.save()

    socket.emit('config', 'socket_id salvo no banco')

    socket.broadcastToAll('request', 'verificando tópico request...')
    socket.broadcastToAll('response', 'verificando tópico response...')

}).middleware(['auth'])
