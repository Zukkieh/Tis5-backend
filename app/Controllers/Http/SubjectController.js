'use strict'

const { validateAll } = use('Validator')

const Subject = use('App/Models/Subject')
const Coordinator = use('App/Models/Coordinator')

const COORD = 'Coordenador(a)'

class SubjectController {

  async index({ params, request, response }) {

    const { page = 1, limit = 10 } = request.get()

    const subjects = await Subject.query()
      .select([
        'id',
        'name',
        'shift',
        'active'
      ])
      .where('course_id', params.course_id)
      .paginate(page, limit)

    return response.status(200).send(subjects)
  }

  async store({ request, response, auth }) {

    if (auth.user.type == COORD) {

      const errorMessages = {
        'name.required': 'O nome é obrigatório',
        'name.min': 'O nome deve possuir no mínimo 3 caracteres',
        'shift.required': 'O turno é obrigatório',
        'shift.in': 'Turno inválido'
      }

      const validation = await validateAll(request.all(), {
        name: 'required|string|min:3',
        shift: 'required|string|in:Manhã,Tarde,Noite'
      }, errorMessages)

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
      return response.status(403).send({
        error: 'Permissão negada',
        message: 'Você não tem permissão para criar novas disciplinas'
      })
  }

  async show({ params, response, }) {

    const subject = await Subject.query()
      .where('id', params.id)
      .with('course')
      .first()

    if (!subject)
      return response.status(404).send({
        error: 'Disciplina não encontrada'
      })

    return response.status(200).send(subject)
  }

  async update({ params, request, response, auth }) {

    if (auth.user.type == COORD) {

      const subject = await Subject
        .findBy('id', params.id)

      if (!subject)
        return response.status(404).send({
          error: 'Disciplina não encontrada'
        })

      const coordinator = await Coordinator
        .findBy('user_id', auth.user.id)

      const course = await coordinator.course().fetch()

      if (subject.course_id == course.id) {

        const errorMessages = {
          'name.min': 'O nome deve possuir no mínimo 3 caracteres',
          'shift.in': 'Turno inválido'
        }

        const validation = await validateAll(request.all(), {
          name: 'string|min:3|required_without_all:shift,active',
          shift: 'string|in:Manhã,Tarde,Noite|required_without_all:name,active',
          active: 'boolean|required_without_all:name,shift'
        }, errorMessages)

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
          message: 'Disciplina atualizada com sucesso'
        })
      }
    }
    return response.status(403).send({
      error: 'Permissão negada',
      message: 'Você não tem permissão para alterar este registro'
    })
  }
}

module.exports = SubjectController
