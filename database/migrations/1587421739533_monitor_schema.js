'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MonitorSchema extends Schema {
  up() {
    this.create('monitors', (table) => {
      table.increments()
      table.integer('workload').notNullable()
      table.integer('semester').notNullable()
      table.boolean('deleted').defaultTo(false)
      table.integer('student_id').unsigned().notNullable()
        .references('id').inTable('students')
        .onUpdate('CASCADE').onDelete('CASCADE')
      table.integer('subject_id').unsigned().notNullable()
        .references('id').inTable('subjects')
        .onUpdate('CASCADE').onDelete('CASCADE')
      table.timestamps()
    })
  }

  down() {
    this.drop('monitors')
  }
}

module.exports = MonitorSchema
