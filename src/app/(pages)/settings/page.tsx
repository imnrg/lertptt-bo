import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Lock, Palette, Bell } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">ตั้งค่า</h1>
        <p className="mt-2 text-sm text-gray-700">
          จัดการการตั้งค่าบัญชีและระบบ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              ข้อมูลโปรไฟล์
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ชื่อ-นามสกุล</label>
              <Input defaultValue="สมชาย ใจดี" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">อีเมล</label>
              <Input type="email" defaultValue="somchai@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">บทบาท</label>
              <Input defaultValue="ผู้ดูแลระบบ" disabled />
            </div>
            <Button className="w-full">บันทึกการเปลี่ยนแปลง</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              ความปลอดภัย
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">รหัสผ่านปัจจุบัน</label>
              <Input type="password" placeholder="กรอกรหัสผ่านปัจจุบัน" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">รหัสผ่านใหม่</label>
              <Input type="password" placeholder="กรอกรหัสผ่านใหม่" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ยืนยันรหัสผ่านใหม่</label>
              <Input type="password" placeholder="ยืนยันรหัสผ่านใหม่" />
            </div>
            <Button className="w-full">เปลี่ยนรหัสผ่าน</Button>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              ธีม
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input type="radio" id="light" name="theme" value="light" defaultChecked />
                <label htmlFor="light" className="text-sm font-medium">ธีมสว่าง</label>
              </div>
              <div className="flex items-center space-x-3">
                <input type="radio" id="dark" name="theme" value="dark" />
                <label htmlFor="dark" className="text-sm font-medium">ธีมมืด</label>
              </div>
              <div className="flex items-center space-x-3">
                <input type="radio" id="system" name="theme" value="system" />
                <label htmlFor="system" className="text-sm font-medium">ตามระบบ</label>
              </div>
            </div>
            <Button className="w-full">บันทึกการตั้งค่า</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              การแจ้งเตือน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">แจ้งเตือนระดับน้ำมันต่ำ</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">แจ้งเตือนสินค้าใกล้หมด</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">แจ้งเตือนลูกหนี้เกินกำหนด</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">แจ้งเตือนผลัดงานเริ่มต้น</label>
                <input type="checkbox" className="rounded" />
              </div>
            </div>
            <Button className="w-full">บันทึกการตั้งค่า</Button>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">พื้นที่อันตราย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">ลบบัญชี</h3>
            <p className="text-sm text-red-700 mb-3">
              การลบบัญชีจะไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะหายไปถาวร
            </p>
            <Button variant="destructive" size="sm">
              ลบบัญชี
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}