'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Monitor extends Model {

    student() {
        return this.belongsTo('App/Models/Student')
    }

    subject() {
        return this.belongsTo('App/Models/Subject')
    }

    schedules() {
        return this.hasMany('App/Models/Schedule')
    }
}

module.exports = Monitor
