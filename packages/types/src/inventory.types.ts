export type CustomOrderStatus = 'requested' | 'in_progress' | 'completed' | 'delivered'
export type ReuseDispatchStatus = 'donated' | 'inspecting' | 'cleaning' | 'delivered'
export type FabEquipmentType = '3d_printer' | 'cnc' | 'laser' | 'other'
export type FabEquipmentStatus = 'available' | 'in_use' | 'maintenance'
export type MaintenanceLogType = 'inspection' | 'repair' | 'cleaning'
export type MaintenanceLogStatus = 'pending' | 'in_progress' | 'done'

export interface InventoryCustomOrder {
  id: string
  device_id: string | null
  client_id: string
  approval_id: string | null
  status: CustomOrderStatus
  track_token: string
  requested_at: string
  delivered_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InventoryCustomOrderWithDetails extends InventoryCustomOrder {
  client_name?: string | null
  device_name?: string | null
  equipment?: InventoryFabEquipmentAssignment[]
}

export interface InventoryReuseDispatch {
  id: string
  device_id: string
  client_id: string
  approval_id: string | null
  status: ReuseDispatchStatus
  dispatched_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InventoryReuseDispatchWithDetails extends InventoryReuseDispatch {
  client_name?: string | null
  device_name?: string | null
}

export interface InventoryFabEquipment {
  id: string
  name: string
  type: FabEquipmentType
  status: FabEquipmentStatus
  serial_number: string | null
  purchased_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InventoryFabEquipmentAssignment {
  id: string
  custom_order_id: string
  equipment_id: string
  started_at: string | null
  finished_at: string | null
  notes: string | null
  equipment?: InventoryFabEquipment
}

export interface InventoryMaintenanceLog {
  id: string
  device_id: string
  type: MaintenanceLogType
  status: MaintenanceLogStatus
  performed_at: string | null
  technician: string | null
  cost: number
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface CreateCustomOrderInput {
  client_id: string
  approval_id?: string
  notes?: string
}

export interface CreateReuseDispatchInput {
  device_id: string
  client_id: string
  approval_id?: string
  notes?: string
}

export interface CreateMaintenanceLogInput {
  device_id: string
  type: MaintenanceLogType
  status?: MaintenanceLogStatus
  performed_at?: string
  technician?: string
  cost?: number
  notes?: string
}
