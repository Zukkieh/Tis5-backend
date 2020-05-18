'use strict'

const { validateAll } = use('Validator')

const Monitor = use('App/Models/Monitor')
const Coordinator = use('App/Models/Coordinator')
const Student = use('App/Models/Student')
const Subject = use('App/Models/Subject')

const COORD = 'Coordenador(a)'

class MonitorController {

  async index({ params, request, response }) {

    const { page = 1, limit = 10 } = request.get()

    const monitors = await Monitor.query()
      .select([
        'id',
        'workload',
        'semester',
        'student_id'
      ])
      .where('subject_id', params.subject_id)
      .where('deleted', false)
      .with('student', s => {
        s.select(['id', 'phone', 'registration', 'user_id'])
        s.with('user', u => u.select(['id', 'name', 'person_code']))
      })
      .paginate(page, limit)

    return response.status(200).send(monitors)
  }

  async _index({ params, response }) {

    const student = await Student.query()
      .where('id', params.student_id)
      .first()

    if (!student)
      return response.status(404).send({
        error: 'Aluno não encontrado'
      })

    if (student.is_monitor) {
      const monitoring = await student.monitoring()
        .select(['id', 'workload', 'student_id', 'subject_id'])
        .with('subject', s => s.select(['id', 'name', 'shift']))
        .where('deleted', false)
        .fetch()

      return response.status(200).send(monitoring)
    } else
      return response.status(409).send({
        error: 'Este aluno não é um monitor'
      })
  }

  async store({ request, response, auth }) {

    if (auth.user.type == COORD) {

      const coordinator = await Coordinator.query()
        .where('user_id', auth.user.id)
        .with('course')
        .first()

      if (!coordinator.course)
        return response.status(400).send({
          error: 'Inconsistência de dados',
          message: 'Este coordenador não possui um curso'
        })

      const errorMessages = {
        'workload.required': 'A carga horária é obrigatória',
        'workload.above': 'A carga horária mínima é 5 horas',
        'workload.under': 'A carga horária máxima é 20 horas',
        'student_id.required': 'É obrigatório informar um aluno',
        'subject_id.required': 'É obrigatório informar uma disciplina'
      }

      const validation = await validateAll(request.all(), {
        workload: 'required|integer|above:4|under:21',
        student_id: 'required|integer|above:0',
        subject_id: 'required|integer|above:0'
      }, errorMessages)

      if (validation.fails())
        return response.status(400).send({
          errors: validation.messages()
        })

      const { student_id, subject_id, workload } = request.all()

      const student = await Student.query()
        .where('id', student_id)
        .with('user')
        .first()

      if (!student || student.user.deleted)
        return response.status(404).send({
          error: 'Aluno não encontrado'
        })

      const subject = await Subject.query()
        .where('id', subject_id)
        .with('course')
        .first()

      if (!subject)
        return response.status(404).send({
          error: 'Disciplina não encontrada'
        })

      if (!subject.active)
        return response.status(409).send({
          error: 'Esta disciplina está desativada'
        })

      const coord_course = await coordinator.course().fetch()

      if (student.course_id != subject.course_id
        || coord_course.id != student.course_id)
        return response.status(400).send({
          error: 'Dados não correspondentes',
          message: 'Não são permitidos dados de outros cursos'
        })

      let semester

      const oldMonitor = await Monitor.query()
        .where('student_id', student_id)
        .where('subject_id', subject_id)
        .orderBy('semester', 'desc')
        .first()

      if (oldMonitor && !oldMonitor.deleted)
        return response.status(409).send({
          error: 'Este aluno já possui um cadastro de monitor para esta disciplina'
        })
      else if (oldMonitor)
        semester = oldMonitor.semester + 1
      else
        semester = 1

      const monitor = await Monitor.create({
        student_id,
        subject_id,
        workload,
        semester
      })

      if (!student.is_monitor) {
        student.is_monitor = true
        await student.save()
      }

      return response.status(201).send(monitor)
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para criar novos monitores'
    })
  }

  async show({ params, response }) {

    const monitor = await Monitor.query()
      .select([
        'id',
        'workload',
        'student_id',
        'subject_id',
        'semester'
      ])
      .where('id', params.id)
      .where('deleted', false)
      .with('subject')
      .with('student')
      .first()

    if (!monitor)
      return response.status(404).send({
        error: 'Monitor não encontrado'
      })

    return response.status(200).send(monitor)
  }

  async destroy({ params, response, auth }) {

    if (auth.user.type == COORD) {

      const coordinator = await Coordinator.query()
        .where('user_id', auth.user.id)
        .with('course')
        .first()

      if (!coordinator.course)
        return response.status(400).send({
          error: 'Inconsistência de dados',
          message: 'Este coordenador não possui um curso'
        })

      const monitor = await Monitor.query()
        .where('id', params.id)
        .where('deleted', false)
        .with('student')
        .first()

      if (!monitor)
        return response.status(404).send({
          error: 'Monitor não encontrado'
        })

      const coord_course = await coordinator.course().fetch()
      const mon_student = await monitor.student().fetch()

      if (coord_course.id == mon_student.course_id) {

        monitor.deleted = true
        await monitor.save()

        const stillMonitor = await Monitor.query()
          .where('student_id', monitor.student_id)
          .where('deleted', false)
          .fetch()

        if (stillMonitor.rows.length == 0) {

          mon_student.is_monitor = false
          await mon_student.save()
        }

        return response.status(204).end()
      }
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para excluir este registro'
    })
  }
}

module.exports = MonitorController
