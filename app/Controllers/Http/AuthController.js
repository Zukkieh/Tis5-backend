'use strict'

const Hash = use('Hash')
const { validateAll } = use('Validator')

const User = use('App/Models/User')

class AuthController {

    async authenticate({ request, response, auth }) {

        const errorMessages = {
            'person_code.required': 'O código de pessoa é obrigatório',
            'password.required': 'A senha é obrigatória'
        }

        const validation = await validateAll(request.all(), {
            person_code: 'required|string',
            password: 'required|string'
        }, errorMessages)

        if (validation.fails())
            return response.status(400).send({
                errors: validation.messages()
            })

        const { person_code, password } = request.all()

        const { token } = await auth.attempt(person_code, password)

        const user = await User.query()
            .where('person_code', person_code)
            .first()

        if (user.deleted)
            return response.status(401).send({
                error: 'Permissão negada',
                message: 'Este usuário foi excluído'
            })

        let data

        if (user.type == 'Coordenador(a)')
            data = await user.coordinator().with('course').fetch()

        else if (user.type == 'Aluno(a)')
            data = await user.student().with('course')
                .with('monitoring', monitor => {
                    monitor.select(['id', 'workload', 'semester', 'subject_id', 'student_id'])
                        .where('deleted', false)
                }).fetch()

        return response.status(200).send({
            token,
            user_type: user.type,
            data: {
                person_code: user.person_code,
                email: user.email,
                name: user.name,
                ...(data && data.$attributes),
                ...(data && data.$relations)
            }
        })
    }

    async update({ params, request, response, auth }) {

        const errorMessages = {
            'password.required': 'As senhas são obrigatórias',
            'password.old.required': 'A senha atual é obrigatória',
            'password.new.required': 'A nova senha é obrigatória',
            'password.new.different': 'A nova senha deve ser diferente da atual',
            'password.old.min': 'A senha atual possui no mínimo 6 caracteres',
            'password.new.min': 'A nova senha deve possuir no mínimo 6 caracteres'
        }

        const validation = await validateAll(request.all(), {
            password: 'required|object',
            'password.old': 'required|string|min:6',
            'password.new': 'required|string|min:6|different:password.old',
        }, errorMessages)

        if (validation.fails())
            return response.status(400).send({
                errors: validation.messages()
            })

        const { password } = request.all()

        if (auth.user.id == params.user_id) {

            const user = await User.query()
                .where('id', params.user_id)
                .first()

            const isSame = await Hash.verify(password.old, user.password)

            if (!isSame)
                return response.status(400).send({
                    error: 'Senha inválida',
                    message: 'A senha atual está incorreta'
                })

            user.password = password.new
            await user.save()

            return response.status(200).send({
                success: true,
                message: 'Usuário atualizado com sucesso'
            })

        } else
            return response.status(403).send({
                error: 'Permissão negada',
                message: 'Você não tem permissão para alterar este registro'
            })
    }
}

module.exports = AuthController
