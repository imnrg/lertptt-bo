import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Fuel, Package, Clock } from 'lucide-react'

// Mock data - in real app this would come from database
const stats = [
  {
    name: 'จำนวนผู้ใช้งาน',
    value: '12',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    name: 'ประเภทเชื้อเพลิง',
    value: '4',
    icon: Fuel,
    color: 'bg-green-500',
  },
  {
    name: 'สินค้าทั้งหมด',
    value: '28',
    icon: Package,
    color: 'bg-yellow-500',
  },
  {
    name: 'กะงานวันนี้',
    value: '3',
    icon: Clock,
    color: 'bg-purple-500',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">แดชบอร์ด</h1>
        <p className="mt-2 text-sm text-gray-700">
          ภาพรวมของระบบจัดการปั๊มน้ำมัน
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.name}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${item.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {item.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity & Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>กิจกรรมล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    ผู้ใช้ใหม่เข้าร่วม
                  </p>
                  <p className="text-sm text-gray-500">
                    สมชาย ใจดี ได้สมัครเข้าใช้งานระบบ
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  2 ชั่วโมงที่แล้ว
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Fuel className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    เติมน้ำมันถัง A1
                  </p>
                  <p className="text-sm text-gray-500">
                    เติมน้ำมันเบนซิน 95 จำนวน 5,000 ลิตร
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  5 ชั่วโมงที่แล้ว
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    สินค้าใกล้หมด
                  </p>
                  <p className="text-sm text-gray-500">
                    น้ำมันเครื่อง Shell เหลือ 5 กล่อง
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  1 วันที่แล้ว
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Level Status */}
        <Card>
          <CardHeader>
            <CardTitle>สถานะระดับน้ำมันในถัง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>ถัง A1 - เบนซิน 95</span>
                  <span>75%</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>ถัง B1 - เบนซิน 91</span>
                  <span>45%</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>ถัง C1 - ดีเซล</span>
                  <span>85%</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>ถัง D1 - แก๊สโซฮอล์</span>
                  <span>20%</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{width: '20%'}}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}