import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 เริ่มต้นการ seed ข้อมูล...')

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  })

  if (existingAdmin) {
    console.log('✅ ผู้ดูแลระบบมีอยู่แล้ว:', existingAdmin.username)
    return
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

  console.log('✅ สร้างผู้ดูแลระบบสำเร็จ:')
  console.log('   ชื่อผู้ใช้:', adminUser.username)
  console.log('   ชื่อ:', adminUser.name)
  console.log('   อีเมล:', adminUser.email)
  console.log('   รหัสผ่าน: admin123')
  console.log('   บทบาท:', adminUser.role)

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

  console.log(`✅ สร้างประเภทเชื้อเพลิง ${fuelTypes.count} รายการ`)

  console.log('🎉 seed ข้อมูลเสร็จสิ้น!')
}

main()
  .catch((e) => {
    console.error('❌ เกิดข้อผิดพลาดในการ seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })