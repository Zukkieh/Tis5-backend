const Request = use('App/Models/Request')

function findOne(field, value) {

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

module.exports = {
    findOne,
    findAll
}
