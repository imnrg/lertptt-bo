'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { 
  DollarSign, 
  Package, 
  Fuel, 
  Search,
  TrendingUp,
  Calendar,
  BarChart3,
  Plus,
  Edit,
  X
} from 'lucide-react'
import { formatThaiDate, getBangkokTime, handleNumericInputChange, safeNumberConversion } from '@/lib/utils'

interface FuelType {
  id: string
  name: string
  code: string
  description?: string
  isActive: boolean
  createdAt: string
}

interface FuelPrice {
  id: string
  fuelTypeId: string
  price: number
  effectiveDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
  fuelType: {
    id: string
    name: string
    code: string
  }
}

export default function FuelPriceManagementPage() {
  const { alertState, loadingState, showAlert, showLoading, hideLoading, closeAlert } = useAlert()
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  // Price form data for all fuel types
  const [priceFormData, setPriceFormData] = useState<{
    [key: string]: {
      price: string
    }
  }>({})

  // Helper functions - move before they are used
  const getCurrentPrices = () => {
    const now = getBangkokTime()
    return fuelPrices.filter(price => {
      const effectiveDate = new Date(price.effectiveDate)
      const endDate = price.endDate ? new Date(price.endDate) : null
      return effectiveDate <= now && (!endDate || endDate > now) && price.isActive
    })
  }

  // ฟังก์ชันสำหรับแสดงสีตามประเภทน้ำมัน
  const getFuelTypeColor = (fuelTypeCode: string) => {
    const colors: Record<string, string> = {
      'GASOHOL_91': 'bg-green-100 text-green-800',
      'GASOHOL_95': 'bg-blue-100 text-blue-800',
      'BENZINE_91': 'bg-yellow-100 text-yellow-800',
      'BENZINE_95': 'bg-orange-100 text-orange-800',
      'DIESEL': 'bg-red-100 text-red-800',
      'E20': 'bg-purple-100 text-purple-800',
      'E85': 'bg-indigo-100 text-indigo-800',
    }
    return colors[fuelTypeCode] || 'bg-gray-100 text-gray-800'
  }

  const fetchFuelTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/fuel/types')
      if (response.ok) {
        const data = await response.json()
        const activeFuelTypes = data.filter((fuelType: FuelType) => fuelType.isActive)
        setFuelTypes(activeFuelTypes)
        return activeFuelTypes
      }
    } catch (error) {
      console.error('Error fetching fuel types:', error)
    }
    return []
  }, [])

  const fetchFuelPrices = useCallback(async () => {
    try {
      const response = await fetch('/api/fuel/prices')
      if (response.ok) {
        const data = await response.json()
        setFuelPrices(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching fuel prices:', error)
    }
    return []
  }, [])

  const initializePriceFormData = useCallback((fuelTypes: FuelType[], fuelPrices: FuelPrice[]) => {
    const initialPriceData: { [key: string]: { price: string } } = {}
    fuelTypes.forEach((fuelType: FuelType) => {
      const currentPrice = fuelPrices.find(price => 
        price.fuelTypeId === fuelType.id && 
        price.isActive &&
        new Date(price.effectiveDate) <= getBangkokTime() &&
        (!price.endDate || new Date(price.endDate) > getBangkokTime())
      )
      
      initialPriceData[fuelType.id] = {
        price: currentPrice?.price.toString() || ''
      }
    })
    setPriceFormData(initialPriceData)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // โหลดข้อมูลทั้งสามแบบพร้อมกัน
        const [fuelTypesData, fuelPricesData] = await Promise.all([
          fetchFuelTypes(),
          fetchFuelPrices(),
        ])
        
        // กำหนดค่าเริ่มต้นสำหรับฟอร์มราคา
        if (fuelTypesData.length > 0) {
          initializePriceFormData(fuelTypesData, fuelPricesData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [fetchFuelTypes, fetchFuelPrices, initializePriceFormData])

  // Get latest update date from current prices
  const getLatestUpdateDate = () => {
    const currentPrices = getCurrentPrices()
    if (currentPrices.length === 0) return null
    
    // หาวันที่ effectiveDate ล่าสุดจากราคาปัจจุบัน
    const sortedPrices = currentPrices.sort((a, b) => 
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    )
    return sortedPrices[0]?.effectiveDate
  }

  // Filter fuel types based on search term (for modal)
  const filteredFuelTypesForModal = fuelTypes.filter(fuelType =>
    fuelType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fuelType.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate enhanced stats
  const currentPrices = getCurrentPrices()
  const totalUpdatesToday = currentPrices.filter(price => {
    const today = new Date()
    const priceDate = new Date(price.createdAt)
    return priceDate.toDateString() === today.toDateString()
  }).length

  const averagePrice = currentPrices.length > 0 
    ? currentPrices.reduce((sum, price) => sum + price.price, 0) / currentPrices.length 
    : 0

  const latestUpdateDate = getLatestUpdateDate()

  const handleOpenUpdateModal = () => {
    // Clear form data when opening modal
    const clearedFormData: { [key: string]: { price: string } } = {}
    fuelTypes.forEach((fuelType) => {
      clearedFormData[fuelType.id] = { price: '' }
    })
    setPriceFormData(clearedFormData)
    setShowUpdateModal(true)
  }

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false)
    setSearchTerm('') // Clear search when closing modal
  }

  const handleBulkPriceUpdateInModal = async () => {
    const validFormData = Object.entries(priceFormData).filter(([, data]) => {
      const priceValue = typeof data.price === 'string' ? data.price : data.price
      return priceValue && safeNumberConversion(priceValue) > 0
    })
    
    if (validFormData.length === 0) {
      showAlert('กรุณาระบุราคาอย่างน้อย 1 ประเภท', 'warning')
      return
    }

    try {
      showLoading(`กำลังอัปเดตราคาเชื้อเพลิง ${validFormData.length} ประเภท...`)
      
      const bulkData = {
        fuelTypes: validFormData.map(([fuelTypeId, data]) => ({
          fuelTypeId,
          price: safeNumberConversion(data.price)
        }))
      }

      const response = await fetch('/api/fuel/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkData),
      })

      if (response.ok) {
        // โหลดข้อมูลใหม่ทั้งราคาปัจจุบันและประวัติราคา
        await Promise.all([fetchFuelPrices()])
        
        handleCloseUpdateModal()
        hideLoading()
        showAlert('อัปเดตราคาเชื้อเพลิงทั้งหมดสำเร็จ', 'success')
      } else {
        const error = await response.json()
        hideLoading()
        showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
      }
    } catch (error) {
      console.error('Error bulk updating fuel prices:', error)
      hideLoading()
      showAlert('เกิดข้อผิดพลาด', 'error')
    }
  }

  const updatePriceFormData = (fuelTypeId: string, field: string, value: string | number) => {
    setPriceFormData(prev => ({
      ...prev,
      [fuelTypeId]: {
        ...prev[fuelTypeId],
        [field]: value
      }
    }))
  }

  const handlePriceInputChange = (fuelTypeId: string, value: string) => {
    handleNumericInputChange(value, (formattedValue) => {
      updatePriceFormData(fuelTypeId, 'price', formattedValue)
    }, {
      allowNegative: false,
      decimalPlaces: 2,
      minValue: 0,
      maxValue: 999.99
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Fuel className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p>กำลังโหลดข้อมูลราคาเชื้อเพลิง...</p>
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
            <h1 className="text-2xl font-bold">จัดการราคาเชื้อเพลิง</h1>
            <p className="text-gray-600">กำหนดและควบคุมราคาเชื้อเพลิงแต่ละประเภท</p>
          </div>
        </div>
        <Button onClick={handleOpenUpdateModal} disabled={loadingState.isLoading}>
          <Edit className="mr-2 h-4 w-4" />
          อัพเดทราคา
        </Button>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ราคาปัจจุบัน</p>
                <p className="text-2xl font-bold">{currentPrices.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ประเภทเชื้อเพลิง</p>
                <p className="text-2xl font-bold">{fuelTypes.length}</p>
              </div>
              <Fuel className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">อัพเดทวันนี้</p>
                <p className="text-2xl font-bold">{totalUpdatesToday}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ราคาเฉลี่ย</p>
                <p className="text-2xl font-bold">฿{averagePrice.toFixed(2)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Prices Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              ราคาเชื้อเพลิงปัจจุบัน
            </CardTitle>
            {latestUpdateDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>อัพเดทล่าสุด: {formatThaiDate(latestUpdateDate)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentPrices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Fuel className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ยังไม่มีการกำหนดราคาเชื้อเพลิง</p>
              <Button 
                onClick={handleOpenUpdateModal}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                กำหนดราคา
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPrices.map((price) => (
                <div key={price.id} className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{price.fuelType.name}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getFuelTypeColor(price.fuelType.code)}`}>
                          {price.fuelType.code}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        ฿{price.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">บาท/ลิตร</div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      มีผลตั้งแต่: {formatThaiDate(price.effectiveDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Price Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  อัปเดตราคาเชื้อเพลิง
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseUpdateModal}
                  disabled={loadingState.isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Search within modal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ค้นหาเชื้อเพลิง
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="ค้นหาชื่อเชื้อเพลิง หรือรหัส..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Price Forms */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">ราคาเชื้อเพลิงแต่ละประเภท</h3>
                    <p className="text-sm text-gray-500">
                      ราคา ณ วันที่ {formatThaiDate(new Date().toISOString())}
                    </p>
                  </div>
                  
                  {filteredFuelTypesForModal.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>ไม่พบประเภทเชื้อเพลิงที่ค้นหา</p>
                      <Button 
                        onClick={() => setSearchTerm('')}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        ล้างการค้นหา
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {filteredFuelTypesForModal.map((fuelType) => {
                        const currentPrice = getCurrentPrices().find(price => price.fuelTypeId === fuelType.id)
                        const formData = priceFormData[fuelType.id] || { price: '' }
                        
                        return (
                          <div key={fuelType.id} className="border rounded-lg p-4 shadow-sm bg-white">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                              <div className="lg:col-span-1">
                                <div className="space-y-2">
                                  <div className="font-medium text-lg">{fuelType.name}</div>
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getFuelTypeColor(fuelType.code)}`}>
                                      {fuelType.code} 
                                    </span>
                                  </div>
                                  {fuelType.description && (
                                    <p className="text-sm text-gray-500">{fuelType.description}</p>
                                  )}
                                </div>
                              </div>                        
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ราคาปัจจุบัน</label>
                                <div className="text-2xl font-bold text-green-600">
                                  {currentPrice ? `฿${currentPrice.price.toFixed(2)}` : 'ยังไม่กำหนด'}
                                </div>
                                <div className="text-xs text-gray-500">บาท/ลิตร</div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ราคาใหม่ *</label>
                                <Input
                                  type="text"
                                  value={formData.price}
                                  onChange={(e) => handlePriceInputChange(fuelType.id, e.target.value)}
                                  placeholder="0.00"
                                  disabled={loadingState.isLoading}
                                  className="text-lg"
                                />
                                <div className="text-xs text-gray-500 mt-1">บาท/ลิตร</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button 
                    onClick={handleBulkPriceUpdateInModal}
                    className="flex-1"
                    disabled={loadingState.isLoading}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    อัปเดตราคาทั้งหมด
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseUpdateModal}
                    className="flex-1"
                    disabled={loadingState.isLoading}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
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