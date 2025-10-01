import 'dotenv/config'
import Redis from "ioredis"

export const client = new Redis(process.env.REDIS_URL!);