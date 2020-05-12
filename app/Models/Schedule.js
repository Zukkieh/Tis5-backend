'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Schedule extends Model {

    monitor() {
        return this.belongsTo('App/Models/Monitor')
    }
}

module.exports = Schedule
