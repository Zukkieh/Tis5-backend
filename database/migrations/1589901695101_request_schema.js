'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RequestSchema extends Schema {
  up() {
    this.create('requests', (table) => {
      table.increments()
      table.string('message', 254)
      table.string('response', 254)
      table.enu('status', ['Pendente', 'Confirmada', 'Recusada'],
        { useNative: true, enumName: 'request_status' }).notNullable()
      table.integer('student_id').unsigned().notNullable()
        .references('id').inTable('students')
        .onUpdate('CASCADE').onDelete('CASCADE')
      table.integer('monitor_id').unsigned().notNullable()
        .references('id').inTable('monitors')
        .onUpdate('CASCADE').onDelete('CASCADE')
      table.integer('schedule_id').unsigned().notNullable()
        .references('id').inTable('schedules')
        .onUpdate('CASCADE').onDelete('SET NULL')
      table.timestamps()
    })
  }

  down() {
    this.drop('requests')
  }
}

module.exports = RequestSchema
