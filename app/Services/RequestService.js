'use strict'

const { validateAll } = use('Validator')

const Request = use('App/Models/Request')
const Schedule = use('App/Models/Schedule')
const User = use('App//Models/User')

const ALN = 'Aluno(a)'

function findOne(field, value) {

    return Request.query()
        .with('student', s => {
            s.select(['id', 'phone', 'user_id'])
            s.with('user', u => {
                u.select(['id', 'name', 'socket_id'])
            })
        })
        .with('monitor', m => {
            m.select(['id', 'student_id', 'subject_id'])
            m.with('student', s => {
                s.select(['id', 'phone', 'user_id'])
                s.with('user', u => {
                    u.select(['id', 'name', 'socket_id'])
                })
            })
            m.with('subject', s => {
                s.select(['id', 'name', 'shift'])
            })
        })
        .with('schedule', s => {
            s.select(['id', 'day', 'start', 'end'])
        })
        .where(field, value)
        .first()
}

function findAll(field, value) {

    return Request.query()
        .with('student', s => {
            s.select(['id', 'phone', 'user_id'])
            s.with('user', u => {
                u.select(['id', 'name'])
            })
        })
        .with('monitor', m => {
            m.select(['id', 'student_id', 'subject_id'])
            m.with('student', s => {
                s.select(['id', 'phone', 'user_id'])
                s.with('user', u => {
                    u.select(['id', 'name'])
                })
            })
            m.with('subject', s => {
                s.select(['id', 'name', 'shift'])
            })
        })
        .with('schedule', s => {
            s.select(['id', 'day', 'start', 'end'])
        })
        .where(field, value)
        .fetch()
}

function findAttendances(monitorId) {

    return Request.query()
        .with('student', s => {
            s.select(['id', 'phone', 'user_id'])
            s.with('user', u => {
                u.select(['id', 'name'])
            })
        })
        .with('monitor', m => {
            m.select(['id', 'student_id', 'subject_id'])
            m.with('student', s => {
                s.select(['id', 'phone', 'user_id'])
                s.with('user', u => {
                    u.select(['id', 'name'])
                })
            })
            m.with('subject', s => {
                s.select(['id', 'name', 'shift'])
            })
        })
        .with('schedule', s => {
            s.select(['id', 'day', 'start', 'end'])
        })
        .where('monitor_id', monitorId)
        .where('status', 'Confirmada')
        .fetch()
}

async function create(auth, request) {

    if (auth.user.type == ALN) {

        const errorMessages = {
            'schedule_id.required': 'O ID do horário é obrigatório'
        }

        const validation = await validateAll(request, {
            schedule_id: 'required|integer|above:0',
            message: 'string'
        }, errorMessages)

        if (validation.fails())
            return {
                success: false,
                event: 'error',
                data: {
                    errors: validation.messages()
                }
            }

        const { schedule_id, message } = request

        const schedule = await Schedule.find(schedule_id)

        if (!schedule)
            return {
                success: false,
                event: 'error',
                data: {
                    error: 'Horário não encontrado'
                }
            }

        const monitor = await schedule.monitor().fetch()

        if (monitor.deleted)
            return {
                success: false,
                event: 'error',
                data: {
                    error: 'Monitor não encontrado'
                }
            }

        const authUser = await User.find(auth.user.id)
        const authStudent = await authUser.student().fetch()

        if (monitor.student_id == authStudent.id)
            return {
                success: false,
                event: 'error',
                data: {
                    error: 'Solicitação inválida'
                }
            }

        const alreadyExists = await Request.query()
            .where('status', 'Pendente')
            .where('student_id', authStudent.id)
            .where('monitor_id', schedule.monitor_id)
            .where('schedule_id', schedule_id)
            .first()

        if (alreadyExists)
            return {
                success: false,
                event: 'error',
                data: {
                    error: 'Solicitação Pendente',
                    message: 'Esta solicitação já foi criada e está aguardando uma resposta'
                }
            }

        const newRequest = await Request.create({
            message,
            status: 'Pendente',
            schedule_id,
            student_id: authStudent.id,
            monitor_id: schedule.monitor_id
        })

        const data = await findOne('id', newRequest.id)

        const dataJSON = data.toJSON()

        const recipient = dataJSON.monitor.student.user.socket_id

        return {
            success: true,
            event: 'request',
            recipient,
            data
        }
    }
    return {
        success: false,
        event: 'error',
        data: {
            error: 'Permissão negada',
            message: 'Você não tem permissão para criar novas solicitações'
        }
    }
}

async function update(auth, response) {

    if (auth.user.type == ALN) {

        const errorMessages = {
            'request_id.required': 'O ID da solicitação é obrigatório',
            'confirmed.required': 'O status de confirmação é obrigatório'
        }

        const validation = await validateAll(response, {
            request_id: 'required|integer|above:0',
            confirmed: 'required|boolean',
            message: 'string'
        }, errorMessages)

        if (validation.fails())
            return {
                success: false,
                event: 'error',
                data: {
                    errors: validation.messages()
                }
            }

        const oldRequest = await Request.find(response.request_id)

        if (!oldRequest)
            return {
                success: false,
                event: 'error',
                data: {
                    error: 'Solicitação não encontrada'
                }
            }

        const req_monitor = await oldRequest.monitor().fetch()
        const mon_student = await req_monitor.student().fetch()

        if (mon_student.user_id == auth.user.id) {

            if (oldRequest.status != 'Pendente')
                return {
                    success: false,
                    event: 'error',
                    data: {
                        error: 'Solicitação Respondida',
                        message: `Esta solicitação já foi ${oldRequest.status}`
                    }
                }

            const { confirmed, message } = response

            oldRequest.response = message
            oldRequest.status = confirmed ? 'Confirmada' : 'Recusada'

            if (confirmed)
                oldRequest.attendance = 'Pendente'

            await oldRequest.save()

            const data = await findOne('id', oldRequest.id)

            const dataJSON = data.toJSON()

            const recipient = dataJSON.student.user.socket_id

            return {
                success: true,
                event: 'response',
                recipient,
                data
            }
        }
    }
    return {
        success: false,
        event: 'error',
        data: {
            error: 'Permissão negada',
            message: 'Você não tem permissão para alterar esta solicitação'
        }
    }
}

async function destroy(auth, requestId) {

    if (auth.user.type == ALN) {

        const authUser = await User.find(auth.user.id)
        const authStudent = await authUser.student().fetch()

        const oldRequest = await findOne('id', requestId)

        if (!oldRequest)
            return {
                success: false,
                event: 'error',
                data: {
                    error: 'Solicitação não encontrada'
                }
            }

        if (oldRequest.student_id == authStudent.id) {

            if (oldRequest.status != 'Pendente')
                return {
                    success: false,
                    event: 'error',
                    data: {
                        error: 'Não é possível excluir esta solicitação',
                        message: 'Esta solicitação já foi respondida'
                    }
                }

            await oldRequest.delete()

            const dataJSON = oldRequest.toJSON()

            const recipient = dataJSON.monitor.student.user.socket_id

            return {
                success: true,
                event: 'delete',
                recipient,
                data: oldRequest.id
            }
        }
    }
    return {
        success: false,
        event: 'error',
        data: {
            error: 'Permissão negada',
            message: 'Você não tem permissão para excluir esta solicitação'
        }
    }
}

module.exports = {
    findOne,
    findAll,
    findAttendances,
    create,
    update,
    destroy
}
