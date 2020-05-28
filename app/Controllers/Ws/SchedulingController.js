'use strict'

const User = use('App/Models/User')
const RequestService = use('App/Services/RequestService')

class SchedulingController {

  constructor({ socket, request, auth }) {
    this.socket = socket
    this.request = request
    this.auth = auth

    this.connect()
  }

  async connect() {
    const user = await User.find(this.auth.user.id)

    user.socket_id = this.socket.id

    await user.save()
  }

  async onRequest(data) {
    try {
      const result = await RequestService.create(this.auth, data)

      if (result.success) {
        this.socket.emitTo(result.event, result.data, [result.recipient])
        this.socket.emit('success', { message: 'Solicitação criada com sucesso' })
      } else
        this.socket.emit(result.event, result.data)

    } catch (error) {
      console.error(error)
    }
  }

  async onResponse(data) {
    try {
      const result = await RequestService.update(this.auth, data)

      if (result.success) {
        this.socket.emitTo(result.event, result.data, [result.recipient])
        this.socket.emit('success', { message: 'Solicitação respondida com sucesso' })
      } else
        this.socket.emit(result.event, result.data)

    } catch (error) {
      console.error(error)
    }
  }

  async onClose() {
    const user = await User.find(this.auth.user.id)

    user.socket_id = null

    await user.save()
  }
}

module.exports = SchedulingController
