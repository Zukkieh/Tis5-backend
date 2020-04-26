'use strict'

const { validateAll } = use('Validator')

const Monitor = use('App/Models/Monitor')
const Coordinator = use('App/Models/Coordinator')
const Student = use('App/Models/Student')
const Subject = use('App/Models/Subject')

const COORD = 'Coordenador(a)'

class MonitorController {

  async index({ params, response }) {

    const monitors = await Monitor.query()
      .select([
        'id',
        'workload',
        'student_id',
        'subject_id',
        'semester'
      ])
      .where('subject_id', params.subject_id)
      .where('deleted', false)
      .with('student')
      .fetch()

    return response.status(200).send(monitors)
  }

  async store({ request, response, auth }) {

    if (auth.user.type == COORD) {

      const coordinator = await Coordinator.query()
        .where('user_id', auth.user.id)
        .with('course')
        .first()

      if (!coordinator.course)
        return response.status(400).send({
          error: 'Data inconsistency',
          message: 'This coordinator does not have a course'
        })

      const validation = await validateAll(request.all(), {
        workload: 'required|integer|above:4|under:21',
        student_id: 'required|integer|not_equals:0',
        subject_id: 'required|integer|not_equals:0'
      })

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
          error: 'Student not found'
        })

      const subject = await Subject.query()
        .where('id', subject_id)
        .with('course')
        .first()

      if (!subject)
        return response.status(404).send({
          error: 'Subject not found'
        })

      if (!subject.active)
        return response.status(406).send({
          error: 'This subject is disabled'
        })

      const coord_course = await coordinator.course().fetch()

      if (student.course_id != subject.course_id
        || coord_course.id != student.course_id)
        return response.status(400).send({
          error: 'Unmatched data',
          message: 'Data from other courses is not allowed'
        })

      let semester

      const oldMonitor = await Monitor.query()
        .where('student_id', student_id)
        .where('subject_id', subject_id)
        .orderBy('semester', 'desc')
        .first()

      if (oldMonitor && !oldMonitor.deleted)
        return response.status(406).send({
          error: 'This student already has a monitor registration for this subject'
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
      error: 'Permision denied',
      message: 'You are not allowed to create new monitors'
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
        error: 'Monitor not found'
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
          error: 'Data inconsistency',
          message: 'This coordinator does not have a course'
        })

      const monitor = await Monitor.query()
        .where('id', params.id)
        .where('deleted', false)
        .with('student')
        .first()

      if (!monitor)
        return response.status(404).send({
          error: 'Monitor not found'
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
      error: 'Permision denied',
      message: 'You are not allowed to delete this record'
    })
  }
}

module.exports = MonitorController
