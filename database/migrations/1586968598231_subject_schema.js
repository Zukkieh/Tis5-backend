'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubjectSchema extends Schema {
  up() {
    this.create('subjects', (table) => {
      table.increments()
      table.string('name', 254).notNullable()
      table.enu('shift', ['Manhã', 'Tarde', 'Noite'],
        { useNative: true, enumName: 'subject_shift' }).notNullable()
      table.boolean('active').defaultTo(true)
      table.integer('course_id').unsigned().notNullable()
        .references('id').inTable('courses')
        .onUpdate('CASCADE').onDelete('CASCADE')
      table.timestamps()
    })
  }

  down() {
    this.drop('subjects')
  }
}

module.exports = SubjectSchema
