# Lert PTT BO - ระบบจัดการปั๊มน้ำมัน

ระบบจัดการปั๊มน้ำมันแบบครบวงจรที่พัฒนาด้วย Next.js, TypeScript, และ PostgreSQL

## ✨ คุณสมบัติหลัก

### 🔐 ระบบยืนยันตัวตน
- สมัครสมาชิกและเข้าสู่ระบบ
- ยืนยันอีเมล
- รีเซ็ตรหัสผ่าน
- แก้ไขโปรไฟล์และลบบัญชี
- ระบบป้องกันเส้นทางด้วย middleware

### 📊 แดชบอร์ด
- ภาพรวมข้อมูลระบบ
- สรุปจำนวนผู้ใช้, สินค้า, ผลัดงาน
- แสดงกิจกรรมล่าสุด
- แสดงสถานะระดับน้ำมันในถัง

### ⛽ จัดการเชื้อเพลิง
- จัดการประเภทเชื้อเพลิง (CRUD)
- จัดการถังเก็บ (CRUD)
- จัดการตู้จ่าย (CRUD)
- ตรวจสอบระดับน้ำมันแบบเรียลไทม์

### 📦 จัดการสินค้า
- ดูรายการสินค้าและรายละเอียด
- ตรวจสอบสต็อกสินค้า
- แจ้งเตือนสินค้าใกล้หมด

### 👥 จัดการผลัดงาน
- ดูผลัดงานและรายละเอียด
- ติดตามเวลาการทำงาน
- สรุปยอดขาย

### 💰 จัดการลูกหนี้
- ดูข้อมูลลูกหนี้
- ติดตามสถานะการชำระ
- แจ้งเตือนการชำระหนี้

### ⚙️ ตั้งค่า
- แก้ไขโปรไฟล์
- เปลี่ยนรหัสผ่าน
- ตั้งค่าธีม (สว่าง/มืด)

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend & Backend**: Next.js 14+ (App Router)
- **ภาษา**: TypeScript
- **UI Framework**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Email**: Nodemailer

## 📋 ข้อกำหนดระบบ

- Node.js 18.0 หรือใหม่กว่า
- PostgreSQL 12 หรือใหม่กว่า
- npm หรือ yarn
- บัญชีอีเมลสำหรับส่งอีเมลยืนยัน

## 🚀 การติดตั้ง

### 1. โคลนโปรเจค
```bash
git clone <repository-url>
cd lertptt-bo
```

### 2. ติดตั้ง dependencies
```bash
npm install
```

### 3. ตั้งค่าฐานข้อมูล
สร้างฐานข้อมูล PostgreSQL และแก้ไขไฟล์ `.env.local`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/lertptt_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# App Settings
APP_NAME="Lert PTT BO"
APP_URL="http://localhost:3000"
```

### 4. รันการ migration
```bash
npx prisma migrate dev --name init
```

### 5. สร้าง Prisma Client
```bash
npx prisma generate
```

### 6. เรียกใช้โปรเจค
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 📝 การใช้งาน

### การเริ่มต้นใช้งาน

1. **สมัครสมาชิก**: ไปที่หน้าสมัครสมาชิกและกรอกข้อมูล
2. **ยืนยันอีเมล**: ตรวจสอบอีเมลและคลิกลิงก์ยืนยัน
3. **เข้าสู่ระบบ**: ใช้อีเมลและรหัสผ่านที่สมัครไว้
4. **เริ่มใช้งาน**: เข้าถึงแดชบอร์ดและฟีเจอร์ต่างๆ

### การจัดการข้อมูล

- **เชื้อเพลิง**: เพิ่มประเภทเชื้อเพลิง, ถังเก็บ, และตู้จ่าย
- **สินค้า**: เพิ่มสินค้าและติดตามสต็อก
- **ผลัดงาน**: สร้างและติดตามผลัดการทำงาน
- **ลูกหนี้**: เพิ่มและติดตามข้อมูลลูกหนี้

## 🔧 คำสั่งที่สำคัญ

```bash
# รันในโหมด development
npm run dev

# สร้าง build สำหรับ production
npm run build

# รัน production build
npm start

# รัน linting
npm run lint

# รีเซ็ตฐานข้อมูล
npx prisma migrate reset

# เปิด Prisma Studio
npx prisma studio
```

## 📊 โครงสร้างโปรเจค

```
├── prisma/                 # Prisma schema และ migrations
├── public/                 # Static files
├── src/
│   ├── app/                # App Router pages
│   │   ├── (dashboard)/    # Protected dashboard pages
│   │   ├── api/            # API routes
│   │   └── auth/           # Authentication pages
│   ├── components/         # React components
│   │   ├── ui/             # UI components
│   │   └── providers/      # Context providers
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript type definitions
├── .env.local              # Environment variables
├── middleware.ts           # Next.js middleware
└── tailwind.config.ts      # Tailwind configuration
```

## 🛡️ ความปลอดภัย

- รหัสผ่านเข้ารหัสด้วย bcrypt
- JWT tokens สำหรับ session
- Middleware ป้องกันเส้นทาง
- Input validation ด้วย Zod
- SQL injection protection ด้วย Prisma ORM

## 🎨 UI/UX

- Responsive design ใช้งานได้ทุกอุปกรณ์
- Dark/Light mode
- ภาษาไทยเป็นหลัก
- Modern และใช้งานง่าย

## 🤝 การพัฒนาต่อ

1. Fork โปรเจค
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไป branch
5. สร้าง Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 ติดต่อ

สำหรับคำถามหรือข้อเสนอแนะ กรุณาติดต่อผ่าน:
- Email: [your-email@example.com]
- GitHub Issues: [repository-issues-url]
