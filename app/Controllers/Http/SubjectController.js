'use strict'

const { validateAll } = use('Validator')

const Subject = use('App/Models/Subject')
const Coordinator = use('App/Models/Coordinator')

const COORD = 'Coordenador(a)'

class SubjectController {

  async index({ params, response }) {

    const subjects = await Subject.query()
      .select([
        'id',
        'name',
        'shift',
        'active'
      ])
      .where('course_id', params.course_id)
      .fetch()

    return response.status(200).send(subjects)
  }

  async store({ request, response, auth }) {

    if (auth.user.type == COORD) {

      const validation = await validateAll(request.all(), {
        name: 'string|min:3|required',
        shift: 'string|in:Manhã,Tarde,Noite|required'
      })

      if (validation.fails())
        return response.status(400).send({
          errors: validation.messages()
        })

      const data = request.only(['name', 'shift'])

      const coordinator = await Coordinator
        .findBy('user_id', auth.user.id)

      const { id: course_id } = await coordinator.course().fetch()

      const subject = await Subject.create({ ...data, course_id })

      return response.status(201).send(subject)

    } else
      return response.status(401).send({
        error: 'Permision denied',
        message: 'You are not allowed to create new subjects'
      })
  }

  async show({ params, response, }) {

    const subject = await Subject.query()
      .where('id', params.id)
      .with('course')
      .first()

    if (!subject)
      return response.status(404).send({
        error: 'Subject not found'
      })

    return response.status(200).send(subject)
  }

  async update({ params, request, response, auth }) {

    if (auth.user.type == COORD) {

      const subject = await Subject
        .findBy('id', params.id)

      if (!subject)
        return response.status(404).send({
          error: 'Subject not found'
        })

      const coordinator = await Coordinator
        .findBy('user_id', auth.user.id)

      const course = await coordinator.course().fetch()

      if (subject.course_id == course.id) {

        const validation = await validateAll(request.all(), {
          name: 'string|min:3|required_without_all:shift,active',
          shift: 'string|in:Manhã,Tarde,Noite|required_without_all:name,active',
          active: 'boolean|required_without_all:name,shift'
        })

        if (validation.fails())
          return response.status(400).send({
            errors: validation.messages()
          })

        const { name, shift, active } = request.all()

        if (name)
          subject.name = name
        if (shift)
          subject.shift = shift
        if (active)
          subject.active = active

        await subject.save()

        return response.status(200).send({
          success: true,
          message: 'Subject updated successfully'
        })
      }
    }
    return response.status(401).send({
      error: 'Permision denied',
      message: 'You are not allowed to change this record'
    })
  }
}

module.exports = SubjectController
