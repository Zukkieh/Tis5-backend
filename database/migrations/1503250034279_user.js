'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up() {
    this.create('users', (table) => {
      table.bigInteger('person_code').primary()
      table.string('name', 254).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password', 60).notNullable()
      table.enu('type', ['Aluno(a)', 'Coordenador(a)'], { useNative: true, enumName: 'user_type' }).notNullable()
      table.boolean('deleted').defaultTo(false)
      table.timestamps()
    })
  }

  down() {
    this.drop('users')
  }
}

module.exports = UserSchema
