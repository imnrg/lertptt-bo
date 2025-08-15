import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

const ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
const ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Administrator'

async function main() {
  if (process.env.DEFAULT_ADMIN_PASSWORD == null) {
    console.warn('⚠️ DEFAULT_ADMIN_PASSWORD not set — using fallback password "admin123". Change in production!')
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const user = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    create: {
      username: ADMIN_USERNAME,
      name: ADMIN_NAME,
      password: hashed,
      role: 'ADMIN',
      isActive: true
    },
    update: {
      name: ADMIN_NAME,
      password: hashed,
      role: 'ADMIN',
      isActive: true
    }
  })

  console.log('✅ Default admin ensured:', {
    username: user.username,
    role: user.role,
    isActive: user.isActive
  })
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
