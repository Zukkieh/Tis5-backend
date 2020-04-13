'use strict'

const Hash = use('Hash')
const { validateAll } = use('Validator')

const User = use('App/Models/User')

class AuthController {

    async authenticate({ request, response, auth }) {

        const validation = await validateAll(request.all(), {
            person_code: 'required|string',
            password: 'required|string'
        })

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
                error: 'Permission denied',
                message: 'This user has been deleted'
            })

        let data

        if (user.type == 'Coordenador(a)')
            data = await user.coordinator().with('course').fetch()

        else if (user.type == 'Aluno(a)')
            data = await user.student().with('course').fetch()

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

        const validation = await validateAll(request.all(), {
            password: 'required|object',
            'password.old': 'required|string|min:6',
            'password.new': 'required|string|min:6|different:password.old',
        })

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
                    error: 'Invalid user password',
                    message: 'The old password is incorrect'
                })

            user.password = password.new
            await user.save()

            return response.status(200).send({
                success: true,
                message: 'User updated successfully'
            })

        } else
            return response.status(401).send({
                error: 'Permision denied',
                message: 'You are not allowed to change this record'
            })
    }
}

module.exports = AuthController
