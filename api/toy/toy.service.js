import { ObjectId } from 'mongodb'

import { utilService } from '../../services/util.service.js'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'

export const toyService = {
    remove,
    query,
    getById,
    add,
    update,
    addToyMsg,
    removeToyMsg,
}

async function query(filterBy = {}) {
    try {
        // Set default values
        filterBy.txt = filterBy.txt || ''
        filterBy.maxPrice = +filterBy.maxPrice || 10000
        filterBy.stockStatus = filterBy.stockStatus || undefined

        // Convert stockStatus to a boolean or keep it undefined
        let stockStatus
        if (filterBy.stockStatus === 'true') stockStatus = true
        else if (filterBy.stockStatus === 'false') stockStatus = false

        // Build criteria for MongoDB query
        const criteria = {
            name: { $regex: new RegExp(filterBy.txt, 'i') },
            price: { $lte: filterBy.maxPrice },
        }

        // Add stockStatus to criteria if it's not undefined
        if (stockStatus !== undefined) {
            criteria.inStock = stockStatus
        }

        // Get the collection and perform the query
        const collection = await dbService.getCollection('toy')
        var toys = await collection.find(criteria).toArray()
        return toys
    } catch (err) {
        logger.error('cannot find toys', err)
        throw err
    }
}

async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        const toy = await collection.findOne({ _id: new ObjectId(toyId) })
        return toy
    } catch (err) {
        logger.error(`while finding toy ${toyId}`, err)
        throw err
    }
}

async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.deleteOne({ _id: new ObjectId(toyId) })
    } catch (err) {
        logger.error(`cannot remove toy ${toyId}`, err)
        throw err
    }
}

async function add(toy) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.insertOne(toy)
        return toy
    } catch (err) {
        logger.error('cannot insert toy', err)
        throw err
    }
}

async function update(toy) {
    try {
        const toyToSave = {
            name: toy.name,
            price: toy.price,
            labels: toy.labels,
            inStock: toy.inStock,
        }
        const collection = await dbService.getCollection('toy')
        await collection.updateOne(
            { _id: new ObjectId(toy._id) },
            { $set: toyToSave }
        )
        return toy
    } catch (err) {
        logger.error(`cannot update toy ${toy._id}`, err)
        throw err
    }
}

async function addToyMsg(toyId, msg) {
    try {
        msg.id = utilService.makeId()
        const collection = await dbService.getCollection('toy')
        await collection.updateOne(
            { _id: new ObjectId(toyId) },
            { $push: { msgs: msg } }
        )
        return msg
    } catch (err) {
        logger.error(`cannot add toy msg ${toyId}`, err)
        throw err
    }
}

async function removeToyMsg(toyId, msgId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.updateOne(
            { _id: new ObjectId(toyId) },
            { $pull: { msgs: { id: msgId } } }
        )
        return msgId
    } catch (err) {
        logger.error(`cannot remove toy msg ${toyId}`, err)
        throw err
    }
}
