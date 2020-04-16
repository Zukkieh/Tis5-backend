'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Course extends Model {

    coordinator() {
        return this.belongsTo('App/Models/Coordinator')
    }

    students() {
        return this.hasMany('App/Models/Student')
    }

    subjects() {
        return this.hasMany('App/Models/Subject')
    }
}

module.exports = Course
