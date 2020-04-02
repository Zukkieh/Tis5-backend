'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CoordinatorSchema extends Schema {
  up() {
    this.create('coordinators', (table) => {
      table.increments()
      table.integer('user_id').unsigned().notNullable()
        .references('id').inTable('users')
        .onUpdate('CASCADE').onDelete('CASCADE')
      table.timestamps()
    })
  }

  down() {
    this.drop('coordinators')
  }
}

module.exports = CoordinatorSchema
