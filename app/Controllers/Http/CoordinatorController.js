'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Database = use('Database')

const User = use('App/Models/User')
const Coordinator = use('App/Models/Coordinator')

const { validateAll } = use('Validator')

const TYPE_VALUE = 'Coordenador(a)'

/**
 * Resourceful controller for interacting with coordinators
 */
class CoordinatorController {
  /**
   * Show a list of all coordinators.
   * GET coordinators
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index() {

    const coordinators = await Database
      .select(
        'coordinators.id',
        'coordinators.user_id',
        'users.person_code',
        'users.name',
        'users.email'
      )
      .from('coordinators')
      .innerJoin('users', 'users.id', 'coordinators.user_id')
      .where('users.deleted', false)
      .where('users.type', TYPE_VALUE)

    return coordinators
  }

  /**
   * Create/save a new coordinator.
   * POST coordinators
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, auth }) {

    if (!auth.user.type) {

      const validation = await validateAll(request.all(), {
        person_code: 'required|unique:users',
        name: 'required|min:3',
        email: 'required|email|unique:users',
        password: 'required|min:6'
      })

      if (validation.fails())
        return response.status(400).send({ errors: validation.messages() })

      const userData = request.only(['person_code', 'name', 'email', 'password'])
      const user = await User.create({ ...userData, type: TYPE_VALUE })
      const coordinator = await Coordinator.create({ user_id: user.id })

      return response.status(201).send(coordinator)

    } else
      return response.status(401).send({
        error: 'Permision denied',
        message: 'You are not allowed to create new coordinators'
      })
  }

  /**
   * Display a single coordinator.
   * GET coordinators/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, response }) {

    const coordinator = await Database
      .select(
        'coordinators.id',
        'coordinators.user_id',
        'users.person_code',
        'users.name',
        'users.email'
      )
      .from('coordinators')
      .innerJoin('users', 'users.id', 'coordinators.user_id')
      .where('coordinators.id', params.id)
      .where('users.deleted', false)
      .where('users.type', TYPE_VALUE)

    if (!coordinator)
      return response.status(404).send({
        error: 'Coordinator not found'
      })

    return coordinator
  }

  /**
   * Update coordinator details.
   * PUT or PATCH coordinators/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, auth }) {

    if (!auth.user.type || auth.user.type == TYPE_VALUE) {

      const coordinator = await Coordinator.query()
        .where('id', params.id)
        .first()

      if (!coordinator)
        return response.status(404).send({
          error: 'Coordinator not found'
        })

      if (!auth.user.type || auth.user.id == coordinator.user_id) {

        const validation = await validateAll(request.all(), {
          password: 'required|min:6'
        })

        if (validation.fails())
          return response.status(400).send({ errors: validation.messages() })

        const { password } = request.all()

        const user = await User.query()
          .where('id', coordinator.user_id)
          .first()

        user.password = password
        await user.save()

        return response.status(200).send({
          success: true,
          message: 'User updated successfully'
        })
      }
    }
    return response.status(401).send({
      error: 'Permision denied',
      message: 'You are not allowed to change this record'
    })
  }
}

module.exports = CoordinatorController
