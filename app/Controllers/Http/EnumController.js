'use strict'

const Database = use('Database')

class EnumController {

    async user_type() {
        const enu = await Database
            .raw('SELECT unnest(enum_range(NULL::user_type))::text AS type')

        return enu.rows.map(user => user.type)
    }

    async course_campus() {
        const enu = await Database
            .raw('SELECT unnest(enum_range(NULL::course_campus))::text AS campus')

        return enu.rows.map(course => course.campus)
    }

    async subject_shift() {
        const enu = await Database
            .raw('SELECT unnest(enum_range(NULL::subject_shift))::text AS shift')

        return enu.rows.map(subject => subject.shift)
    }
}

module.exports = EnumController
