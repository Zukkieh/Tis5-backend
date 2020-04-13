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

Route.get('course', 'CourseController.index').as('course.index')
Route.post('student', 'StudentController.store').as('student.store')
Route.post('auth', 'AuthController.authenticate').as('auth.authenticate')

Route.group(() => {
  Route.patch('auth/:user_id', 'AuthController.update').as('auth.update')
  Route.resource('coordinator', 'CoordinatorController').apiOnly().except(['destroy', 'update'])
  Route.resource('student', 'StudentController').apiOnly().except(['destroy', 'store'])
  Route.resource('user', 'UserController').only(['update', 'destroy'])
  Route.get('user/:person_code', 'UserController.show').as('user.show')
  Route.resource('course', 'CourseController').apiOnly().except(['index', 'destroy'])
}).middleware('auth')
