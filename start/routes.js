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

Route.get('enum/user/type', 'EnumController.user_type').as('enum.user_type')
Route.get('enum/course/campus', 'EnumController.course_campus').as('enum.course_campus')
Route.get('enum/subject/shift', 'EnumController.subject_shift').as('enum.subject_shift')
Route.get('enum/schedule/day', 'EnumController.schedule_day').as('enum.schedule_day')
Route.get('course', 'CourseController.index').as('course.index')
Route.post('student', 'StudentController.store').as('student.store')
Route.post('auth', 'AuthController.authenticate').as('auth.authenticate')

Route.group(() => {
  Route.patch('auth/:user_id', 'AuthController.update').as('auth.update')
  Route.resource('coordinator', 'CoordinatorController').apiOnly().except(['destroy', 'update'])
  Route.resource('student', 'StudentController').only(['show', 'update'])
  Route.get('course/:course_id/student', 'StudentController.index').as('student.index')
  Route.resource('user', 'UserController').only(['update', 'destroy'])
  Route.get('user/:person_code', 'UserController.show').as('user.show')
  Route.resource('course', 'CourseController').apiOnly().except(['index', 'destroy'])
  Route.resource('subject', 'SubjectController').apiOnly().except(['index', 'destroy'])
  Route.get('course/:course_id/subject', 'SubjectController.index').as('subject.index')
  Route.resource('monitor', 'MonitorController').only(['store', 'show', 'destroy'])
  Route.get('subject/:subject_id/monitor', 'MonitorController.index').as('monitor.index')
  Route.get('student/:student_id/monitor', 'MonitorController._index').as('monitor._index')
  Route.get('search/coordinator', 'SearchController.coordinator').as('search.coordinator')
  Route.get('monitor/:monitor_id/schedule', 'ScheduleController.index').as('schedule.index')
  Route.post('monitor/:monitor_id/schedule', 'ScheduleController.store').as('schedule.store')
  Route.delete('schedule/:id', 'ScheduleController.destroy').as('schedule.destroy')
  Route.get('student/:student_id/request', 'RequestController.index').as('request.index')
  Route.get('monitor/:monitor_id/request', 'RequestController._index').as('request._index')
  Route.get('request/:id', 'RequestController.show').as('request.show')
  Route.get('monitor/:monitor_id/attendance', 'AttendanceController.index').as('attendance.index')
  Route.patch('request/:request_id/attendance', 'AttendanceController.update').as('attendance.update')
  Route.get('course/:course_id/report', 'ReportController.index').as('report.index')
}).middleware('auth')
