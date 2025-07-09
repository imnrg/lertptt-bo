import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'

// Security configuration for Prisma with proper typing
const prismaOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? [
        { level: 'query', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' }
      ]
    : [{ level: 'error', emit: 'stdout' }],
  errorFormat: 'minimal',
}

// Create a singleton Prisma client with enhanced security
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const basePrisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions)

// Modern Prisma extensions instead of deprecated $use middleware
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Log all database operations in development
        if (process.env.NODE_ENV === 'development') {
          const start = Date.now()
          const result = await query(args)
          const duration = Date.now() - start
          console.log(`Query ${model}.${operation} took ${duration}ms`)
          return result
        }
        
        // Add query timeout for all operations
        const timeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database query timeout')), 10000) // 10 seconds
        })
        
        return Promise.race([query(args), timeout])
      }
    }
  }
})

// Prevent development client in production
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma
}

// Graceful shutdown handlers
process.on('beforeExit', async () => {
  await basePrisma.$disconnect()
})

process.on('SIGINT', async () => {
  await basePrisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await basePrisma.$disconnect()
  process.exit(0)
})