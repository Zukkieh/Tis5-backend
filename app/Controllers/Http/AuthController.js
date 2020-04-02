'use strict'

const User = use('App/Models/User')

class AuthController {

    async login({ request, response, auth }) {

        const { person_code, password } = request.all()

        const token = await auth.attempt(person_code, password)

        const { type, deleted } = await User.query()
            .where('person_code', person_code)
            .first()

        if (deleted)
            return response.status(401).send({
                error: 'Permission denied',
                message: 'This user has been deleted'
            })

        return { token, user_type: type }
    }
}

module.exports = AuthController
