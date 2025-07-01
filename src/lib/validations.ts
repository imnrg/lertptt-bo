import { z } from "zod"

// Authentication schemas
export const registerSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร").max(20, "ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร"),
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional(),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
})

export const loginSchema = z.object({
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
})

export const forgotPasswordSchema = z.object({
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
  newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่ไม่ตรงกัน",
  path: ["confirmPassword"],
})

export const updateProfileSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร").max(20, "ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
})

// Fuel Management schemas
export const fuelTypeSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อประเภทเชื้อเพลิง"),
  code: z.string().min(1, "กรุณากรอกรหัสประเภทเชื้อเพลิง"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const tankSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อถัง"),
  code: z.string().min(1, "กรุณากรอกรหัสถัง"),
  capacity: z.number().positive("ความจุต้องมากกว่า 0"),
  currentLevel: z.number().min(0, "ระดับปัจจุบันต้องไม่น้อยกว่า 0"),
  minLevel: z.number().min(0, "ระดับขั้นต่ำต้องไม่น้อยกว่า 0"),
  maxLevel: z.number().optional(),
  fuelTypeId: z.string().min(1, "กรุณาเลือกประเภทเชื้อเพลิง"),
  location: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const dispenserSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อตู้จ่าย"),
  code: z.string().min(1, "กรุณากรอกรหัสตู้จ่าย"),
  tankId: z.string().min(1, "กรุณาเลือกถัง"),
  fuelTypeId: z.string().min(1, "กรุณาเลือกประเภทเชื้อเพลิง"),
  location: z.string().optional(),
  isActive: z.boolean().default(true),
})

// Product Management schemas
export const productSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  code: z.string().min(1, "กรุณากรอกรหัสสินค้า"),
  description: z.string().optional(),
  cost: z.number().positive("ต้นทุนต้องมากกว่า 0").optional(),
  fuelTypeId: z.string().optional(),
  category: z.string().optional(),
  stockQuantity: z.number().min(0, "จำนวนสต็อกต้องไม่น้อยกว่า 0"),
  minStock: z.number().min(0, "สต็อกขั้นต่ำต้องไม่น้อยกว่า 0"),
  unit: z.string().default("ลิตร"),
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
export type DebtorRecordFormData = z.infer<typeof debtorRecordSchema>
export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type ResetUserPasswordFormData = z.infer<typeof resetUserPasswordSchema>
export type ProductPriceFormData = z.infer<typeof productPriceSchema>
export type BulkPriceUpdateFormData = z.infer<typeof bulkPriceUpdateSchema>