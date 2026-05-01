import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { schedule_id, category, desired_date } = body

    if (!schedule_id || !category || !desired_date) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // 클라이언트 정보 조회 또는 생성
    const { data: client, error: clientError } = await adminSupabase
      .from("clients")
      .select("id")
      .eq("id", profile.id) // 임시로 profile.id를 사용 (실제로는 별도 clients 테이블 조회 필요)
      .maybeSingle()

    let clientId: string

    if (clientError || !client) {
      // 클라이언트가 없으면 생성
      const { data: newClient, error: createClientError } = await adminSupabase
        .from("clients")
        .insert({
          name: "예약자", // 임시 (실제로는 프로필에서 이름 가져오기)
        })
        .select("id")
        .single()

      if (createClientError || !newClient) {
        console.error("클라이언트 생성 오류:", createClientError)
        return NextResponse.json(
          { success: false, error: "클라이언트 정보 생성에 실패했습니다" },
          { status: 500 }
        )
      }

      clientId = newClient.id
    } else {
      clientId = client.id
    }

    // 일정 정보 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("id, schedule_type, scheduled_date")
      .eq("id", schedule_id)
      .eq("status", "scheduled")
      .single()

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { success: false, error: "일정을 찾을 수 없거나 예약 가능한 상태가 아닙니다" },
        { status: 404 }
      )
    }

    // 신청서 생성
    const { data: application, error: applicationError } = await adminSupabase
      .from("applications")
      .insert({
        client_id: clientId,
        category,
        sub_category: (schedule as { schedule_type: string }).schedule_type === "exhibition" ? "exhibition" : "education",
        desired_date: desired_date,
        status: "접수",
        service_year: new Date().getFullYear(),
      })
      .select("id")
      .single()

    if (applicationError || !application) {
      console.error("신청서 생성 오류:", applicationError)
      return NextResponse.json(
        {
          success: false,
          error: "예약 신청에 실패했습니다: " + (applicationError?.message || "알 수 없는 오류"),
        },
        { status: 500 }
      )
    }

    // 일정과 신청서 연결
    const { error: updateScheduleError } = await adminSupabase
      .from("schedules")
      .update({ application_id: application.id })
      .eq("id", schedule_id)

    if (updateScheduleError) {
      console.error("일정 업데이트 오류:", updateScheduleError)
      // 신청서는 생성되었으므로 경고만 하고 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: "예약이 완료되었습니다",
    })
  } catch (error) {
    console.error("예약 API 오류:", error)
    return NextResponse.json(
      { success: false, error: "예상치 못한 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

