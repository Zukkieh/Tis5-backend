'use strict'

/*
|--------------------------------------------------------------------------
| Factory
|--------------------------------------------------------------------------
|
| Factories are used to define blueprints for database tables or Lucid
| models. Later you can use these blueprints to seed your database
| with dummy data.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

Factory.blueprint('App/Models/User', () => {
    return {
        person_code: 0,
        name: 'SGM Manager',
        email: 'admin@sgm.com.br',
        password: 'gLm2020tIs5sGm',
        type: null
    }
})
