const express = require('express')
const dotenv = require('dotenv')
dotenv.config()
const cors = require('cors')
const connectDB = require('./src/config/database')
const config = require('./src/config/config')
const logger = require('./src/utils/logger')
const rateLimit = require('express-rate-limit')

const app = express()

const corsOptions = {
  origin: [/\.onrender\.com$/, /\.fly\.dev$/, /localhost$/],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json())

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })
app.use(limiter)

require('./src/routes')(app)

const startServer = async () => {
  try {
    await connectDB()
    logger.info('MongoDB connected')

    app.listen(config.server.port, () => {
      logger.info(`Astra API started in ${config.server.env} mode on port ${config.server.port}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer().catch(error => {
  logger.error('Fatal error during startup:', error)
  process.exit(1)
})


