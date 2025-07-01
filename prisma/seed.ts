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

  // Create sample products with prices
  const fuelTypeRecords = await prisma.fuelType.findMany()
  
  for (const fuelType of fuelTypeRecords) {
    const product = await prisma.product.create({
      data: {
        name: fuelType.name,
        code: `PROD_${fuelType.code}`,
        description: `ผลิตภัณฑ์ ${fuelType.name}`,
        cost: 35.5,
        fuelTypeId: fuelType.id,
        category: 'เชื้อเพลิง',
        isActive: true,
        stockQuantity: 1000,
        minStock: 100,
        unit: 'ลิตร',
      }
    })

    // Create initial price for the product
    await prisma.productPrice.create({
      data: {
        productId: product.id,
        price: 38.5, // Sample price
        effectiveDate: new Date(),
        isActive: true,
      }
    })

    console.log(`✅ สร้างผลิตภัณฑ์และราคา: ${product.name}`)
  }

  // Create sample tanks
  const tanks = []
  for (let i = 1; i <= 4; i++) {
    const fuelType = fuelTypeRecords[i - 1]
    if (fuelType) {
      const tank = await prisma.tank.create({
        data: {
          name: `ถังที่ ${i}`,
          code: `TANK_${i.toString().padStart(2, '0')}`,
          capacity: 50000,
          currentLevel: 25000,
          minLevel: 5000,
          maxLevel: 48000,
          fuelTypeId: fuelType.id,
          isActive: true,
          location: `โซน ${i}`,
        }
      })
      tanks.push(tank)
      console.log(`✅ สร้างถังเก็บน้ำมัน: ${tank.name}`)
    }
  }

  // Create sample dispensers
  for (const tank of tanks) {
    for (let j = 1; j <= 2; j++) {
      const dispenser = await prisma.dispenser.create({
        data: {
          name: `หัวจ่าย ${tank.name.replace('ถังที่', '')}${j}`,
          code: `DISP_${tank.code.replace('TANK_', '')}_${j}`,
          tankId: tank.id,
          fuelTypeId: tank.fuelTypeId,
          isActive: true,
          location: `${tank.location} หัวจ่าย ${j}`,
        }
      })
      console.log(`✅ สร้างหัวจ่าย: ${dispenser.name}`)
    }
  }

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