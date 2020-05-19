'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Request extends Model {

    student() {
        return this.belongsTo('App/Models/Student')
    }

    monitor() {
        return this.belongsTo('App/Models/Monitor')
    }

    schedule() {
        return this.belongsTo('App/Models/Schedule')
    }
}

module.exports = Request
