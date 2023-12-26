
import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

export const carService = {
    query,
    getById,
    remove,
    save
}

const cars = utilService.readJsonFile('data/car.json')

function query(filterBy = { txt: '' }) {
    const regex = new RegExp(filterBy.txt, 'i')
    var carsToReturn = cars.filter(car => regex.test(car.vendor))
    if (filterBy.maxPrice) {
        carsToReturn = carsToReturn.filter(car => car.price <= filterBy.maxPrice)
    }
    return Promise.resolve(carsToReturn)
}

function getById(carId) {
    const car = cars.find(car => car._id === carId)
    return Promise.resolve(car)
}

function remove(carId, loggedinUser) {
    const idx = cars.findIndex(car => car._id === carId)
    if (idx === -1) return Promise.reject('No Such Car')
    const car = cars[idx]
    if (!loggedinUser.isAdmin &&
        car.owner._id !== loggedinUser._id) {
        return Promise.reject('Not your car')
    }
    cars.splice(idx, 1)
    return _saveCarsToFile()
}

function save(car, loggedinUser) {
    if (car._id) {
        const carToUpdate = cars.find(currCar => currCar._id === car._id)
        if (!loggedinUser.isAdmin &&
            carToUpdate.owner._id !== loggedinUser._id) {
            return Promise.reject('Not your car')
        }
        carToUpdate.vendor = car.vendor
        carToUpdate.speed = car.speed
        carToUpdate.price = car.price
        car = carToUpdate
    } else {
        car._id = utilService.makeId()
        car.owner = {
            fullname: loggedinUser.fullname,
            score: loggedinUser.score,
            _id: loggedinUser._id,
            isAdmin: loggedinUser.isAdmin
        }
        cars.push(car)
    }

    return _saveCarsToFile().then(() => car)
}


function _saveCarsToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(cars, null, 4)
        fs.writeFile('data/car.json', data, (err) => {
            if (err) {
                loggerService.error('Cannot write to cars file', err)
                return reject(err)
            }
            resolve()
        })
    })
}
