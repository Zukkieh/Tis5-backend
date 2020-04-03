'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.post('/student', 'StudentController.store').as('student.store')
Route.post('/login', 'AuthController.login').as('auth.login')

Route.group(() => {
  Route.resource('coordinator', 'CoordinatorController').apiOnly().except(['destroy'])
  Route.resource('student', 'StudentController').apiOnly().except(['destroy', 'store'])
  Route.resource('user', 'UserController').only(['update', 'destroy'])
  Route.get('user/:person_code', 'UserController.show').as('user.show')
}).middleware('auth')
