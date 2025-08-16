"use client"

import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import MeterManagement from '@/components/shifts/meter-management'
import TankComparison from '@/components/shifts/tank-comparison'
import SalesManagement from '@/components/shifts/sales-management'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ShiftTabs({ shiftId }: { shiftId: string }) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="meters">
        <TabsList>
          <TabsTrigger value="meters">มิเตอร์</TabsTrigger>
          <TabsTrigger value="tank">เทียบถัง</TabsTrigger>
          <TabsTrigger value="sales">ขายสินค้า</TabsTrigger>
        </TabsList>

        <TabsContent value="meters">
          <Card>
            <CardHeader>
              <CardTitle>มิเตอร์</CardTitle>
            </CardHeader>
            <CardContent>
              <MeterManagement shiftId={shiftId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tank">
          <Card>
            <CardHeader>
              <CardTitle>เทียบถัง</CardTitle>
            </CardHeader>
            <CardContent>
              <TankComparison shiftId={shiftId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>ขายสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesManagement shiftId={shiftId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
