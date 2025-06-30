'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/table'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Key,
  Users,
  Shield,
  Crown,
  User as UserIcon
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { 
  CreateUserFormData, 
  ResetUserPasswordFormData,
  createUserSchema,
  updateUserSchema,
  resetUserPasswordSchema
} from '@/lib/validations'

interface User {
  id: string
  username: string
  name: string
  email: string | null
  role: 'ADMIN' | 'MANAGER' | 'USER'
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    shifts: number
    debtorRecords: number
  }
}

const roleIcons = {
  ADMIN: Crown,
  MANAGER: Shield,
  USER: UserIcon,
}

const roleLabels = {
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  USER: 'พนักงาน',
}

const roleColors = {
  ADMIN: 'text-red-600 bg-red-50',
  MANAGER: 'text-blue-600 bg-blue-50',
  USER: 'text-green-600 bg-green-50',
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<Partial<CreateUserFormData>>({
    role: 'USER',
    isActive: true,
  })
  const [resetPasswordData, setResetPasswordData] = useState<Partial<ResetUserPasswordFormData>>({})

  // Check if user has permission to access this page
  const canAccess = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (canAccess) {
      fetchUsers()
    }
  }, [canAccess])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      createUserSchema.parse(formData)
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('สร้างผู้ใช้สำเร็จ')
        setShowCreateModal(false)
        setFormData({ role: 'USER', isActive: true })
        fetchUsers()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้')
      }
    } catch {
      toast.error('ข้อมูลไม่ถูกต้อง')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      updateUserSchema.parse(formData)
      
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('แก้ไขผู้ใช้สำเร็จ')
        setShowEditModal(false)
        setSelectedUser(null)
        setFormData({ role: 'USER', isActive: true })
        fetchUsers()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้')
      }
    } catch {
      toast.error('ข้อมูลไม่ถูกต้อง')
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`คุณต้องการลบผู้ใช้ ${user.name} หรือไม่?`)) return

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('ลบผู้ใช้สำเร็จ')
        fetchUsers()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบผู้ใช้')
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}/toggle-status`, {
        method: 'PATCH',
      })

      if (response.ok) {
        toast.success(`${user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ผู้ใช้สำเร็จ`)
        fetchUsers()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      resetUserPasswordSchema.parse(resetPasswordData)
      
      const response = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetPasswordData),
      })

      if (response.ok) {
        toast.success('รีเซ็ตรหัสผ่านสำเร็จ')
        setShowResetPasswordModal(false)
        setSelectedUser(null)
        setResetPasswordData({})
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน')
      }
    } catch {
      toast.error('ข้อมูลไม่ถูกต้อง')
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email || '',
      role: user.role,
      isActive: user.isActive,
    })
    setShowEditModal(true)
  }

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user)
    setResetPasswordData({})
    setShowResetPasswordModal(true)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600">คุณไม่มีสิทธิ์ในการเข้าถึงหน้าจัดการผู้ใช้</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
          <p className="text-gray-600">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มผู้ใช้ใหม่
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="ค้นหาผู้ใช้..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">ใช้งานอยู่</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <Crown className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">ผู้ดูแลระบบ</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'ADMIN').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">ผู้จัดการ</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'MANAGER').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <th>ผู้ใช้</th>
                <th>บทบาท</th>
                <th>สถานะ</th>
                <th>กิจกรรม</th>
                <th>วันที่สร้าง</th>
                {isAdmin && <th>การจัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const RoleIcon = roleIcons[user.role]
                return (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                        {user.email && (
                          <div className="text-sm text-gray-500">{user.email}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive
                          ? 'text-green-800 bg-green-100'
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {user.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900">
                        กะงาน: {user._count.shifts} | ลูกหนี้: {user._count.debtorRecords}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('th-TH')}
                      </div>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.id !== session?.user?.id && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.isActive ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openResetPasswordModal(user)}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">เพิ่มผู้ใช้ใหม่</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อผู้ใช้ *
                  </label>
                  <Input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ-นามสกุล *
                  </label>
                  <Input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสผ่าน *
                  </label>
                  <Input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    บทบาท *
                  </label>
                  <select
                    value={formData.role || 'USER'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'USER' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="USER">พนักงาน</option>
                    <option value="MANAGER">ผู้จัดการ</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    เปิดใช้งาน
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1">
                    สร้างผู้ใช้
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ role: 'USER', isActive: true })
                    }}
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">แก้ไขผู้ใช้</h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อผู้ใช้ *
                  </label>
                  <Input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ-นามสกุล *
                  </label>
                  <Input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    บทบาท *
                  </label>
                  <select
                    value={formData.role || 'USER'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'USER' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="USER">พนักงาน</option>
                    <option value="MANAGER">ผู้จัดการ</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    เปิดใช้งาน
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1">
                    บันทึก
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedUser(null)
                      setFormData({ role: 'USER', isActive: true })
                    }}
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">รีเซ็ตรหัสผ่าน</h2>
              <p className="text-gray-600 mb-4">
                รีเซ็ตรหัสผ่านสำหรับ {selectedUser.name}
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสผ่านใหม่ *
                  </label>
                  <Input
                    type="password"
                    value={resetPasswordData.newPassword || ''}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ยืนยันรหัสผ่านใหม่ *
                  </label>
                  <Input
                    type="password"
                    value={resetPasswordData.confirmPassword || ''}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1">
                    รีเซ็ตรหัสผ่าน
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowResetPasswordModal(false)
                      setSelectedUser(null)
                      setResetPasswordData({})
                    }}
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}