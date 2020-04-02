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

Route.get('/', () => {
  return { name: 'SGM API', type: 'REST API', version: 'v0.1.0' }
})

Route.post('/student', 'StudentController.store')
Route.post('/login', 'AuthController.login')

Route.group(() => {
  Route.resource('coordinator', 'CoordinatorController').apiOnly().except(['delete'])
  Route.resource('student', 'StudentController').apiOnly().except(['delete', 'store'])
  Route.get('user/:person_code', 'UserController.show')
  Route.patch('user/:id', 'UserController.update')
  Route.delete('user/:id', 'UserController.destroy')
}).middleware('auth')
