-- test_data_fuel_tanks_dispensers.sql
-- ข้อมูลทดสอบ (สำหรับรันเองเท่านั้น) — ไม่ใช่ seed ของโปรดักชัน
-- รันด้วย: psql -d lertptt_db -f scripts/test_data_fuel_tanks_dispensers.sql

BEGIN;

-- === Fuel types (เชื้อเพลิง) ===
-- ใช้ชื่อที่ใกล้เคียงกับผลิตภัณฑ์ที่ขายจริงของ ปตท. (ตัวอย่างข้อมูลทดสอบ)
INSERT INTO "FuelType" (id, name, code, description, "isActive", "createdAt", "updatedAt")
VALUES
  ('ft_gasohol_91', 'แก๊สโซฮอล์ 91', 'G91', 'แก๊สโซฮอล์ 91 (เชื้อเพลิงมาตรฐาน)', true, NOW(), NOW()),
  ('ft_gasohol_95', 'แก๊สโซฮอล์ 95', 'G95', 'แก๊สโซฮอล์ 95', true, NOW(), NOW()),
  ('ft_premium_95', 'เบนซิน 95', 'P95', 'เบนซิน 95 (พรีเมียม)', true, NOW(), NOW()),
  ('ft_e20', 'E20', 'E20', 'แก๊สโซฮอล์ E20', true, NOW(), NOW()),
  ('ft_diesel_b7', 'ดีเซล B7', 'D-B7', 'ดีเซล B7', true, NOW(), NOW()),
  ('ft_diesel_b10', 'ดีเซล B10', 'D-B10', 'ดีเซล B10', true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      "isActive" = EXCLUDED."isActive",
      "updatedAt" = NOW();

-- === Current fuel prices (ราคาปัจจุบัน) ===
-- แทรกราคาล่าสุดเป็นข้อมูลทดสอบ (หน่วย: บาท/ลิตร)
INSERT INTO "FuelPrice" (id, "fuelTypeId", price, "effectiveDate", "isActive", "createdAt", "updatedAt")
VALUES
  ('fp_g91_now', 'ft_gasohol_91', 30.29, NOW(), true, NOW(), NOW()),
  ('fp_g95_now', 'ft_gasohol_95', 35.99, NOW(), true, NOW(), NOW()),
  ('fp_p95_now', 'ft_premium_95', 37.50, NOW(), true, NOW(), NOW()),
  ('fp_e20_now', 'ft_e20', 29.50, NOW(), true, NOW(), NOW()),
  ('fp_d_b7_now', 'ft_diesel_b7', 28.75, NOW(), true, NOW(), NOW()),
  ('fp_d_b10_now', 'ft_diesel_b10', 27.80, NOW(), true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET price = EXCLUDED.price,
      "updatedAt" = NOW();

-- === Tanks (ถัง) ===
-- สร้างทั้งหมด 10 ถัง ตัวอย่างการกระจายเชื้อเพลิง
INSERT INTO "Tank" (
  id, name, code, capacity, "currentLevel", "minLevel", "maxLevel",
  "fuelTypeId", "isActive", location, "createdAt", "updatedAt"
)
VALUES
  ('tank_001', 'ถัง G91 - ช่อง A', 'T-001', 10000, 6200, 500, 10000, 'ft_gasohol_91', true, 'เกาะกลาง A', NOW(), NOW()),
  ('tank_002', 'ถัง G91 - ช่อง B', 'T-002', 10000, 4800, 500, 10000, 'ft_gasohol_91', true, 'เกาะกลาง B', NOW(), NOW()),
  ('tank_003', 'ถัง G95', 'T-003', 9000, 4300, 400, 9000, 'ft_gasohol_95', true, 'ฝั่งตะวันตก', NOW(), NOW()),
  ('tank_004', 'ถัง P95', 'T-004', 8000, 3500, 400, 8000, 'ft_premium_95', true, 'ฝั่งตะวันตก-2', NOW(), NOW()),
  ('tank_005', 'ถัง E20', 'T-005', 7000, 1800, 200, 7000, 'ft_e20', true, 'คลังสำรอง', NOW(), NOW()),
  ('tank_006', 'ถัง ดีเซล B7 - 1', 'T-006', 12000, 9200, 800, 12000, 'ft_diesel_b7', true, 'หลังปั๊ม โซนกลาง', NOW(), NOW()),
  ('tank_007', 'ถัง ดีเซล B7 - 2', 'T-007', 12000, 7600, 800, 12000, 'ft_diesel_b7', true, 'หลังปั๊ม โซนกลาง-2', NOW(), NOW()),
  ('tank_008', 'ถัง ดีเซล B10', 'T-008', 11000, 6000, 700, 11000, 'ft_diesel_b10', true, 'หลังปั๊ม โซนเหนือ', NOW(), NOW()),
  ('tank_009', 'ถัง สำรอง G95', 'T-009', 6000, 1200, 200, 6000, 'ft_gasohol_95', true, 'คลังสำรอง 2', NOW(), NOW()),
  ('tank_010', 'ถัง สำรอง P95', 'T-010', 6000, 900, 200, 6000, 'ft_premium_95', true, 'คลังสำรอง 3', NOW(), NOW())
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      capacity = EXCLUDED.capacity,
      "currentLevel" = EXCLUDED."currentLevel",
      "minLevel" = EXCLUDED."minLevel",
      "maxLevel" = EXCLUDED."maxLevel",
      "fuelTypeId" = EXCLUDED."fuelTypeId",
      "isActive" = EXCLUDED."isActive",
      location = EXCLUDED.location,
      "updatedAt" = NOW();

-- === Dispensers (หัวจ่าย) ===
-- สร้าง 30 หัวจ่าย กระจายไปยัง 10 ถัง (3 หัว/ถัง)
INSERT INTO "Dispenser" (
  id, name, code, "tankId", "fuelTypeId", "isActive", location, "createdAt", "updatedAt"
)
VALUES
  -- tank_001 (T-001)
  ('disp_001','หัวจ่าย 001','D-001','tank_001','ft_gasohol_91',true,'เกาะกลาง A - จุด 1',NOW(),NOW()),
  ('disp_002','หัวจ่าย 002','D-002','tank_001','ft_gasohol_91',true,'เกาะกลาง A - จุด 2',NOW(),NOW()),
  ('disp_003','หัวจ่าย 003','D-003','tank_001','ft_gasohol_91',true,'เกาะกลาง A - จุด 3',NOW(),NOW()),
  -- tank_002 (T-002)
  ('disp_004','หัวจ่าย 004','D-004','tank_002','ft_gasohol_91',true,'เกาะกลาง B - จุด 1',NOW(),NOW()),
  ('disp_005','หัวจ่าย 005','D-005','tank_002','ft_gasohol_91',true,'เกาะกลาง B - จุด 2',NOW(),NOW()),
  ('disp_006','หัวจ่าย 006','D-006','tank_002','ft_gasohol_91',true,'เกาะกลาง B - จุด 3',NOW(),NOW()),
  -- tank_003 (T-003)
  ('disp_007','หัวจ่าย 007','D-007','tank_003','ft_gasohol_95',true,'ฝั่งตะวันตก - จุด 1',NOW(),NOW()),
  ('disp_008','หัวจ่าย 008','D-008','tank_003','ft_gasohol_95',true,'ฝั่งตะวันตก - จุด 2',NOW(),NOW()),
  ('disp_009','หัวจ่าย 009','D-009','tank_003','ft_gasohol_95',true,'ฝั่งตะวันตก - จุด 3',NOW(),NOW()),
  -- tank_004 (T-004)
  ('disp_010','หัวจ่าย 010','D-010','tank_004','ft_premium_95',true,'ฝั่งตะวันตก-2 - จุด 1',NOW(),NOW()),
  ('disp_011','หัวจ่าย 011','D-011','tank_004','ft_premium_95',true,'ฝั่งตะวันตก-2 - จุด 2',NOW(),NOW()),
  ('disp_012','หัวจ่าย 012','D-012','tank_004','ft_premium_95',true,'ฝั่งตะวันตก-2 - จุด 3',NOW(),NOW()),
  -- tank_005 (T-005)
  ('disp_013','หัวจ่าย 013','D-013','tank_005','ft_e20',true,'คลังสำรอง - จุด 1',NOW(),NOW()),
  ('disp_014','หัวจ่าย 014','D-014','tank_005','ft_e20',true,'คลังสำรอง - จุด 2',NOW(),NOW()),
  ('disp_015','หัวจ่าย 015','D-015','tank_005','ft_e20',true,'คลังสำรอง - จุด 3',NOW(),NOW()),
  -- tank_006 (T-006)
  ('disp_016','หัวจ่าย 016','D-016','tank_006','ft_diesel_b7',true,'หลังปั๊ม โซนกลาง - จุด 1',NOW(),NOW()),
  ('disp_017','หัวจ่าย 017','D-017','tank_006','ft_diesel_b7',true,'หลังปั๊ม โซนกลาง - จุด 2',NOW(),NOW()),
  ('disp_018','หัวจ่าย 018','D-018','tank_006','ft_diesel_b7',true,'หลังปั๊ม โซนกลาง - จุด 3',NOW(),NOW()),
  -- tank_007 (T-007)
  ('disp_019','หัวจ่าย 019','D-019','tank_007','ft_diesel_b7',true,'หลังปั๊ม โซนกลาง-2 - จุด 1',NOW(),NOW()),
  ('disp_020','หัวจ่าย 020','D-020','tank_007','ft_diesel_b7',true,'หลังปั๊ม โซนกลาง-2 - จุด 2',NOW(),NOW()),
  ('disp_021','หัวจ่าย 021','D-021','tank_007','ft_diesel_b7',true,'หลังปั๊ม โซนกลาง-2 - จุด 3',NOW(),NOW()),
  -- tank_008 (T-008)
  ('disp_022','หัวจ่าย 022','D-022','tank_008','ft_diesel_b10',true,'หลังปั๊ม โซนเหนือ - จุด 1',NOW(),NOW()),
  ('disp_023','หัวจ่าย 023','D-023','tank_008','ft_diesel_b10',true,'หลังปั๊ม โซนเหนือ - จุด 2',NOW(),NOW()),
  ('disp_024','หัวจ่าย 024','D-024','tank_008','ft_diesel_b10',true,'หลังปั๊ม โซนเหนือ - จุด 3',NOW(),NOW()),
  -- tank_009 (T-009)
  ('disp_025','หัวจ่าย 025','D-025','tank_009','ft_gasohol_95',true,'คลังสำรอง 2 - จุด 1',NOW(),NOW()),
  ('disp_026','หัวจ่าย 026','D-026','tank_009','ft_gasohol_95',true,'คลังสำรอง 2 - จุด 2',NOW(),NOW()),
  ('disp_027','หัวจ่าย 027','D-027','tank_009','ft_gasohol_95',true,'คลังสำรอง 2 - จุด 3',NOW(),NOW()),
  -- tank_010 (T-010)
  ('disp_028','หัวจ่าย 028','D-028','tank_010','ft_premium_95',true,'คลังสำรอง 3 - จุด 1',NOW(),NOW()),
  ('disp_029','หัวจ่าย 029','D-029','tank_010','ft_premium_95',true,'คลังสำรอง 3 - จุด 2',NOW(),NOW()),
  ('disp_030','หัวจ่าย 030','D-030','tank_010','ft_premium_95',true,'คลังสำรอง 3 - จุด 3',NOW(),NOW())
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      "tankId" = EXCLUDED."tankId",
      "fuelTypeId" = EXCLUDED."fuelTypeId",
      "isActive" = EXCLUDED."isActive",
      location = EXCLUDED.location,
      "updatedAt" = NOW();

COMMIT;

-- NOTE:
-- 1) ไฟล์นี้สำหรับข้อมูลทดสอบเท่านั้น ไม่ใช่ไฟล์ seed ประจำโปรเจกต์
-- 2) ถ้าต้องการลบข้อมูลเดิมก่อนรัน ให้เปิดบรรทัดด้านล่าง (ตัวอย่าง) แล้วรันก่อน INSERT
--
-- DELETE FROM "Dispenser" WHERE code LIKE 'D-%';
-- DELETE FROM "Tank" WHERE code LIKE 'T-%';
-- DELETE FROM "FuelType" WHERE code IN ('G91','G95','P95','E20','D-B7','D-B10');

-- 3) ปรับค่า id/code/location/ปริมาตร/ราคา ตามต้องการ
