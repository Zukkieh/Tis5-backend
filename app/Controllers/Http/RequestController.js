'use strict'

const Ws = use('Ws')
const { validateAll } = use('Validator')
const RequestService = use('App/Services/RequestService')

const Request = use('App/Models/Request')
const User = use('App//Models/User')
const Student = use('App/Models/Student')
const Monitor = use('App/Models/Monitor')
const Schedule = use('App/Models/Schedule')

const ALN = 'Aluno(a)'

class RequestController {

  async index({ params, response, auth }) {

    const student = await Student.find(params.student_id)

    if (!student)
      return response.status(404).send({
        error: 'Aluno não encontrado'
      })

    const stud_user = await student.user().fetch()

    if (auth.user.id == stud_user.id) {

      const requests = await RequestService.findAll('student_id', student.id)

      return response.status(200).send(requests)
    }
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

    const mon_student = await monitor.student().fetch()
    const mon_user = await mon_student.user().fetch()

    if (auth.user.id == mon_user.id) {

      const requests = await RequestService.findAll('monitor_id', monitor.id)

      return response.status(200).send(requests)
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para acessar estes dados'
    })
  }

  async store({ request, response, auth }) {

    if (auth.user.type == ALN) {

      const errorMessages = {
        'schedule_id.required': 'O ID do horário é obrigatório'
      }

      const validation = await validateAll(request.all(), {
        schedule_id: 'required|integer|above:0',
        message: 'string'
      }, errorMessages)

      if (validation.fails())
        return response.status(400).send({
          errors: validation.messages()
        })

      const { schedule_id, message } = request.all()

      const schedule = await Schedule.find(schedule_id)

      if (!schedule)
        return response.status(404).send({
          error: 'Horário não encontrado'
        })

      const monitor = await schedule.monitor().fetch()

      if (monitor.deleted)
        return response.status(404).send({
          error: 'Monitor não encontrado'
        })

      const authUser = await User.find(auth.user.id)
      const authStudent = await authUser.student().fetch()

      const newRequest = await Request.create({
        message,
        status: 'Pendente',
        schedule_id,
        student_id: authStudent.id,
        monitor_id: schedule.monitor_id
      })

      const data = await RequestService.findOne('id', newRequest.id)

      const topic = Ws.getChannel('scheduling').topic('request')

      if (topic)
        topic.broadcastToAll('request', data)

      return response.status(201).send(data)
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para criar novas solicitações'
    })
  }

  async show({ params, response, auth }) {

    if (auth.user.type === ALN) {

      const oldRequest = await RequestService.findOne('id', params.id)

      if (!oldRequest)
        return response.status(404).send({
          error: 'Solicitação não encontrada'
        })

      const data = oldRequest.toJSON()

      if (data.student.user_id == auth.user.id ||
        data.monitor.student.user_id == auth.user.id) {

        return response.status(200).send(oldRequest)
      }
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para acessar estes dados'
    })
  }

  async update({ params, request, response, auth }) {

    if (auth.user.type == ALN) {

      const errorMessages = {
        'confirmed.required': 'A resposta da confirmação é obrigatória'
      }

      const validation = await validateAll(request.all(), {
        confirmed: 'required|boolean',
        response: 'string'
      }, errorMessages)

      if (validation.fails())
        return response.status(400).send({
          errors: validation.messages()
        })

      const oldRequest = await Request.find(params.id)
      const req_monitor = await oldRequest.monitor().fetch()
      const mon_student = await req_monitor.student().fetch()

      if (mon_student.user_id == auth.user.id) {

        const { confirmed, response: monitorResponse } = request.all()

        oldRequest.response = monitorResponse
        oldRequest.status = confirmed ? 'Confirmada' : 'Recusada'

        await oldRequest.save()

        const data = await RequestService.findOne('id', oldRequest.id)

        const topic = Ws.getChannel('scheduling').topic('response')

        if (topic)
          topic.broadcastToAll('response', data)

        return response.status(200).send(data)
      }
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para alterar esta solicitação'
    })
  }

  async destroy({ params, response, auth }) {

    if (auth.user.type == ALN) {

      const authUser = await User.find(auth.user.id)
      const authStudent = await authUser.student().fetch()

      const oldRequest = await Request.find(params.id)

      if (!oldRequest)
        return response.status(404).send({
          error: 'Horário não encontrado'
        })

      if (oldRequest.student_id == authStudent.id) {

        const request = await Request.query()
          .where('id', params.id)
          .first()

        await request.delete()

        return response.status(204).send()
      }
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para excluir esta solicitação'
    })
  }
}

module.exports = RequestController
