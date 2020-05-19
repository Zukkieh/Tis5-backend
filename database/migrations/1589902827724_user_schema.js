'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up() {
    this.alter('users', (table) => {
      table.string('socket_id', 254)
    })
  }

  down() {
    this.alter('users', (table) => {
      table.dropColumn('socket_id')
    })
  }
}

module.exports = UserSchema
