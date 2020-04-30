'use strict'

const Database = use('Database')
const { validateAll } = use('Validator')

class SearchController {

    wordUpper(arrWords) {

        const ignore = ['de', 'da', 'das', 'do', 'dos'];

        arrWords = arrWords.split(' ')

        for (let i in arrWords) {
            if (ignore.indexOf(arrWords[i]) === -1) {
                arrWords[i] = arrWords[i].charAt(0).toUpperCase() + arrWords[i].slice(1);
            }
        }
        return arrWords;
    }

    async coordinator({ request, response, auth }) {

        if (!auth.user.type) {

            const validation = await validateAll(request.get(), {
                person_code: 'string|required_without_all:name',
                name: 'string|required_without_all:person_code'
            })

            if (validation.fails())
                return response.status(400).send({
                    errors: validation.messages()
                })

            const { name, person_code } = request.get()

            const coordinators = await Database
                .select([
                    'coordinators.id',
                    'coordinators.user_id',
                    'users.person_code',
                    'users.name',
                    'users.email'
                ])
                .from('coordinators')
                .innerJoin('users', 'users.id', 'coordinators.user_id')
                .where('users.deleted', false)
                .where(`users.${name ? 'name' : 'person_code'}`, `${name ? 'like' : '='}`,
                    `${name ? '%' + this.wordUpper(name).join(' ') + '%' : person_code}`)

            if (coordinators.length == 0)
                return response.status(404).send({
                    error: 'Coordenador não encontrado'
                })

            return response.status(200).send(coordinators)

        } else
            return response.status(403).send({
                error: 'Permissão negada',
                message: 'Você não tem permissão para acessar estes dados'
            })
    }
}

module.exports = SearchController
