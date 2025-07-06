'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
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
  const { alertState, loadingState, showAlert, showLoading, hideLoading, showConfirm, closeAlert } = useAlert()
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
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    // Don't fetch if session is not ready or user doesn't have access
    if (!session || !canAccess) {
      setLoading(false)
      return
    }

    try {
      console.log('Fetching users...') // Debug log
      
      const response = await fetch('/api/users')
      console.log('Response status:', response.status) // Debug response
      
      if (response.ok) {
        const data = await response.json()
        console.log('Users data:', data) // Debug data
        setUsers(data)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData) // Debug error
        showAlert(`เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ${errorData.error || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      console.error('Fetch error:', error) // Debug catch error
      showAlert(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Refetch when session or access permission changes
  useEffect(() => {
    if (session) {
      fetchUsers()
    }
  }, [session, canAccess])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      createUserSchema.parse(formData)
      
      showLoading('กำลังสร้างผู้ใช้...')
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        hideLoading()
        showAlert('สร้างผู้ใช้สำเร็จ', 'success')
        setShowCreateModal(false)
        setFormData({ role: 'USER', isActive: true })
        fetchUsers()
      } else {
        const errorData = await response.json()
        hideLoading()
        showAlert(errorData.error || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้', 'error')
      }
    } catch {
      hideLoading()
      showAlert('ข้อมูลไม่ถูกต้อง', 'error')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      updateUserSchema.parse(formData)
      
      showLoading('กำลังแก้ไขผู้ใช้...')
      
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        hideLoading()
        showAlert('แก้ไขผู้ใช้สำเร็จ', 'success')
        setShowEditModal(false)
        setSelectedUser(null)
        setFormData({ role: 'USER', isActive: true })
        fetchUsers()
      } else {
        const errorData = await response.json()
        hideLoading()
        showAlert(errorData.error || 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้', 'error')
      }
    } catch {
      hideLoading()
      showAlert('ข้อมูลไม่ถูกต้อง', 'error')
    }
  }

  const handleDeleteUser = async (user: User) => {
    showConfirm(
      `คุณต้องการลบผู้ใช้ ${user.name} หรือไม่?`,
      async () => {
        try {
          showLoading('กำลังลบผู้ใช้...')
          
          const response = await fetch(`/api/users/${user.id}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            hideLoading()
            showAlert('ลบผู้ใช้สำเร็จ', 'success')
            fetchUsers()
          } else {
            const errorData = await response.json()
            hideLoading()
            showAlert(errorData.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้', 'error')
          }
        } catch {
          hideLoading()
          showAlert('เกิดข้อผิดพลาดในการลบผู้ใช้', 'error')
        }
      },
      'ยืนยันการลบ',
      'ลบ',
      'ยกเลิก'
    )
  }

  const handleToggleStatus = async (user: User) => {
    try {
      showLoading(`กำลัง${user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ผู้ใช้...`)
      
      const response = await fetch(`/api/users/${user.id}/toggle-status`, {
        method: 'PATCH',
      })

      if (response.ok) {
        hideLoading()
        showAlert(`${user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ผู้ใช้สำเร็จ`, 'success')
        fetchUsers()
      } else {
        const errorData = await response.json()
        hideLoading()
        showAlert(errorData.error || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้', 'error')
      }
    } catch {
      hideLoading()
      showAlert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้', 'error')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      resetUserPasswordSchema.parse(resetPasswordData)
      
      showLoading('กำลังรีเซ็ตรหัสผ่าน...')
      
      const response = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetPasswordData),
      })

      if (response.ok) {
        hideLoading()
        showAlert('รีเซ็ตรหัสผ่านสำเร็จ', 'success')
        setShowResetPasswordModal(false)
        setSelectedUser(null)
        setResetPasswordData({})
      } else {
        const errorData = await response.json()
        hideLoading()
        showAlert(errorData.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน', 'error')
      }
    } catch {
      hideLoading()
      showAlert('ข้อมูลไม่ถูกต้อง', 'error')
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
      <div className="p-6 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-gray-600">คุณไม่มีสิทธิ์ในการเข้าถึงหน้าจัดการผู้ใช้</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p>กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">จัดการผู้ใช้</h1>
            <p className="text-gray-600">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มผู้ใช้ใหม่
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ผู้ใช้ทั้งหมด</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ใช้งานอยู่</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ผู้ดูแลระบบ</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
              <Crown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ผู้จัดการ</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'MANAGER').length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            ค้นหาผู้ใช้
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="ค้นหาชื่อ, ชื่อผู้ใช้, หรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการผู้ใช้</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบผู้ใช้</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  {isAdmin && <TableHead>การจัดการ</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const RoleIcon = roleIcons[user.role]
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                          {user.email && (
                            <div className="text-sm text-gray-500">{user.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {roleLabels[user.role]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'text-green-800 bg-green-100'
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {user.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(user)}
                              disabled={loadingState.isLoading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.id !== session?.user?.id && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleStatus(user)}
                                  disabled={loadingState.isLoading}
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
                                  disabled={loadingState.isLoading}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 hover:text-red-700"
                                  disabled={loadingState.isLoading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>เพิ่มผู้ใช้ใหม่</CardTitle>
            </CardHeader>
            <CardContent>
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
                  />
                  <label className="text-sm font-medium text-gray-700">
                    เปิดใช้งาน
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={loadingState.isLoading}>
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
                    disabled={loadingState.isLoading}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>แก้ไขผู้ใช้</CardTitle>
            </CardHeader>
            <CardContent>
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
                  />
                  <label className="text-sm font-medium text-gray-700">
                    เปิดใช้งาน
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={loadingState.isLoading}>
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
                    disabled={loadingState.isLoading}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>รีเซ็ตรหัสผ่าน</CardTitle>
            </CardHeader>
            <CardContent>
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
                    disabled={loadingState.isLoading}
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
                    disabled={loadingState.isLoading}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={loadingState.isLoading}>
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
                    disabled={loadingState.isLoading}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
        showCancel={alertState.showCancel}
      />

      {/* Loading Modal */}
      <LoadingModal loadingState={loadingState} />
    </div>
  )
}