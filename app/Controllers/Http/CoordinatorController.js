'use strict'

const Database = use('Database')
const { validateAll } = use('Validator')

const User = use('App/Models/User')
const Coordinator = use('App/Models/Coordinator')

const TYPE_VALUE = 'Coordenador(a)'

class CoordinatorController {

  async index({ response }) {

    const coordinators = await Database
      .select([
        'coordinators.id',
        'coordinators.user_id',
        'users.person_code',
        'users.name',
        'users.email'
      ])
      .from('coordinators')
      .innerJoin('users', 'users.id', 'coordinators.user_id')
      .where('users.deleted', false)
      .where('users.type', TYPE_VALUE)

    return response.status(200).send(coordinators)
  }

  async store({ request, response, auth }) {

    if (!auth.user.type) {

      const validation = await validateAll(request.all(), {
        person_code: 'required|unique:users',
        name: 'required|min:3',
        email: 'required|email|unique:users',
        password: 'required|min:6'
      })

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
        error: 'Permision denied',
        message: 'You are not allowed to create new coordinators'
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
        error: 'Coordinator not found'
      })

    return response.status(200).send(coordinator)
  }
}

module.exports = CoordinatorController
