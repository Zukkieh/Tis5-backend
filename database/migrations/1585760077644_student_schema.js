'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StudentSchema extends Schema {
  up() {
    this.create('students', (table) => {
      table.increments()
      table.integer('registration').notNullable().unique()
      table.string('phone', 30).notNullable().unique()
      table.boolean('is_monitor').defaultTo(false)
      table.integer('user_id').unsigned().notNullable()
        .references('id').inTable('users')
        .onUpdate('CASCADE').onDelete('CASCADE')
      // table.integer('course_id').unsigned().notNullable()
      //   .references('id').inTable('courses')
      //   .onUpdate('CASCADE').onDelete('CASCADE')
      table.timestamps()
    })
  }

  down() {
    this.drop('students')
  }
}

module.exports = StudentSchema
