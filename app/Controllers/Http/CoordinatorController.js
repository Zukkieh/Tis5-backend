'use strict'

const Database = use('Database')
const { validateAll } = use('Validator')

const User = use('App/Models/User')
const Coordinator = use('App/Models/Coordinator')

const TYPE_VALUE = 'Coordenador(a)'

class CoordinatorController {

  async index({ request, response }) {

    const { page = 1, limit = 10 } = request.get()

    const coordinators = await Database
      .select([
        'coordinators.id',
        'coordinators.user_id',
        'users.person_code',
        'users.name',
        'users.email',
        'courses.id as course_id',
        'courses.name as course_name',
        'courses.campus as course_campus'
      ])
      .from('coordinators')
      .innerJoin('users', 'users.id', 'coordinators.user_id')
      .leftJoin('courses', 'courses.coordinator_id', 'coordinators.id')
      .where('users.deleted', false)
      .where('users.type', TYPE_VALUE)
      .paginate(page, limit)

    return response.status(200).send(coordinators)
  }

  async store({ request, response, auth }) {

    if (!auth.user.type) {

      const errorMessages = {
        'person_code.required': 'O código de pessoa é obrigatório',
        'person_code.unique': 'Este código de pessoa já está cadastrado',
        'name.required': 'O nome é obrigatório',
        'name.min': 'O nome deve possuir no mínimo 3 caracteres',
        'email.required': 'O email é obrigatório',
        'email.email': 'Formato de email inválido',
        'email.unique': 'Este email já está cadastrado',
        'password.required': 'A senha é obrigatória',
        'password.min': 'A senha deve possuir no mínimo 6 caracteres'
      }

      const validation = await validateAll(request.all(), {
        person_code: 'required|unique:users',
        name: 'required|min:3',
        email: 'required|email|unique:users',
        password: 'required|min:6'
      }, errorMessages)

      if (validation.fails())
        return response.status(400).send({
          errors: validation.messages()
        })

      const userData = request.only(['person_code', 'name', 'email', 'password'])
      const user = await User.create({ ...userData, type: TYPE_VALUE })
      const coordinator = await Coordinator.create({ user_id: user.id })

      return response.status(201).send(coordinator)

    } else
      return response.status(403).send({
        error: 'Permissão negada',
        message: 'Você não tem permissão para criar novos coordenadores'
      })
  }

  async show({ params, response }) {

    const coordinator = await Database
      .select([
        'coordinators.id',
        'coordinators.user_id',
        'users.person_code',
        'users.name',
        'users.email'
      ])
      .from('coordinators')
      .innerJoin('users', 'users.id', 'coordinators.user_id')
      .where('coordinators.id', params.id)
      .where('users.deleted', false)
      .where('users.type', TYPE_VALUE)
      .first()

    if (!coordinator)
      return response.status(404).send({
        error: 'Coordenador não encontrado'
      })

    return response.status(200).send(coordinator)
  }
}

module.exports = CoordinatorController
