import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Check if any admin user already exists
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    })

    if (adminCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'ระบบมีผู้ดูแลแล้ว ไม่สามารถสร้างใหม่ได้',
        adminCount
      })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    await prisma.user.create({
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
    await prisma.fuelType.createMany({
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
      message: '🎉 สร้างข้อมูลเริ่มต้นสำเร็จ!',
      credentials: {
        username: 'admin',
        password: 'admin123',
        loginUrl: '/auth/login'
      },
      note: 'กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก'
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

// Keep POST method for backward compatibility
export async function POST() {
  return GET()
}