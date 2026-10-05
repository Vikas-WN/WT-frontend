import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { CalendarCheck } from "lucide-react";

/**
 * Meeting Rooms is parked behind a Coming Soon panel. The nav item and route stay wired and
 * `LazyMeetingRoomsPageClient` (components/dashboard/lazyPages) is untouched — restore by
 * rendering it here again.
 */
export default function MeetingRoomsPage() {
  return (
    <ComingSoonPanel
      title="Meeting Rooms"
      description="Room booking and availability will appear here soon. Your existing bookings stay connected behind this screen."
      icon={<CalendarCheck className="size-6" />}
    />
  );
}
