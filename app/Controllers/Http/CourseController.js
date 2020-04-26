'use strict'

const Database = use('Database')
const { validateAll } = use('Validator')

const Course = use('App/Models/Course')
const Coordinator = use('App/Models/Coordinator')

const TYPE_VALUE = 'Coordenador(a)'

class CourseController {

  async index({ response }) {

    const courses = await Database
      .select([
        'courses.id',
        'courses.name',
        'courses.campus',
        'courses.coordinator_id',
        'users.name as coordinator_name'
      ])
      .from('courses')
      .leftJoin('coordinators', 'coordinators.id', 'courses.coordinator_id')
      .leftJoin('users', 'users.id', 'coordinators.user_id')

    return response.status(200).send(courses)
  }

  async store({ request, response, auth }) {

    if (!auth.user.type) {

      const enu = await Database
        .raw('SELECT unnest(enum_range(NULL::course_campus))::text AS campus')

      const campus_values = enu.rows.map(course => course.campus)

      const validation = await validateAll(request.all(), {
        name: 'required|string|min:5',
        campus: `required|string|in:${campus_values}`,
        coordinator_id: 'integer|not_equals:0'
      })

      if (validation.fails())
        return response.status(400).send({
          errors: validation.messages()
        })

      const data = request.only(['name', 'campus'])
      const { coordinator_id } = request.all()

      if (coordinator_id) {

        const coordinator = await Coordinator.query()
          .where('id', coordinator_id)
          .first()

        const user = coordinator ? await coordinator.user().fetch() : null

        if (!coordinator || user.deleted || user.type != TYPE_VALUE)
          return response.status(404).send({
            error: 'Coordinator not found'
          })

        const alreadyExists = await Course
          .findBy('coordinator_id', coordinator_id)

        if (alreadyExists)
          return response.status(400).send({
            error: 'Coordinator unavailable',
            message: 'This coordinator is already allocated to a course'
          })
      }

      const course = await Course.create({ ...data, coordinator_id })

      return response.status(201).send(course)

    } else
      return response.status(403).send({
        error: 'Permision denied',
        message: 'You are not allowed to create new courses'
      })
  }

  async show({ params, response }) {

    const course = await Database
      .select([
        'courses.id',
        'courses.name',
        'courses.campus',
        'courses.coordinator_id',
        'users.name as coordinator_name'
      ])
      .from('courses')
      .leftJoin('coordinators', 'coordinators.id', 'courses.coordinator_id')
      .leftJoin('users', 'users.id', 'coordinators.user_id')
      .where('courses.id', params.id)
      .first()

    if (!course)
      return response.status(404).send({
        error: 'Course not found'
      })

    return response.status(200).send(course)
  }

  async update({ params, request, response, auth }) {

    if (!auth.user.type) {

      const course = await Course.query()
        .where('id', params.id)
        .first()

      if (!course)
        return response.status(404).send({
          error: 'Course not found'
        })

      const validation = await validateAll(request.all(), {
        name: 'string|min:5|required_without_all:coordinator_id',
        coordinator_id: 'integer|not_equals:0|required_without_all:name'
      })

      if (validation.fails())
        return response.status(400).send({
          errors: validation.messages()
        })

      const { name, coordinator_id } = request.all()

      if (name)
        course.name = name

      if (coordinator_id) {

        const coordinator = await Coordinator.query()
          .where('id', coordinator_id)
          .first()

        const user = coordinator ? await coordinator.user().fetch() : null

        if (!coordinator || user.deleted || user.type != TYPE_VALUE)
          return response.status(404).send({
            error: 'Coordinator not found'
          })

        const alreadyExists = await Course
          .findBy('coordinator_id', coordinator_id)

        if (alreadyExists)
          return response.status(400).send({
            error: 'Coordinator unavailable',
            message: 'This coordinator is already allocated to a course'
          })

        course.coordinator_id = coordinator_id
      }

      await course.save()

      return response.status(200).send({
        success: true,
        message: 'Course updated successfully'
      })

    } else
      return response.status(403).send({
        error: 'Permision denied',
        message: 'You are not allowed to create new courses'
      })
  }
}

module.exports = CourseController
