'use strict'

const Database = use('Database')
const { validateAll } = use('Validator')

const User = use('App/Models/User')
const Student = use('App/Models/Student')

const TYPE_VALUE = 'Aluno(a)'

class StudentController {

  async index({ response }) {

    const students = await Database
      .select([
        'students.id',
        'students.user_id',
        // 'students.course_id',
        'students.registration',
        'students.phone',
        'students.is_monitor',
        'users.person_code',
        'users.name',
        'users.email'
      ])
      .from('students')
      .innerJoin('users', 'users.id', 'students.user_id')
      .where('users.deleted', false)
      .where('users.type', TYPE_VALUE)

    return response.status(200).send(students)
  }

  async store({ request, response }) {

    const validation = await validateAll(request.all(), {
      person_code: 'required|unique:users',
      name: 'required|min:3',
      email: 'required|email|unique:users',
      password: 'required|min:6',
      registration: 'required|unique:students',
      phone: 'required|min:11|unique:students'
    })

    if (validation.fails())
      return response.status(400).send({ errors: validation.messages() })

    const userData = request.only(['person_code', 'name', 'email', 'password'])
    const studentData = request.only(['registration', 'phone'])

    const user = await User.create({ ...userData, type: TYPE_VALUE })
    const student = await Student.create({ ...studentData, user_id: user.id })

    return response.status(201).send(student)
  }

  async show({ params, response }) {

    const student = await Database
      .select([
        'students.id',
        'students.user_id',
        // 'students.course_id',
        'students.registration',
        'students.phone',
        'students.is_monitor',
        'users.person_code',
        'users.name',
        'users.email'
      ])
      .from('students')
      .innerJoin('users', 'users.id', 'students.user_id')
      .where('students.id', params.id)
      .where('users.deleted', false)
      .where('users.type', TYPE_VALUE)

    if (!student)
      return response.status(404).send({
        error: 'Student not found'
      })

    return response.status(200).send(student)
  }

  async update({ params, request, response, auth }) {

    if (!auth.user.type || auth.user.type == TYPE_VALUE) {

      const student = await Student.query()
        .where('id', params.id)
        .first()

      if (!student)
        return response.status(404).send({
          error: 'Student not found'
        })

      if (!auth.user.type || auth.user.id == student.user_id) {

        const validation = await validateAll(request.all(), {
          phone: 'string|min:11|required'
        })

        if (validation.fails())
          return response.status(400).send({
            errors: validation.messages()
          })

        const { phone } = request.all()

        student.phone = phone

        await student.save()

        return response.status(200).send({
          success: true,
          message: 'Student updated successfully'
        })
      }
    }
    return response.status(401).send({
      error: 'Permision denied',
      message: 'You are not allowed to change this record'
    })
  }
}

module.exports = StudentController
