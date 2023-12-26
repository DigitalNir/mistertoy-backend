
import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

export const toyService = {
    query,
    getById,
    remove,
    save
}

const toys = utilService.readJsonFile('data/toy.json')

// function query(filterBy = {}) {
//     const regex = new RegExp(filterBy.txt, 'i')
//     var toysToReturn = toys.filter(toy => regex.test(toy.name))
//     if (filterBy.maxPrice) {
//         toysToReturn = toysToReturn.filter(car => car.price <= filterBy.maxPrice)
//     }
//     return Promise.resolve(toysToReturn)
// }

function query(filterBy = {}) {
    if (!filterBy.txt) filterBy.txt = ''
    if (!filterBy.maxPrice) filterBy.maxPrice = 10000
    if (!filterBy.stockStatus) filterBy.stockStatus = undefined

    // Convert stockStatus to a boolean or keep it undefined
    let stockStatus
    if (filterBy.stockStatus === 'true') stockStatus = true
    else if (filterBy.stockStatus === 'false') stockStatus = false

    const regExp = new RegExp(filterBy.txt, 'i')

    const toysToReturn = toys.filter(toy => {
        const matchesName = regExp.test(toy.name)
        const matchesPrice = toy.price <= filterBy.maxPrice
        const matchesStockStatus = stockStatus === undefined || toy.inStock === stockStatus

        return matchesName && matchesPrice && matchesStockStatus
    })

    return Promise.resolve(toysToReturn)

}

function getById(toyId) {
    const toy = toys.find(toy => toy._id === toyId)
    return Promise.resolve(toy)
}

function remove(toyId, loggedinUser) {
    const idx = toys.findIndex(toy => toy._id === toyId)
    if (idx === -1) return Promise.reject('No Such toy')
    const toy = toys[idx]
    if (!loggedinUser.isAdmin &&
        toy.owner._id !== loggedinUser._id) {
        return Promise.reject('Not your toy')
    }
    toys.splice(idx, 1)
    return _saveToysToFile()
}

function save(toy, loggedinUser) {

    if (toy._id) {
        const toyToUpdate = toys.find(currToy => currToy._id === toy._id)
        if (!loggedinUser.isAdmin &&
            toyToUpdate.owner._id !== loggedinUser._id) {
            return Promise.reject('Not your toy')
        }
        toyToUpdate.name = toy.name
        toyToUpdate.price = toy.price
        toyToUpdate.labels = toy.labels
        toyToUpdate.inStock = toy.inStock
        toy = toyToUpdate

    } else {
        toy._id = utilService.makeId()
        toy.owner = {
            fullname: loggedinUser.fullname,
            score: loggedinUser.score,
            _id: loggedinUser._id,
            isAdmin: loggedinUser.isAdmin
        }
        toys.push(toy)
    }

    return _saveToysToFile().then(() => toy)
}


function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(toys, null, 4)
        fs.writeFile('data/toy.json', data, (err) => {
            if (err) {
                loggerService.error('Cannot write to toys file', err)
                return reject(err)
            }
            resolve()
        })
    })
}
