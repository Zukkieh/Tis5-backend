'use strict'

const Database = use('Database')
const { validateAll } = use('Validator')

const User = use('App/Models/User')
const Student = use('App/Models/Student')
const Course = use('App/Models/Course')

const TYPE_VALUE = 'Aluno(a)'

class StudentController {

  async index({ params, request, response }) {

    const { page = 1, limit = 10 } = request.get()

    const students = await Database
      .select([
        'students.id',
        'students.user_id',
        'students.course_id',
        'students.registration',
        'students.phone',
        'students.is_monitor',
        'users.person_code',
        'users.name',
        'users.email'
      ])
      .from('students')
      .innerJoin('users', 'users.id', 'students.user_id')
      .where('students.course_id', params.course_id)
      .where('users.deleted', false)
      .where('users.type', TYPE_VALUE)
      .paginate(page, limit)

    return response.status(200).send(students)
  }

  async store({ request, response }) {

    const validation = await validateAll(request.all(), {
      person_code: 'required|unique:users',
      name: 'required|min:3',
      email: 'required|email|unique:users',
      password: 'required|min:6',
      registration: 'required|unique:students',
      phone: 'required|min:11|unique:students',
      course_id: 'required|integer|not_equals:0'
    })

    if (validation.fails())
      return response.status(400).send({
        errors: validation.messages()
      })

    const { course_id } = request.all()
    const courseExists = await Course.findBy('id', course_id)

    if (courseExists) {

      const userData = request.only(['person_code', 'name', 'email', 'password'])
      const studentData = request.only(['registration', 'phone'])

      const user = await User.create({ ...userData, type: TYPE_VALUE })
      const student = await Student.create({ ...studentData, course_id, user_id: user.id })

      return response.status(201).send(student)

    } else
      return response.status(404).send({
        error: 'Course not found'
      })
  }

  async show({ params, response }) {

    const student = await Database
      .select([
        'students.id',
        'students.user_id',
        'students.course_id',
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
      .first()

    if (!student)
      return response.status(404).send({
        error: 'Student not found'
      })

    return response.status(200).send(student)
  }

  async update({ params, request, response, auth }) {

    const student = await Student.query()
      .where('id', params.id)
      .first()

    if (!student)
      return response.status(404).send({
        error: 'Student not found'
      })

    if (!auth.user.type || auth.user.id == student.user_id) {

      const validation = await validateAll(request.all(), {
        phone: 'string|min:11|required_without_all:course_id',
        course_id: 'integer|not_equals:0'
      })

      if (validation.fails())
        return response.status(400).send({
          errors: validation.messages()
        })

      const { phone, course_id } = request.all()

      if (phone)
        student.phone = phone

      if (course_id) {

        if (!auth.user.type) {

          const courseExists = await Course.findBy('id', course_id)

          if (courseExists)
            student.course_id = course_id

          else
            return response.status(404).send({
              error: 'Course not found'
            })

        } else
          return response.status(403).send({
            error: 'Permision denied',
            message: 'You are not allowed to change this registry data',
            field: 'course_id'
          })
      }

      await student.save()

      return response.status(200).send({
        success: true,
        message: 'Student updated successfully'
      })
    }
    return response.status(403).send({
      error: 'Permision denied',
      message: 'You are not allowed to change this record'
    })
  }
}

module.exports = StudentController
