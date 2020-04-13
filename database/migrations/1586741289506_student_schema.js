'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StudentSchema extends Schema {
  up() {
    this.alter('students', (table) => {
      table.integer('course_id').unsigned().notNullable()
        .references('id').inTable('courses')
        .onUpdate('CASCADE').onDelete('CASCADE')
    })
  }

  down() {
    this.alter('students', (table) => {
      table.dropColumn('course_id')
    })
  }
}

module.exports = StudentSchema
