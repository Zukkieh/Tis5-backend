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
                    error: 'User not found'
                })

            return response.status(200).send(user)

        } else
            return response.status(403).send({
                error: 'Permision denied',
                message: 'you are not allowed to access this data'
            })
    }

    async update({ params, request, response, auth }) {

        if (!auth.user.type) {

            const validation = await validateAll(request.all(), {
                name: 'string|min:3|required_without_all:password,type',
                password: 'string|min:6|required_without_all:name,type',
                type: 'string|in:Aluno(a),Coordenador(a)|required_without_all:name,password'
            })

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
                message: 'User updated successfully'
            })

        } else
            return response.status(403).send({
                error: 'Permision denied',
                message: 'You are not allowed to change this record'
            })
    }

    async destroy({ params, response, auth }) {

        if (!auth.user.type) {

            const user = await User.query()
                .where('id', params.id)
                .first()

            if (!user)
                return response.status(404).send({
                    error: 'User not found'
                })

            if (user.deleted)
                return response.status(400).send({
                    error: 'This user has already been deleted'
                })

            user.deleted = true
            await user.save()

            return response.status(204).end()

        } else
            return response.status(403).send({
                error: 'Permision denied',
                message: 'You are not allowed to delete this record'
            })
    }
}

module.exports = UserController
