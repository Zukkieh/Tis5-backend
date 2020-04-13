'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CourseSchema extends Schema {
  up() {
    this.create('courses', (table) => {
      table.increments()
      table.string('name', 254).notNullable()
      table.enu('campus', ['Praça da Liberdade'], { useNative: true, enumName: 'course_campus' }).notNullable()
      table.integer('coordinator_id').unsigned()
        .references('id').inTable('coordinators')
        .onUpdate('CASCADE').onDelete('NO ACTION')
      table.timestamps()
    })
  }

  down() {
    this.drop('courses')
  }
}

module.exports = CourseSchema
