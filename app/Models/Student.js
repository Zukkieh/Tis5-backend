'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Student extends Model {

    user() {
        return this.belongsTo('App/Models/User')
    }

    course() {
        return this.belongsTo('App/Models/Course')
    }

    monitoring() {
        return this.hasMany('App/Models/Monitor')
    }

    requests() {
        return this.hasMany('App/Models/Request')
    }
}

module.exports = Student
