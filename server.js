import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { carService } from './services/car.service.js'
import { userService } from './services/user.service.js'
import { loggerService } from './services/logger.service.js'

const app = express()

// Express Config:
const corsOptions = {
    origin: [
        'http://127.0.0.1:8080',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
    ],
    credentials: true
}
app.use(cors(corsOptions))
app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())


// Express Routing:
app.get('/puki', (req, res) => {
    var visitCount = req.cookies.visitCount || 0
    visitCount++
    res.cookie('visitCount', visitCount)
    res.cookie('lastVisitedCarId', 'c101', { maxAge: 60 * 60 * 1000 })
    res.send('Hello Puki')
})
app.get('/nono', (req, res) => res.redirect('/'))

// REST API for Cars

// Car LIST
app.get('/api/car', (req, res) => {
    const filterBy = {
        txt: req.query.txt || '',
        maxPrice: +req.query.maxPrice || 0,
    }
    carService.query(filterBy)
        .then((cars) => {
            res.send(cars)
        })
        .catch((err) => {
            loggerService.error('Cannot get cars', err)
            res.status(400).send('Cannot get cars')
        })
})

// Car READ
app.get('/api/car/:carId', (req, res) => {
    const { carId } = req.params
    carService.getById(carId)
        .then((car) => {
            res.send(car)
        })
        .catch((err) => {
            loggerService.error('Cannot get car', err)
            res.status(400).send('Cannot get car')
        })
})

// Car CREATE
app.post('/api/car', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot add car')
    const car = {
        vendor: req.body.vendor,
        price: +req.body.price,
        speed: +req.body.speed,
    }
    carService.save(car, loggedinUser)
        .then((savedCar) => {
            res.send(savedCar)
        })
        .catch((err) => {
            loggerService.error('Cannot save car', err)
            res.status(400).send('Cannot save car')
        })

})

// Car UPDATE
app.put('/api/car', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot update car')
    const car = {
        _id: req.body._id,
        vendor: req.body.vendor,
        speed: +req.body.speed,
        price: +req.body.price,
    }
    carService.save(car, loggedinUser)
        .then((savedCar) => {
            res.send(savedCar)
        })
        .catch((err) => {
            loggerService.error('Cannot save car', err)
            res.status(400).send('Cannot save car')
        })

})

// Car DELETE
app.delete('/api/car/:carId', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    loggerService.info('loggedinUser car delete:', loggedinUser)
    if (!loggedinUser) {
        loggerService.info('Cannot remove car, No user')
        return res.status(401).send('Cannot remove car')
    }

    const { carId } = req.params
    carService.remove(carId, loggedinUser)
        .then(() => {
            loggerService.info(`Car ${carId} removed`)
            res.send('Removed!')
        })
        .catch((err) => {
            loggerService.error('Cannot remove car', err)
            res.status(400).send('Cannot remove car')
        })

})


// AUTH API
app.get('/api/user', (req, res) => {
    userService.query()
        .then((users) => {
            res.send(users)
        })
        .catch((err) => {
            loggerService.error('Cannot load users', err)
            res.status(400).send('Cannot load users')
        })
})

app.post('/api/auth/login', (req, res) => {
    const credentials = req.body
    userService.checkLogin(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                loggerService.info('Invalid Credentials', credentials)
                res.status(401).send('Invalid Credentials')
            }
        })
})

app.post('/api/auth/signup', (req, res) => {
    const credentials = req.body
    userService.save(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                loggerService.info('Cannot signup', credentials)
                res.status(400).send('Cannot signup')
            }
        })
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out!')
})


app.put('/api/user', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(400).send('No logged in user')
    const { diff } = req.body
    if (loggedinUser.score + diff < 0) return res.status(400).send('No credit')
    loggedinUser.score += diff
    return userService.save(loggedinUser).then(user => {
        const token = userService.getLoginToken(user)
        res.cookie('loginToken', token)
        res.send(user)
    })
})


app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})


const PORT = 3030
app.listen(PORT, () =>
    loggerService.info(`Server listening on port http://127.0.0.1:${PORT}/`)
)
