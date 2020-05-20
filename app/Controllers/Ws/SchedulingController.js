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

  * connect() {
    const authUser = yield User.find(this.auth.user.id)
    authUser.socket_id = this.socket.id
    yield authUser.save()
  }

  * onRequest(data) {

    try {

      const schedule = yield Schedule.find(data.schedule_id)

      const monitor = yield Monitor.find(schedule.monitor_id)
      const student = yield monitor.student().fetch()
      const user = yield student.user().fetch()

      const authUser = yield User.find(this.auth.user.id)
      const authStudent = yield authUser.student().fetch()

      const created = yield Request.create({
        message: data.message,
        status: 'Pendente',
        schedule_id: data.schedule_id,
        student_id: authStudent.id,
        monitor_id: schedule.monitor_id
      })

      const request = yield Request.query()
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

    } catch (error) {
      console.error(error)
      this.socket.to([authUser.socket_id]).emit('error', error)
    }
  }

  * onResponse(data) {

    try {

      const request = yield Request.find(data.request_id)

      const student = yield Student.find(request.student_id)
      const user = yield student.user().fetch()

      const authUser = yield User.find(this.auth.user.id)

      request.response = data.response
      request.status = data.confirmed ? 'Confirmada' : 'Recusada'

      yield request.save()

      const response = yield Request.query()
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

    } catch (error) {
      console.error(error)
      this.socket.to([authUser.socket_id]).emit('error', error)
    }
  }

  * onClose() {
    const authUser = yield User.find(this.auth.user.id)
    authUser.socket_id = null
    yield authUser.save()
  }
}

module.exports = SchedulingController
