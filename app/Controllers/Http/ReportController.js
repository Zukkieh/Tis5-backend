'use strict'

const Course = use('App/Models/Course')

const COORD = 'Coordenador(a)'

class ReportController {

    async index({ params, response, auth }) {

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
                    c.with('user', u => {
                        u.where('deleted', false)
                        u.select(['id', 'person_code', 'name', 'email'])
                    })
                })
                .with('subjects', s => {
                    s.where('active', true)
                    s.select(['id', 'name', 'shift', 'course_id'])
                    s.with('monitors', m => {
                        m.where('deleted', false)
                        m.select(['id', 'workload', 'student_id', 'subject_id'])
                        m.with('student', s => {
                            s.select(['id', 'registration', 'phone', 'user_id'])
                            s.with('user', u => {
                                u.where('deleted', false)
                                u.select(['id', 'person_code', 'name', 'email'])
                            })
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
                .fetch()

            return response.status(200).send(report)
        }
        return response.status(403).send({
            error: 'Permissão negada',
            message: 'Você não tem permissão para acessar estes dados'
        })

    }
}

module.exports = ReportController
