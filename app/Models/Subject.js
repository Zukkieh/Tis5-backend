'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Subject extends Model {

    course() {
        return this.belongsTo('App/Models/Course')
    }
}

module.exports = Subject
