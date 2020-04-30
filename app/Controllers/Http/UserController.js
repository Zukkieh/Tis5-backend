'use strict'

const { validateAll } = use('Validator')

const User = use('App/Models/User')

class UserController {

    async show({ params, response, auth }) {

        if (!auth.user.type) {

            const user = await User.query()
                .select([
                    'id',
                    'person_code',
                    'name',
                    'email',
                    'type',
                    'deleted'
                ])
                .where('person_code', params.person_code)
                .first()

            if (!user)
                return response.status(404).send({
                    error: 'Usuário não encontrado'
                })

            return response.status(200).send(user)

        } else
            return response.status(403).send({
                error: 'Permissão negada',
                message: 'Você não tem permissão para acessar estes dados'
            })
    }

    async update({ params, request, response, auth }) {

        if (!auth.user.type) {

            const errorMessages = {
                'name.min': 'O nome deve possuir no mínimo 3 caracteres',
                'password.min': 'A senha deve possuir no mínimo 6 caracteres',
                'type.in': 'Tipo de usuário inválido'
            }

            const validation = await validateAll(request.all(), {
                name: 'string|min:3|required_without_all:password,type',
                password: 'string|min:6|required_without_all:name,type',
                type: 'string|in:Aluno(a),Coordenador(a)|required_without_all:name,password'
            }, errorMessages)

            if (validation.fails())
                return response.status(400).send({
                    errors: validation.messages()
                })

            const { name, password, type } = request.all()

            const user = await User.query()
                .where('id', params.id)
                .first()

            if (name)
                user.name = name
            if (password)
                user.password = password
            if (type)
                user.type = type

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

    async destroy({ params, response, auth }) {

        if (!auth.user.type) {

            const user = await User.query()
                .where('id', params.id)
                .first()

            if (!user)
                return response.status(404).send({
                    error: 'Usuário não encontrado'
                })

            if (user.deleted)
                return response.status(400).send({
                    error: 'Este usuário já foi excluído'
                })

            user.deleted = true
            await user.save()

            return response.status(204).end()

        } else
            return response.status(403).send({
                error: 'Permissão negada',
                message: 'Você não tem permissão para excluir este registro'
            })
    }
}

module.exports = UserController
