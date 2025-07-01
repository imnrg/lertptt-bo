import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'ผู้ดูแลระบบมีอยู่แล้ว',
        user: {
          username: existingAdmin.username,
          name: existingAdmin.name,
          email: existingAdmin.email
        }
      })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        name: 'ผู้ดูแลระบบ',
        email: 'admin@lertptt.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      }
    })

    // Create some sample fuel types
    const fuelTypes = await prisma.fuelType.createMany({
      data: [
        {
          name: 'เบนซิน 95',
          code: 'E95',
          description: 'เบนซิน 95 ออกเทน',
          isActive: true,
        },
        {
          name: 'เบนซิน 91',
          code: 'E91',
          description: 'เบนซิน 91 ออกเทน',
          isActive: true,
        },
        {
          name: 'ดีเซล',
          code: 'DSL',
          description: 'น้ำมันดีเซล',
          isActive: true,
        },
        {
          name: 'แก๊สโซฮอล์ 95',
          code: 'GSH95',
          description: 'แก๊สโซฮอล์ 95',
          isActive: true,
        }
      ],
      skipDuplicates: true,
    })

    return NextResponse.json({
      success: true,
      message: 'สร้างข้อมูลเริ่มต้นสำเร็จ',
      data: {
        admin: {
          username: adminUser.username,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        },
        fuelTypesCreated: fuelTypes.count
      },
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างข้อมูลเริ่มต้น',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}