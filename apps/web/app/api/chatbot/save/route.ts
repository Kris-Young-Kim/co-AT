import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const { question, answer } = await req.json()
    if (!question?.trim()) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    const supabase = createAdminClient()
    const today = new Date().toISOString().slice(0, 10)

    await supabase.from("call_logs").insert({
      log_date: today,
      staff_name: "AI챗봇",
      q_other: true,
      question_content: question.slice(0, 2000),
      answer: answer?.slice(0, 2000) ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[chatbot/save]", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
