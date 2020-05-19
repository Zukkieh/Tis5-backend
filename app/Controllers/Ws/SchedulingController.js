'use strict'

const User = use('App//Models/User')
const Student = use('App/Models/Student')
const Monitor = use('App/Models/Monitor')
const Schedule = use('App/Models/Schedule')
const Request = use('App/Models/Request')

class SchedulingController {

  constructor({ socket, request, auth }) {
    this.socket = socket
    this.request = request
    this.auth = auth

    this.connect()
  }

  async connect() {
    const authUser = await User.find(this.auth.user.id)
    authUser.socket_id = this.socket.id
    await authUser.save()
  }

  async onRequest(data) {
    const schedule = await Schedule.find(data.schedule_id)

    const monitor = await Monitor.find(schedule.monitor_id)
    const student = await monitor.student().fetch()
    const user = await student.user().fetch()

    const authUser = await User.find(this.auth.user.id)

    const created = await Request.create({
      message: data.message,
      status: 'Pendente',
      schedule_id: data.schedule_id,
      student_id: this.auth.user.id,
      monitor_id: schedule.monitor_id
    })

    const request = await Request.query()
      .select(['id', 'student_id', 'monitor_id', 'schedule_id',
        'status', 'message'])
      .with('student', s => {
        s.select(['id', 'user_id'])
        s.with('user', u => u.select(['name']))
      })
      .with('monitor', m => {
        m.select(['id', 'student_id'])
        m.with('student', s => {
          s.select(['id', 'user_id'])
          s.with('user', u => u.select(['name']))
        })
      })
      .with('schedule')
      .where('id', created.id)
      .first()

    const recipients = [authUser.socket_id, user.socket_id]

    this.socket.to([...recipients]).emit('request', request)
  }

  async onResponse(data) {
    const request = await Request.find(data.request_id)

    const student = await Student.find(request.student_id)
    const user = await student.user().fetch()

    const authUser = await User.find(this.auth.user.id)

    request.response = data.response
    request.status = data.confirmed ? 'Confirmada' : 'Recusada'

    await request.save()

    const response = await Request.query()
      .select(['id', 'student_id', 'monitor_id', 'schedule_id',
        'status', 'message', 'response'])
      .with('student', s => {
        s.select(['id', 'user_id'])
        s.with('user', u => u.select(['name']))
      })
      .with('monitor', m => {
        m.select(['id', 'student_id'])
        m.with('student', s => {
          s.select(['id', 'user_id'])
          s.with('user', u => u.select(['name']))
        })
      })
      .with('schedule')
      .where('id', request.id)
      .first()

    const recipients = [authUser.socket_id, user.socket_id]

    this.socket.to([...recipients]).emit('response', response)
  }

  async onClose() {
    const authUser = await User.find(this.auth.user.id)
    authUser.socket_id = null
    await authUser.save()
  }
}

module.exports = SchedulingController
