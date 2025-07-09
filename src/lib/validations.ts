import { z } from "zod"

// Security constants
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128
const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 30

// Enhanced password validation with security requirements
const passwordSchema = z.string()
  .min(MIN_PASSWORD_LENGTH, `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`)
  .max(MAX_PASSWORD_LENGTH, `รหัสผ่านต้องไม่เกิน ${MAX_PASSWORD_LENGTH} ตัวอักษร`)
  .refine(
    (password) => /[a-z]/.test(password),
    { message: "รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว" }
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว" }
  )
  .refine(
    (password) => /[0-9]/.test(password),
    { message: "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว" }
  )
  .refine(
    (password) => /[^a-zA-Z0-9]/.test(password),
    { message: "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว" }
  )
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    { message: "รหัสผ่านต้องไม่มีตัวอักษรซ้ำกันติดต่อกันเกิน 2 ตัว" }
  )

// Enhanced username validation
const usernameSchema = z.string()
  .min(USERNAME_MIN_LENGTH, `ชื่อผู้ใช้ต้องมีอย่างน้อย ${USERNAME_MIN_LENGTH} ตัวอักษร`)
  .max(USERNAME_MAX_LENGTH, `ชื่อผู้ใช้ต้องไม่เกิน ${USERNAME_MAX_LENGTH} ตัวอักษร`)
  .regex(/^[a-zA-Z0-9_-]+$/, "ชื่อผู้ใช้สามารถมีได้เฉพาะตัวอักษร ตัวเลข ขีดกลาง และขีดล่าง")
  .refine(
    (username) => !username.startsWith('-') && !username.endsWith('-'),
    { message: "ชื่อผู้ใช้ต้องไม่ขึ้นต้นหรือลงท้ายด้วยขีดกลาง" }
  )
  .refine(
    (username) => !/^(admin|root|user|test|guest|null|undefined)$/i.test(username),
    { message: "ชื่อผู้ใช้นี้ไม่สามารถใช้งานได้" }
  )

// Enhanced email validation
const emailSchema = z.string()
  .email("รูปแบบอีเมลไม่ถูกต้อง")
  .max(254, "อีเมลยาวเกินไป")
  .refine(
    (email) => {
      const parts = email.split('@')
      return parts[0].length <= 64 && parts[1].length <= 253
    },
    { message: "รูปแบบอีเมลไม่ถูกต้อง" }
  )
  .optional()
  .or(z.literal(""))

// Authentication schemas
export const registerSchema = z.object({
  username: usernameSchema,
  name: z.string()
    .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(100, "ชื่อยาวเกินไป")
    .regex(/^[a-zA-Zก-๏\s]+$/, "ชื่อสามารถมีได้เฉพาะตัวอักษรและช่องว่าง")
    .refine(
      (name) => name.trim().length >= 2,
      { message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" }
    ),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
})

export const loginSchema = z.object({
  username: z.string()
    .min(1, "กรุณากรอกชื่อผู้ใช้")
    .max(USERNAME_MAX_LENGTH, "ชื่อผู้ใช้ยาวเกินไป")
    .trim(),
  password: z.string()
    .min(1, "กรุณากรอกรหัสผ่าน")
    .max(MAX_PASSWORD_LENGTH, "รหัสผ่านยาวเกินไป"),
})

export const forgotPasswordSchema = z.object({
  username: usernameSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, "โทเค็นจำเป็นต้องระบุ")
    .max(500, "โทเค็นไม่ถูกต้อง"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, "กรุณากรอกรหัสผ่านปัจจุบัน")
    .max(MAX_PASSWORD_LENGTH, "รหัสผ่านยาวเกินไป"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่ไม่ตรงกัน",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม",
  path: ["newPassword"],
})

export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(100, "ชื่อยาวเกินไป")
    .regex(/^[a-zA-Zก-๏\s]+$/, "ชื่อสามารถมีได้เฉพาะตัวอักษรและช่องว่าง"),
  username: usernameSchema,
  email: emailSchema,
})

// Fuel Management schemas with enhanced validation
export const fuelTypeSchema = z.object({
  name: z.string()
    .min(1, "กรุณากรอกชื่อประเภทเชื้อเพลิง")
    .max(100, "ชื่อประเภทเชื้อเพลิงยาวเกินไป")
    .trim(),
  code: z.string()
    .min(1, "กรุณากรอกรหัสประเภทเชื้อเพลิง")
    .max(20, "รหัสประเภทเชื้อเพลิงยาวเกินไป")
    .regex(/^[A-Z0-9-]+$/, "รหัสสามารถมีได้เฉพาะตัวอักษรพิมพ์ใหญ่ ตัวเลข และขีดกลาง")
    .trim(),
  description: z.string()
    .max(500, "คำอธิบายยาวเกินไป")
    .optional(),
  isActive: z.boolean().default(true),
})

export const tankSchema = z.object({
  name: z.string()
    .min(1, "กรุณากรอกชื่อถัง")
    .max(100, "ชื่อถังยาวเกินไป")
    .trim(),
  code: z.string()
    .min(1, "กรุณากรอกรหัสถัง")
    .max(20, "รหัสถังยาวเกินไป")
    .regex(/^[A-Z0-9-]+$/, "รหัสสามารถมีได้เฉพาะตัวอักษรพิมพ์ใหญ่ ตัวเลข และขีดกลาง")
    .trim(),
  capacity: z.number()
    .positive("ความจุต้องมากกว่า 0")
    .max(1000000, "ความจุสูงเกินไป")
    .finite("ค่าความจุไม่ถูกต้อง"),
  currentLevel: z.number()
    .min(0, "ระดับปัจจุบันต้องไม่น้อยกว่า 0")
    .finite("ค่าระดับปัจจุบันไม่ถูกต้อง"),
  minLevel: z.number()
    .min(0, "ระดับขั้นต่ำต้องไม่น้อยกว่า 0")
    .finite("ค่าระดับขั้นต่ำไม่ถูกต้อง"),
  maxLevel: z.number()
    .positive("ระดับสูงสุดต้องมากกว่า 0")
    .finite("ค่าระดับสูงสุดไม่ถูกต้อง")
    .optional(),
  fuelTypeId: z.string()
    .min(1, "กรุณาเลือกประเภทเชื้อเพลิง")
    .uuid("รหัสประเภทเชื้อเพลิงไม่ถูกต้อง"),
  location: z.string()
    .max(200, "ตำแหน่งยาวเกินไป")
    .optional(),
  isActive: z.boolean().default(true),
}).refine((data) => {
  if (data.maxLevel && data.currentLevel > data.maxLevel) {
    return false
  }
  return data.currentLevel >= data.minLevel
}, {
  message: "ระดับปัจจุบันต้องอยู่ระหว่างระดับขั้นต่ำและสูงสุด",
  path: ["currentLevel"],
})

export const dispenserSchema = z.object({
  name: z.string()
    .min(1, "กรุณากรอกชื่อตู้จ่าย")
    .max(100, "ชื่อตู้จ่ายยาวเกินไป")
    .trim(),
  code: z.string()
    .min(1, "กรุณากรอกรหัสตู้จ่าย")
    .max(20, "รหัสตู้จ่ายยาวเกินไป")
    .regex(/^[A-Z0-9-]+$/, "รหัสสามารถมีได้เฉพาะตัวอักษรพิมพ์ใหญ่ ตัวเลข และขีดกลาง")
    .trim(),
  tankId: z.string()
    .min(1, "กรุณาเลือกถัง")
    .uuid("รหัสถังไม่ถูกต้อง"),
  fuelTypeId: z.string()
    .min(1, "กรุณาเลือกประเภทเชื้อเพลิง")
    .uuid("รหัสประเภทเชื้อเพลิงไม่ถูกต้อง"),
  location: z.string()
    .max(200, "ตำแหน่งยาวเกินไป")
    .optional(),
  isActive: z.boolean().default(true),
})

// Product Management schemas with enhanced validation
export const productSchema = z.object({
  name: z.string()
    .min(1, "กรุณากรอกชื่อสินค้า")
    .max(200, "ชื่อสินค้ายาวเกินไป")
    .trim(),
  code: z.string()
    .min(1, "กรุณากรอกรหัสสินค้า")
    .max(50, "รหัสสินค้ายาวเกินไป")
    .regex(/^[A-Z0-9-]+$/, "รหัสสามารถมีได้เฉพาะตัวอักษรพิมพ์ใหญ่ ตัวเลข และขีดกลาง")
    .trim(),
  description: z.string()
    .max(1000, "คำอธิบายยาวเกินไป")
    .optional(),
  cost: z.number()
    .positive("ต้นทุนต้องมากกว่า 0")
    .max(999999.99, "ต้นทุนสูงเกินไป")
    .finite("ค่าต้นทุนไม่ถูกต้อง")
    .optional(),
  fuelTypeId: z.string()
    .uuid("รหัสประเภทเชื้อเพลิงไม่ถูกต้อง")
    .optional(),
  category: z.string()
    .max(100, "หมวดหมู่ยาวเกินไป")
    .optional(),
  stockQuantity: z.number()
    .min(0, "จำนวนสต็อกต้องไม่น้อยกว่า 0")
    .max(9999999, "จำนวนสต็อกสูงเกินไป")
    .finite("จำนวนสต็อกไม่ถูกต้อง"),
  minStock: z.number()
    .min(0, "สต็อกขั้นต่ำต้องไม่น้อยกว่า 0")
    .max(9999999, "สต็อกขั้นต่ำสูงเกินไป")
    .finite("สต็อกขั้นต่ำไม่ถูกต้อง"),
  unit: z.string()
    .min(1, "กรุณาระบุหน่วย")
    .max(20, "หน่วยยาวเกินไป")
    .default("ลิตร"),
  isActive: z.boolean().default(true),
})

// Product Price Management schemas
export const productPriceSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  price: z.number().positive("ราคาต้องมากกว่า 0"),
  effectiveDate: z.string().min(1, "กรุณาเลือกวันที่มีผล"),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const bulkPriceUpdateSchema = z.object({
  products: z.array(z.object({
    productId: z.string().min(1, "กรุณาเลือกสินค้า"),
    price: z.number().positive("ราคาต้องมากกว่า 0"),
  })),
  effectiveDate: z.string().min(1, "กรุณาเลือกวันที่มีผล"),
  endDate: z.string().optional(),
})

// Shift Management schemas
export const shiftSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกะการทำงาน"),
  startTime: z.string().min(1, "กรุณาเลือกเวลาเริ่มต้น"),
  endTime: z.string().optional(),
  userId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  notes: z.string().optional(),
  totalSales: z.number().min(0, "ยอดขายต้องไม่น้อยกว่า 0").default(0),
})

// Debtor Management schemas
export const debtorSchema = z.object({
  customerName: z.string()
    .min(1, "กรุณากรอกชื่อลูกค้า")
    .max(100, "ชื่อลูกค้ายาวเกินไป")
    .trim(),
  customerCode: z.string()
    .min(1, "กรุณากรอกรหัสลูกค้า")
    .max(20, "รหัสลูกค้ายาวเกินไป")
    .regex(/^[A-Z0-9-]+$/, "รหัสสามารถมีได้เฉพาะตัวอักษรพิมพ์ใหญ่ ตัวเลข และขีดกลาง")
    .trim(),
  phone: z.string()
    .max(20, "เบอร์โทรยาวเกินไป")
    .regex(/^[0-9-+().\s]*$/, "รูปแบบเบอร์โทรไม่ถูกต้อง")
    .optional()
    .or(z.literal("")),
  email: z.string()
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .max(254, "อีเมลยาวเกินไป")
    .optional()
    .or(z.literal("")),
  address: z.string()
    .max(500, "ที่อยู่ยาวเกินไป")
    .optional()
    .or(z.literal("")),
  branch: z.string()
    .max(100, "สาขายาวเกินไป")
    .optional()
    .or(z.literal("")),
  contactPerson: z.string()
    .max(100, "ชื่อผู้ติดต่อยาวเกินไป")
    .optional()
    .or(z.literal("")),
  taxId: z.string()
    .max(20, "เลขประจำตัวผู้เสียภาษียาวเกินไป")
    .optional()
    .or(z.literal("")),
  fax: z.string()
    .max(20, "เบอร์แฟกซ์ยาวเกินไป")
    .optional()
    .or(z.literal("")),
  creditLimit: z.number()
    .min(0, "วงเงินเครดิตต้องไม่น้อยกว่า 0")
    .max(9999999.99, "วงเงินเครดิตสูงเกินไป")
    .finite("วงเงินเครดิตไม่ถูกต้อง")
    .default(0),
  creditTerm: z.number()
    .min(0, "เทอมเครดิตต้องไม่น้อยกว่า 0")
    .max(365, "เทอมเครดิตสูงเกินไป")
    .finite("เทอมเครดิตไม่ถูกต้อง")
    .default(30),
  isActive: z.boolean().default(true),
})

export const debtorRecordSchema = z.object({
  customerName: z.string().min(1, "กรุณากรอกชื่อลูกค้า"),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  amount: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
})

// User Management schemas
export const createUserSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร").max(20, "ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร"),
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  role: z.enum(["ADMIN", "MANAGER", "USER"], {
    errorMap: () => ({ message: "กรุณาเลือกบทบาท" })
  }),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร").max(20, "ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร"),
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "USER"], {
    errorMap: () => ({ message: "กรุณาเลือกบทบาท" })
  }),
  isActive: z.boolean(),
})

export const resetUserPasswordSchema = z.object({
  newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่ไม่ตรงกัน",
  path: ["confirmPassword"],
})

export type RegisterFormData = z.infer<typeof registerSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type FuelTypeFormData = z.infer<typeof fuelTypeSchema>
export type TankFormData = z.infer<typeof tankSchema>
export type DispenserFormData = z.infer<typeof dispenserSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type ShiftFormData = z.infer<typeof shiftSchema>
export type DebtorFormData = z.infer<typeof debtorSchema>
export type DebtorRecordFormData = z.infer<typeof debtorRecordSchema>
export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type ResetUserPasswordFormData = z.infer<typeof resetUserPasswordSchema>
export type ProductPriceFormData = z.infer<typeof productPriceSchema>
export type BulkPriceUpdateFormData = z.infer<typeof bulkPriceUpdateSchema>