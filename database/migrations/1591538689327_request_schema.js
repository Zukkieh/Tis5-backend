'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RequestSchema extends Schema {
  up() {
    this.alter('requests', (table) => {
      table.enu('attendance', ['Pendente', 'Concluído', 'Cancelado'],
        { useNative: true, enumName: 'request_attendance' })
    })
  }

  down() {
    this.alter('requests', (table) => {
      table.dropColumn('attendance')
    })
  }
}

module.exports = RequestSchema
