'use strict'

function convertToNumbers(timeInText) {
    let [hours, minutes] = timeInText.split(':')

    hours = parseInt(hours)
    minutes = parseInt(minutes)

    return [hours, minutes]
}

function convertToMinutes(timeInText) {
    const [hours, minutes] = convertToNumbers(timeInText)

    const timeInMinutes = (hours * 60 + minutes)

    return timeInMinutes
}

function convertToString(timeInMinutes) {
    const formatHours = (timeInMinutes / 60) < 10 ? '0' : ''
    const formatMinutes = (timeInMinutes % 60) < 10 ? '0' : ''

    const timeInText = formatHours + parseInt(timeInMinutes / 60) +
        ':' + (timeInMinutes % 60) + formatMinutes

    return timeInText
}

function sumDuration(schedules) {
    return schedules.rows.reduce((sum, schedule) => {
        return sum + convertToMinutes(schedule.duration)
    }, 0)
}

function totalDuration(schedules) {
    const sumDurations = sumDuration(schedules)
    return (sumDurations / 60)
}

function calculateDuration(start, end) {
    const startInMinutes = convertToMinutes(start)
    const endInMinutes = convertToMinutes(end)

    const durationInMinutes = endInMinutes - startInMinutes

    return {
        inMinutes: durationInMinutes,
        inText: convertToString(durationInMinutes)
    }
}

function validateInterval(day, start, end) {
    const [sHours, sMinutes] = convertToNumbers(start)
    const [eHours, eMinutes] = convertToNumbers(end)

    let startValid, endValid

    if (day == 'Sábado') {
        startValid = sHours >= 7
        endValid = eHours < 16 || (eHours == 16 && eMinutes <= 30)
    } else {
        startValid = (sHours == 11 && sMinutes >= 30) || sHours > 12
        endValid = eHours < 19 || (eHours == 19 && eMinutes == 0)
    }

    return (startValid && endValid)
}

function validate(workload, schedules, newSchedule) {
    const workloadInMinutes = (workload * 60)

    if (schedules.rows.length > 0) {
        const days = schedules.rows.map(schedule => {
            return schedule.day
        })

        const sumDurations = sumDuration(schedules)

        if (days.includes(newSchedule.day))
            return {
                success: false,
                message: 'Você já possui um horário para este dia da semana'
            }

        if (sumDurations == workloadInMinutes)
            return {
                success: false,
                message: 'Sua carga horária já está completa'
            }

        if ((sumDurations + newSchedule.duration) > workloadInMinutes)
            return {
                success: false,
                message: 'Este horário extrapola a sua carga horária'
            }
    } else
        if (newSchedule.duration > workloadInMinutes)
            return {
                success: false,
                message: 'Este horário extrapola a sua carga horária'
            }

    return { success: true }
}

module.exports = {
    convertToNumbers,
    totalDuration,
    calculateDuration,
    validateInterval,
    validate
}