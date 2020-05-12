'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ScheduleSchema extends Schema {
  up() {
    this.create('schedules', (table) => {
      table.increments()
      table.time('start').notNullable()
      table.time('end').notNullable()
      table.time('duration').notNullable()
      table.enu('day', ['Segunda-feira', 'Terça-feira',
        'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
        { useNative: true, enumName: 'schedule_day' }).notNullable()
      table.integer('monitor_id').unsigned().notNullable()
        .references('id').inTable('monitors')
        .onUpdate('CASCADE').onDelete('CASCADE')
      table.timestamps()
    })
  }

  down() {
    this.drop('schedules')
  }
}

module.exports = ScheduleSchema
