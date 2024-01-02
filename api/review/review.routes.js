import { addReview, deleteReview, getReviews } from './review.controller.js'
import express from 'express'

import { log } from '../../middlewares/logger.middleware.js'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'

const router = express.Router()

router.get('/', log, getReviews)
router.post('/',  log, requireAuth, addReview)
router.delete('/:id',  requireAuth, deleteReview)

export const reviewRoutes = router