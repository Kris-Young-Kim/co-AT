/**
 * Supabase 타입 추론 문제 해결을 위한 헬퍼 함수
 * 
 * Supabase의 복잡한 JOIN 쿼리나 관계형 데이터 조회 시
 * TypeScript가 타입을 제대로 추론하지 못하는 문제를 해결합니다.
 */

import type { Database } from "@/types/database.types"

/**
 * 테이블의 Row 타입을 가져옵니다
 */
export type TableRow<T extends keyof Database["public"]["Tables"]> = 
  Database["public"]["Tables"][T]["Row"]

/**
 * 테이블의 Insert 타입을 가져옵니다
 */
export type TableInsert<T extends keyof Database["public"]["Tables"]> = 
  Database["public"]["Tables"][T]["Insert"]

/**
 * 테이블의 Update 타입을 가져옵니다
 */
export type TableUpdate<T extends keyof Database["public"]["Tables"]> = 
  Database["public"]["Tables"][T]["Update"]

/**
 * 테이블의 특정 컬럼만 선택한 타입을 만듭니다
 */
export type TableRowPick<
  T extends keyof Database["public"]["Tables"],
  K extends keyof TableRow<T>
> = Pick<TableRow<T>, K>

/**
 * Supabase 쿼리 결과를 안전하게 타입 캐스팅합니다
 * 
 * @example
 * const result = await supabase.from("custom_makes").select().single()
 * const typed = asTableRow("custom_makes", result.data)
 */
export function asTableRow<T extends keyof Database["public"]["Tables"]>(
  tableName: T,
  data: unknown
): TableRow<T> | null {
  if (!data) return null
  return data as TableRow<T>
}

/**
 * Supabase 쿼리 결과 배열을 안전하게 타입 캐스팅합니다
 * 
 * @example
 * const result = await supabase.from("custom_makes").select()
 * const typed = asTableRows("custom_makes", result.data)
 */
export function asTableRows<T extends keyof Database["public"]["Tables"]>(
  tableName: T,
  data: unknown
): TableRow<T>[] {
  if (!data || !Array.isArray(data)) return []
  return data as TableRow<T>[]
}

/**
 * 특정 컬럼만 선택한 타입으로 캐스팅합니다
 * 
 * @example
 * const result = await supabase.from("custom_makes").select("id, item_name")
 * const typed = asTableRowPick("custom_makes", result.data, ["id", "item_name"])
 */
export function asTableRowPick<
  T extends keyof Database["public"]["Tables"],
  K extends keyof TableRow<T>
>(
  tableName: T,
  data: unknown,
  keys: K[]
): TableRowPick<T, K> | null {
  if (!data) return null
  return data as TableRowPick<T, K>
}

/**
 * 특정 컬럼만 선택한 타입 배열로 캐스팅합니다
 */
export function asTableRowsPick<
  T extends keyof Database["public"]["Tables"],
  K extends keyof TableRow<T>
>(
  tableName: T,
  data: unknown,
  keys: K[]
): TableRowPick<T, K>[] {
  if (!data || !Array.isArray(data)) return []
  return data as TableRowPick<T, K>[]
}
