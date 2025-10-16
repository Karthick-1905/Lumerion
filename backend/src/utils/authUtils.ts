import 'dotenv/config'
import crypto from 'crypto'
import { z } from "zod"
import {client} from './redisClient'


const sessionSchema = z.object({
  id: z.string(),
  userId: z.number(),
})

type UserSession = z.infer<typeof sessionSchema>

const DEFAULT_SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7 // 7 days
const MAX_SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 30 // 30 days

function coercePositiveInteger(value: unknown): number | null {
  if (typeof value !== "number") {
    return null
  }

  if (!Number.isFinite(value)) {
    return null
  }

  if (value <= 0) {
    return null
  }

  return Math.floor(value)
}

function tryParseExpression(raw: string): number | null {
  const trimmed = raw.trim()

  if (!trimmed) {
    return null
  }

  if (/^\d+$/.test(trimmed)) {
    return coercePositiveInteger(Number(trimmed))
  }

  if (!/^[-+*/()\d\s.]+$/.test(trimmed)) {
    return null
  }

  try {
    // eslint-disable-next-line no-new-func
    const evaluator = new Function(`return (${trimmed});`)
    return coercePositiveInteger(evaluator())
  } catch (error) {
    console.warn("SESSION_EXPIRATION_SECONDS expression could not be evaluated", error)
    return null
  }
}

export function getSessionExpirationSeconds() {
  const raw = process.env.SESSION_EXPIRATION_SECONDS

  if (!raw) {
    return DEFAULT_SESSION_EXPIRATION_SECONDS
  }

  const parsed = tryParseExpression(raw)

  if (parsed === null) {
    console.warn(
      `SESSION_EXPIRATION_SECONDS is invalid (value: "${raw}"). Falling back to default of ${DEFAULT_SESSION_EXPIRATION_SECONDS} seconds.`
    )
    return DEFAULT_SESSION_EXPIRATION_SECONDS
  }

  if (parsed > MAX_SESSION_EXPIRATION_SECONDS) {
    console.warn(
      `SESSION_EXPIRATION_SECONDS exceeds maximum of ${MAX_SESSION_EXPIRATION_SECONDS} seconds. Capping to maximum.`
    )
    return MAX_SESSION_EXPIRATION_SECONDS
  }

  return parsed
}


export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(password, salt)
    crypto.scrypt(password.normalize(), salt, 64, (error, hash) => {
      if (error) reject(error)

      resolve(hash.toString("hex").normalize())
    })
  })
}

export async function comparePasswords({password,salt,hashedPassword,}: 
    {password: string,salt: string,hashedPassword: string}) {
  const inputHashedPassword = await hashPassword(password, salt)

  return crypto.timingSafeEqual(
    Buffer.from(inputHashedPassword, "hex"),
    Buffer.from(hashedPassword, "hex")
  )
}

export function generateSalt() {
  return crypto.randomBytes(16).toString("hex").normalize()
}

export function generateSessionId() {
    return crypto.randomBytes(512).toString("hex").normalize()
}

export async function createSession(sessionId: string, userId: number) {
  const session: UserSession = { id: sessionId, userId }

  await client.set(
    `session:${sessionId}`,
    JSON.stringify(session),
    "EX",
    getSessionExpirationSeconds()
  )

  return session
}

export async function getSession(sessionId: string): Promise<UserSession | null> {
  try {
    const sessionData = await client.get(`session:${sessionId}`)
    if (!sessionData) return null
    
    const parsed = JSON.parse(sessionData)
    return sessionSchema.parse(parsed)
  } catch (error) {
    return null
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await client.del(`session:${sessionId}`)
}

