// Debug utility for user management
// This file is for development/debugging purposes only

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function debugUserLogin(username: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        password: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      console.log(`❌ User "${username}" not found`)
      return null
    }

    console.log(`✅ User "${username}" found:`, {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })

    return user
  } catch (error) {
    console.error('Error debugging user:', error)
    return null
  }
}

export async function createTestUser(username: string, password: string, name?: string) {
  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || username,
        role: 'USER',
        isActive: true
      }
    })

    console.log(`✅ Test user "${username}" created successfully`)
    return user
  } catch (error) {
    console.error('Error creating test user:', error)
    throw error
  }
}

export async function resetUserPassword(username: string, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    const user = await prisma.user.update({
      where: { username },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    })

    console.log(`✅ Password reset for user "${username}" completed`)
    return user
  } catch (error) {
    console.error('Error resetting user password:', error)
    throw error
  }
}

export async function listAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📋 Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role}) - ${user.isActive ? 'Active' : 'Inactive'}`)
    })

    return users
  } catch (error) {
    console.error('Error listing users:', error)
    throw error
  }
}