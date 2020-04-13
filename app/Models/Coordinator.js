'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Coordinator extends Model {

    user() {
        return this.belongsTo('App/Models/User')
    }

    course() {
        return this.hasOne('App/Models/Course')
    }
}

module.exports = Coordinator
