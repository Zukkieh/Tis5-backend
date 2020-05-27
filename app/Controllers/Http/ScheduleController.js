'use strict'

const { rule, validateAll } = use('Validator')
const ScheduleHelper = use('App/Helpers/ScheduleHelper')

const Student = use('App/Models/Student')
const Monitor = use('App/Models/Monitor')
const Schedule = use('App/Models/Schedule')

const ALN = 'Aluno(a)'

class ScheduleController {

  async index({ params, response }) {

    const monitor = await Monitor.query()
      .where('id', params.monitor_id)
      .where('deleted', false)
      .first()

    if (!monitor)
      return response.status(404).send({
        error: 'Monitor não encontrado'
      })

    const schedules = await monitor.schedules().fetch()

    const totalDuration = ScheduleHelper.totalDuration(schedules)

    return response.status(200).send({
      schedules,
      totalDuration,
      workload: monitor.workload
    })
  }

  async store({ params, request, response, auth }) {

    if (auth.user.type == ALN) {

      const errorMessages = {
        regex: 'Formato de horas inválido',
        'start.required': 'O horário de início é obrigatório',
        'end.required': 'O horário de término é obrigatório',
        'day.required': 'O dia da semana é obrigatório',
        'day.in': 'Dia da semana inválido'
      }

      const validation = await validateAll(request.all(), {
        start: [
          rule('required'),
          rule('string'),
          rule('regex', /^([01]\d|2[0-3]):?([0-5]\d)$/)
        ],
        end: [
          rule('required'),
          rule('string'),
          rule('regex', /^([01]\d|2[0-3]):?([0-5]\d)$/)

        ],
        day: 'required|string|in:Segunda-feira,Terça-feira,'
          + 'Quarta-feira,Quinta-feira,Sexta-feira,Sábado'
      }, errorMessages)

      if (validation.fails())
        return response.status(400).send({
          errors: validation.messages()
        })

      const { start, end, day } = request.all()
      const { monitor_id } = params

      const monitor = await Monitor.query()
        .where('id', monitor_id)
        .where('deleted', false)
        .first()

      if (!monitor)
        return response.status(404).send({
          error: 'Monitor não encontrado'
        })

      const mon_student = await monitor.student().fetch()

      if (mon_student.user_id == auth.user.id) {

        const mon_schedules = await monitor.schedules().fetch()

        const validInterval = ScheduleHelper.validateInterval(day, start, end)

        if (!validInterval)
          return response.status(400).send({
            error: 'Este horário está fora dos limites válidos',
            message: 'Segunda à Sexta - 11:30 às 19:00 | Sábado - 07:00 às 16:30'
          })

        const duration = ScheduleHelper.calculateDuration(start, end)

        if (duration.inMinutes < 0)
          return response.status(400).send({
            error: 'O horário de término deve ser maior que o horário de início'
          })

        else if (duration.inMinutes < 30)
          return response.status(400).send({
            error: 'Seu expediente deve possuir uma duração mínima de 30 minutos'
          })

        else if (duration.inMinutes > (8 * 60))
          return response.status(400).send({
            error: 'Seu expediente deve possuir uma duração máxima de 8 horas'
          })

        const validationResult = ScheduleHelper.validate(
          monitor.workload,
          mon_schedules, {
          day,
          duration: duration.inMinutes
        })

        if (validationResult.success) {

          const schedule = await Schedule.create({
            day,
            start,
            end,
            duration: duration.inText,
            monitor_id
          })

          return response.status(201).send(schedule)

        } else
          return response.status(409).send({
            error: 'Não foi possível criar um novo horário',
            message: validationResult.message
          })
      }
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para criar novos horários para este monitor'
    })
  }

  async destroy({ params, response, auth }) {

    if (auth.user.type == ALN) {

      const student = await Student.query()
        .where('user_id', auth.user.id)
        .first()

      if (student) {
        const monitor = await Monitor.query()
          .where('student_id', student.id)
          .where('deleted', false)
          .first()

        if (monitor) {
          const schedule = await Schedule.query()
            .where('id', params.id)
            .where('monitor_id', monitor.id)
            .first()

          if (schedule) {
            await schedule.delete()
            return response.status(204).send()

          } else
            return response.status(404).send({
              error: 'Horário não encontrado',
            })
        }
      }
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para excluir este registro'
    })
  }
}

module.exports = ScheduleController
