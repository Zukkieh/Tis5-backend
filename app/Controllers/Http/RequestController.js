'use strict'

const Ws = use('Ws')

const Request = use('App/Models/Request')
const User = use('App//Models/User')
const Student = use('App/Models/Student')
const Monitor = use('App/Models/Monitor')
const Schedule = use('App/Models/Schedule')

class RequestController {

  async index({ params, response, auth }) {

    const student = await Student.find(params.student_id)

    if (!student)
      return response.status(404).send({
        error: 'Aluno não encontrado'
      })

    const user = await student.user().fetch()

    if (auth.user.id == user.id) {

      const requests = await Request.query()
        .select(['id', 'student_id', 'monitor_id', 'schedule_id', 'status'])
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
        .where('student_id', student.id)
        .fetch()

      return response.status(200).send(requests)

    } else
      return response.status(403).send({
        error: 'Permissão negada',
        message: 'Você não tem permissão para acessar estes dados'
      })
  }

  async _index({ params, response, auth }) {

    const monitor = await Monitor.find(params.monitor_id)

    if (!monitor)
      return response.status(404).send({
        error: 'Monitor não encontrado'
      })

    const student = await monitor.student().fetch()
    const user = await student.user().fetch()

    if (auth.user.id == user.id) {

      const requests = await Request.query()
        .select(['id', 'student_id', 'monitor_id', 'schedule_id', 'status'])
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
        .where('monitor_id', monitor.id)
        .fetch()

      return response.status(200).send(requests)

    } else
      return response.status(403).send({
        error: 'Permissão negada',
        message: 'Você não tem permissão para acessar estes dados'
      })
  }

  async store({ request, response, auth }) {

    const { schedule_id, message } = request.all()

    const schedule = await Schedule.find(schedule_id)
    const authUser = await User.find(auth.user.id)
    const authStudent = await authUser.student().fetch()

    const newRequest = await Request.create({
      message,
      status: 'Pendente',
      schedule_id,
      student_id: authStudent.id,
      monitor_id: schedule.monitor_id
    })

    const data = await Request.query()
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
      .where('id', newRequest.id)
      .first()

    const topic = Ws.getChannel('scheduling').topic('request')

    if (topic) {
      topic.emitTo('request', data, [authUser.socket_id])
    }

    return response.status(201).send(data)
  }

  async show({ params, response, auth }) {

    const request = await Request.query()
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
      .where('id', params.id)
      .first()

    return response.status(200).send(request)
  }

  async update({ params, request, response, auth }) {

    const { confirmed, response: monitorResponse } = request.all()

    const oldRequest = await Request.find(params.id)

    const authUser = await User.find(auth.user.id)

    oldRequest.response = monitorResponse
    oldRequest.status = confirmed ? 'Confirmada' : 'Recusada'

    await oldRequest.save()

    const data = await Request.query()
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
      .where('id', oldRequest.id)
      .first()

    const topic = Ws.getChannel('scheduling').topic('response')

    if (topic) {
      topic.emitTo('response', data, [authUser.socket_id])
    }

    return response.status(200).send(data)
  }

  async destroy({ params, response, auth }) {

    const request = await Request.query()
      .where('id', params.id)
      .first()

    await request.delete()

    return response.status(204).send()
  }
}
module.exports = RequestController
