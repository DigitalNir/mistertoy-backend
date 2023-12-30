import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import path, { dirname } from 'path'
import { logger } from './services/logger.service.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

logger.info('server.js loaded...')

const app = express()

// Express App Config
app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))

if (process.env.NODE_ENV === 'production') {
    // Express serve static files on production environment
    app.use(express.static(path.resolve(__dirname, 'public')))
    console.log('__dirname: ', __dirname)
} else {
    // Configuring CORS
    const corsOptions = {
        // Make sure origin contains the url your frontend is running on
        origin: [
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            'http://127.0.0.1:3000',
            'http://localhost:3000',
        ],
        credentials: true,
    }
    app.use(cors(corsOptions))
}

// routes

import { authRoutes } from './api/auth/auth.routes.js'
app.use('/api/auth', authRoutes)

import { userRoutes } from './api/user/user.routes.js'
app.use('/api/user', userRoutes)

import { toyRoutes } from './api/toy/toy.routes.js'
app.use('/api/toy', toyRoutes)

app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

// const PORT = 3030
const port = process.env.PORT || 3030
app.listen(port, () => logger.info(`Server listening on port: ${port}/`))
