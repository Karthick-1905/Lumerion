import 'dotenv/config'
import crypto from 'crypto'
import { z } from "zod"
import {client} from './redisClient'


const sessionSchema = z.object({
  id: z.string(),
  userId: z.number(),
})

type UserSession = z.infer<typeof sessionSchema>


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
    parseInt(process.env.SESSION_EXPIRATION_SECONDS || "604800", 10) // 7 days default
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

