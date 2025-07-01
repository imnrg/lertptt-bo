'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Fuel, 
  Gauge, 
  DollarSign,
  AlertTriangle,
  Activity,
  BarChart3
} from 'lucide-react'

interface FuelPrice {
  effectiveDate: string
  endDate: string | null
  isActive: boolean
}

interface DashboardStats {
  fuelTypes: {
    total: number
    active: number
  }
  tanks: {
    total: number
    lowLevel: number
    totalCapacity: number
    currentLevel: number
  }
  dispensers: {
    total: number
    active: number
  }
  prices: {
    total: number
    active: number
  }
}

export default function FuelManagementPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch fuel types
      const fuelTypesRes = await fetch('/api/fuel/types')
      const fuelTypes = await fuelTypesRes.json()

      // Fetch tanks
      const tanksRes = await fetch('/api/fuel/tanks')
      const tanks = await tanksRes.json()

      // Fetch dispensers
      const dispensersRes = await fetch('/api/fuel/dispensers')
      const dispensers = await dispensersRes.json()

      // Fetch fuel prices
      const pricesRes = await fetch('/api/fuel/prices')
      const prices = await pricesRes.json()

      // Calculate stats
      const totalCapacity = tanks.reduce((sum: number, tank: { capacity: number }) => sum + tank.capacity, 0)
      const currentLevel = tanks.reduce((sum: number, tank: { currentLevel: number }) => sum + tank.currentLevel, 0)
      const lowLevelTanks = tanks.filter((tank: { currentLevel: number; minLevel: number }) => tank.currentLevel <= tank.minLevel).length

      const activePrices = prices.filter((price: FuelPrice) => {
        const now = new Date()
        const effectiveDate = new Date(price.effectiveDate)
        const endDate = price.endDate ? new Date(price.endDate) : null
        return effectiveDate <= now && (!endDate || endDate > now) && price.isActive
      }).length

      setStats({
        fuelTypes: {
          total: fuelTypes.length,
          active: fuelTypes.filter((ft: { isActive: boolean }) => ft.isActive).length
        },
        tanks: {
          total: tanks.length,
          lowLevel: lowLevelTanks,
          totalCapacity,
          currentLevel
        },
        dispensers: {
          total: dispensers.length,
          active: dispensers.filter((d: { isActive: boolean }) => d.isActive).length
        },
        prices: {
          total: prices.length,
          active: activePrices
        }
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateFillPercentage = () => {
    if (!stats || stats.tanks.totalCapacity === 0) return 0
    return (stats.tanks.currentLevel / stats.tanks.totalCapacity) * 100
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการเชื้อเพลิง</h1>
          <p className="text-gray-600 mt-1">ภาพรวมระบบจัดการเชื้อเพลิงและผลิตภัณฑ์</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ประเภทเชื้อเพลิง</CardTitle>
            <Fuel className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fuelTypes.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              ใช้งาน: {stats?.fuelTypes.active || 0} ประเภท
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ถังเก็บน้ำมัน</CardTitle>
            <Gauge className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tanks.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              ระดับต่ำ: {stats?.tanks.lowLevel || 0} ถัง
            </p>
            {stats?.tanks.lowLevel && stats.tanks.lowLevel > 0 && (
              <div className="flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                <span className="text-xs text-red-600">ต้องเติมน้ำมัน</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หัวจ่าย</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dispensers.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              ใช้งาน: {stats?.dispensers.active || 0} หัว
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ระดับน้ำมันรวม</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateFillPercentage().toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(calculateFillPercentage(), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.tanks.currentLevel.toLocaleString()} / {stats?.tanks.totalCapacity.toLocaleString()} ลิตร
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/fuel/types">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-colors">
                <Fuel className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">ประเภทเชื้อเพลิง</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                จัดการประเภทเชื้อเพลิงต่างๆ เช่น เบนซิน 95, แก๊สโซฮอล์ E20
              </p>
              <Button className="w-full mt-4" variant="outline">
                จัดการประเภทเชื้อเพลิง
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/fuel/tanks">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto group-hover:bg-green-200 transition-colors">
                <Gauge className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">ถังเก็บน้ำมัน</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                ตรวจสอบและจัดการถังเก็บน้ำมัน ระดับน้ำมัน และความจุ
              </p>
              <Button className="w-full mt-4" variant="outline">
                จัดการถังเก็บ
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/fuel/dispensers">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto group-hover:bg-purple-200 transition-colors">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">หัวจ่าย</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                จัดการหัวจ่ายน้ำมัน เชื่อมต่อกับถังและตรวจสอบสถานะ
              </p>
              <Button className="w-full mt-4" variant="outline">
                จัดการหัวจ่าย
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/fuel/prices">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto group-hover:bg-orange-200 transition-colors">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">จัดการราคา</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                กำหนดราคาผลิตภัณฑ์ ราคามีผล และอัปเดตราคาหลายรายการ
              </p>
              <Button className="w-full mt-4" variant="outline">
                จัดการราคา
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alert Section */}
      {stats?.tanks.lowLevel && stats.tanks.lowLevel > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              แจ้งเตือนระดับน้ำมันต่ำ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              มีถังน้ำมัน {stats.tanks.lowLevel} ถัง ที่มีระดับน้ำมันต่ำกว่าระดับขั้นต่ำที่กำหนด 
              กรุณาตรวจสอบและเติมน้ำมันโดยเร็วที่สุด
            </p>
            <Link href="/fuel/tanks">
              <Button className="mt-3" variant="destructive" size="sm">
                ตรวจสอบถังน้ำมัน
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}