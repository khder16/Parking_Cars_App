import { rateLimit } from "express-rate-limit";
import redis from 'redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

// Local rate limit
export const rateLimitRequest = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,  // 24h
    max: 50,
    message: 'You have exceeded the 50 requests in 24 hrs limit!',
    standardHeaders: true,
    legacyHeaders: false,
});

// Redis client setup
const redisClient = redis.createClient({
    enable_offline_queue: false,
});
await redisClient.connect();

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('ready', () => {
    console.log('Redis client is ready');
});

redisClient.on('end', () => {
    console.log('Redis connection closed');
});

// Distributed rate limiter
export const distributedLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rateLimiter:',
    points: 1000,  // Max requests
    duration: 60,  // Time window in seconds
    blockDuration: 60 * 60,  // Block for 1 hour if consumed more than points
});

export const rateLimitMiddleware = async (req, res, next) => {
    console.log(`Request IP: ${req.ip}`);
    try {
        await distributedLimiter.consume(req.ip);
        next();
    } catch (err) {
        console.error('Rate limit exceeded for IP:', req.ip, err);
        res.status(429).send('Too many requests. Please try again later.');
    }
};