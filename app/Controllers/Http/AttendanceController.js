'use strict'

const { validateAll } = use('Validator')

const Request = use('App/Models/Request')
const Monitor = use('App/Models/Monitor')
const RequestService = use('App/Services/RequestService')

const ALN = 'Aluno(a)'

class AttendanceController {

    async index({ params, response, auth }) {

        const monitor = await Monitor.find(params.monitor_id)

        if (!monitor)
            return response.status(404).send({
                error: 'Monitor não encontrado'
            })

        const mon_student = await monitor.student().fetch()

        if (auth.user.id == mon_student.user_id) {

            const attendances = await RequestService.findAttendances(monitor.id)

            return response.status(200).send(attendances)
        }
        return response.status(403).send({
            error: 'Permissão negada',
            message: 'Você não tem permissão para acessar estes dados'
        })
    }

    async update({ params, request, response, auth }) {

        if (auth.user.type == ALN) {

            const errorMessages = {
                'happened.required': 'O status de conclusão é obrigatório'
            }

            const validation = await validateAll(request.all(), {
                happened: 'required|boolean'
            }, errorMessages)

            if (validation.fails())
                return response.status(400).send({
                    errors: validation.messages()
                })

            const oldRequest = await Request.find(params.request_id)

            if (!oldRequest)
                return response.status(404).send({
                    error: 'Solicitação não encontrada'
                })

            const req_monitor = await oldRequest.monitor().fetch()
            const mon_student = await req_monitor.student().fetch()

            if (mon_student.user_id == auth.user.id) {

                if (oldRequest.status != 'Confirmada')
                    return response.status(400).send({
                        error: 'Este agendamento não existe'
                    })

                if (oldRequest.attendance != 'Pendente')
                    return response.status(400).send({
                        error: `Este atendimento já foi ${oldRequest.attendance}`
                    })

                const { happened } = request.all()

                oldRequest.attendance = happened ? 'Concluído' : 'Cancelado'

                await oldRequest.save()

                const data = await RequestService.findOne('id', oldRequest.id)

                return response.status(200).send(data)
            }
        }
        return response.status(403).send({
            error: 'Permissão negada',
            message: 'Você não tem permissão para alterar este atendimento'
        })
    }
}

module.exports = AttendanceController
