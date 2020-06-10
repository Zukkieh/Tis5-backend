'use strict'

const Course = use('App/Models/Course')
const Monitor = use('App/Models/Monitor')

const COORD = 'Coordenador(a)'

class ReportController {

    async course({ params, response, auth }) {

        const course = await Course.find(params.course_id)

        if (!course) {
            return response.status(404).send({
                error: 'Curso não encontrado'
            })
        }

        const authCoordinator = await auth.user.coordinator().fetch()

        if (!auth.user.type ||
            (auth.user.type == COORD && course.coordinator_id == authCoordinator.id)) {

            const report = await Course.query()
                .select(['id', 'name', 'campus', 'coordinator_id'])
                .with('coordinator', c => {
                    c.select(['id', 'user_id'])
                    c.with('user', u => u.select(['id', 'person_code', 'name', 'email']))
                })
                .with('subjects', s => {
                    s.where('active', true)
                    s.select(['id', 'name', 'shift', 'course_id'])
                    s.with('monitors', m => {
                        m.where('deleted', false)
                        m.select(['id', 'workload', 'student_id', 'subject_id'])
                        m.with('student', s => {
                            s.select(['id', 'registration', 'phone', 'user_id'])
                            s.with('user', u => u.select(['id', 'person_code', 'name', 'email']))
                        })
                        m.withCount('requests as total_requests')
                        m.withCount('requests as pending_requests', r => r.where('status', 'Pendente'))
                        m.withCount('requests as confirmed_requests', r => r.where('status', 'Confirmada'))
                        m.withCount('requests as denied_requests', r => r.where('status', 'Recusada'))
                        m.withCount('requests as total_attendances', r => r.where('status', 'Confirmada'))
                        m.withCount('requests as pending_attendances', r => r.where('attendance', 'Pendente'))
                        m.withCount('requests as completed_attendances', r => r.where('attendance', 'Concluído'))
                        m.withCount('requests as canceled_attendances', r => r.where('attendance', 'Cancelado'))
                    })
                })
                .where('id', params.course_id)
                .first()

            return response.status(200).send(report)
        }
        return response.status(403).send({
            error: 'Permissão negada',
            message: 'Você não tem permissão para acessar estes dados'
        })

    }

    async monitor({ params, response, auth }) {

        const monitor = await Monitor.find(params.monitor_id)

        if (!monitor || monitor.deleted) {
            return response.status(404).send({
                error: 'Monitor não encontrado'
            })
        }

        const mon_student = await monitor.student().with('course').fetch()
        const student = mon_student.toJSON()

        const authCoordinator = await auth.user.coordinator().fetch()

        if (!auth.user.type ||
            (auth.user.type == COORD && student.course.coordinator_id == authCoordinator.id)) {

            const report = await Monitor.query()
                .select(['id', 'workload', 'student_id', 'subject_id'])
                .with('student', s => {
                    s.select(['id', 'registration', 'phone', 'user_id', 'course_id'])
                    s.with('user', u => u.select(['id', 'person_code', 'name', 'email']))
                    s.with('course', c => {
                        c.select(['id', 'name', 'campus', 'coordinator_id'])
                        c.with('coordinator', coord => {
                            coord.select(['id', 'user_id'])
                            coord.with('user', u => u.select(['id', 'person_code', 'name']))
                        })
                    })
                })
                .with('subject', s => s.select(['id', 'name', 'shift', 'active']))
                .withCount('requests as total_requests')
                .withCount('requests as pending_requests', r => r.where('status', 'Pendente'))
                .withCount('requests as confirmed_requests', r => r.where('status', 'Confirmada'))
                .withCount('requests as denied_requests', r => r.where('status', 'Recusada'))
                .withCount('requests as total_attendances', r => r.where('status', 'Confirmada'))
                .withCount('requests as pending_attendances', r => r.where('attendance', 'Pendente'))
                .withCount('requests as completed_attendances', r => r.where('attendance', 'Concluído'))
                .withCount('requests as canceled_attendances', r => r.where('attendance', 'Cancelado'))
                .where('id', params.monitor_id)
                .first()

            return response.status(200).send(report)
        }
        return response.status(403).send({
            error: 'Permissão negada',
            message: 'Você não tem permissão para acessar estes dados'
        })

    }
}

module.exports = ReportController
