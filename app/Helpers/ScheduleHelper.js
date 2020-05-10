'use strict'

class ScheduleHelper {

    calculateDuration(start, end) {
        let [sHours, sMinutes] = start.split(':')
        let [eHours, eMinutes] = end.split(':')

        sHours = parseInt(sHours)
        sMinutes = parseInt(sMinutes)
        eHours = parseInt(eHours)
        eMinutes = parseInt(eMinutes)

        const dMinutes = (eHours * 60 + eMinutes) - (sHours * 60 + sMinutes)

        const duration = {
            toMinutes: dMinutes,
            toHours: (dMinutes / 60),
            toString: parseInt(dMinutes / 60) + ':' + (dMinutes % 60)
        }

        return duration
    }
}

module.exports = ScheduleHelper