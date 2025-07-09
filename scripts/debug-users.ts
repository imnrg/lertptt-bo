#!/usr/bin/env node

// Debug script for user management
// Run with: npx tsx scripts/debug-users.ts

import { debugUserLogin, createTestUser, resetUserPassword, listAllUsers } from '../src/lib/debug-user'

const command = process.argv[2]
const username = process.argv[3]
const password = process.argv[4]
const name = process.argv[5]

async function main() {
  try {
    switch (command) {
      case 'list':
        await listAllUsers()
        break
      
      case 'check':
        if (!username) {
          console.error('Usage: npx tsx scripts/debug-users.ts check <username>')
          process.exit(1)
        }
        await debugUserLogin(username)
        break
      
      case 'create':
        if (!username || !password) {
          console.error('Usage: npx tsx scripts/debug-users.ts create <username> <password> [name]')
          process.exit(1)
        }
        await createTestUser(username, password, name)
        break
      
      case 'reset':
        if (!username || !password) {
          console.error('Usage: npx tsx scripts/debug-users.ts reset <username> <new-password>')
          process.exit(1)
        }
        await resetUserPassword(username, password)
        break
      
      default:
        console.log('Available commands:')
        console.log('  list                                    - List all users')
        console.log('  check <username>                        - Check user details')
        console.log('  create <username> <password> [name]     - Create test user')
        console.log('  reset <username> <new-password>        - Reset user password')
        break
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()