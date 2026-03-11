import { redirect } from "next/navigation";

/**
 * /schedules 는 /schedules/lessons 로 영구 리다이렉트합니다.
 * 실제 수업 관리 화면은 /schedules/lessons (실 API 연동) 에서 제공됩니다.
 */
export default function SchedulesPage() {
  redirect("/schedules/lessons");
}
