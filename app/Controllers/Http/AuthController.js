'use strict'

const User = use('App/Models/User')

class AuthController {

    async login({ request, response, auth }) {

        const { person_code, password } = request.all()

        const { token } = await auth.attempt(person_code, password)

        const user = await User.query()
            .where('person_code', person_code)
            .first()

        if (user.deleted)
            return response.status(401).send({
                error: 'Permission denied',
                message: 'This user has been deleted'
            });

        let data;

        if (user.type == 'Coordenador(a)')
            data = await user.coordinator().fetch()
        if (user.type == 'Aluno(a)')
            data = await user.student().fetch()

        return { token, user_type: user.type, data }
    }
}

module.exports = AuthController
