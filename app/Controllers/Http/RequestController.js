'use strict'

const RequestService = use('App/Services/RequestService')

const Student = use('App/Models/Student')
const Monitor = use('App/Models/Monitor')

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
}

module.exports = RequestController
