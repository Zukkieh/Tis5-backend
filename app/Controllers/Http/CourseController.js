'use strict'

const Database = use('Database')
const { validateAll } = use('Validator')

const Course = use('App/Models/Course')
const Coordinator = use('App/Models/Coordinator')

const TYPE_VALUE = 'Coordenador(a)'

class CourseController {

  async index({ request, response }) {

    const { page = 1, limit = 10 } = request.get()

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
      .paginate(page, limit)

    return response.status(200).send(courses)
  }

  async store({ request, response, auth }) {

    if (!auth.user.type) {

      const enu = await Database
        .raw('SELECT unnest(enum_range(NULL::course_campus))::text AS campus')
      const campus_values = enu.rows.map(course => course.campus)

      const errorMessages = {
        'name.required': 'O nome é obrigatório',
        'name.min': 'O nome deve possuir no mínimo 5 caracteres',
        'campus.required': 'O campus é obrigatório',
        'campus.in': 'Campus inválido'
      }

      const validation = await validateAll(request.all(), {
        name: 'required|string|min:5',
        campus: `required|string|in:${campus_values}`,
        coordinator_id: 'integer|above:0'
      }, errorMessages)

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
            error: 'Coordenador não encontrado'
          })

        const alreadyExists = await Course
          .findBy('coordinator_id', coordinator_id)

        if (alreadyExists)
          return response.status(400).send({
            error: 'Coordenador indisponível',
            message: 'Este coordenador já está alocado em um curso'
          })
      }

      const course = await Course.create({ ...data, coordinator_id })

      return response.status(201).send(course)

    } else
      return response.status(403).send({
        error: 'Permissão negada',
        message: 'Você não tem permissão para criar novos cursos'
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
        error: 'Curso não encontrado'
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
          error: 'Curso não encontrado'
        })

      const errorMessages = {
        'name.min': 'O nome deve possuir no mínimo 5 caracteres',
      }

      const validation = await validateAll(request.all(), {
        name: 'string|min:5|required_without_all:coordinator_id',
        coordinator_id: 'integer|above:0|required_without_all:name'
      }, errorMessages)

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
            error: 'Coordenador não encontrado'
          })

        const alreadyExists = await Course
          .findBy('coordinator_id', coordinator_id)

        if (alreadyExists)
          return response.status(400).send({
            error: 'Coordenador indisponível',
            message: 'Este coordenador já está alocado em um curso'
          })

        course.coordinator_id = coordinator_id
      }

      await course.save()

      return response.status(200).send({
        success: true,
        message: 'Curso atualizado com sucesso'
      })

    } else
      return response.status(403).send({
        error: 'Permissão negada',
        message: 'Você não tem permissão para atualizar este registro'
      })
  }
}

module.exports = CourseController
