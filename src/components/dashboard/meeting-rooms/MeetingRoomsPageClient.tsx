"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { PageTabs, type PageTabItem } from "@/components/dashboard/ui/PageTabs";
import { ManagementListCard, ManagementListContent } from "@/components/dashboard/ui/ManagementListCard";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";
import {
  useCancelMeetingRoomBooking,
  useDeactivateMeetingRoom,
  useMeetingRoomsList,
  useMyMeetingRoomBookings,
} from "@/hooks/meeting-rooms/useMeetingRooms";
import { BookRoomDialog } from "@/components/dashboard/meeting-rooms/BookRoomDialog";
import { DayScheduleView } from "@/components/dashboard/meeting-rooms/DayScheduleView";
import { RoomFormDialog } from "@/components/dashboard/meeting-rooms/RoomFormDialog";
import type { MeetingRoom, MeetingRoomBooking } from "@/types/meetingRoom";

const ROOM_ADMIN_ROLES = ["ROLE_OFFICE_ADMIN", "ROLE_HR", "ROLE_ADMIN"];

function MyBookingsSection() {
  const myBookingsQ = useMyMeetingRoomBookings(true);
  const roomsQ = useMeetingRoomsList();
  const cancelBooking = useCancelMeetingRoomBooking();
  const [pendingCancel, setPendingCancel] = useState<MeetingRoomBooking | null>(null);
  const [editing, setEditing] = useState<MeetingRoomBooking | null>(null);
  const rows = myBookingsQ.data ?? [];
  // The edit dialog needs the room; a booking in a since-deactivated room still carries its name.
  const editingRoom = editing
    ? ((roomsQ.data ?? []).find((r) => r.id === editing.room_id) ?? {
        id: editing.room_id,
        name: editing.room_name,
        location: null,
        capacity: null,
        amenities: null,
        is_active: true,
        created_at: editing.created_at,
        updated_at: editing.created_at,
      })
    : null;

  return (
    <ManagementListCard title="My upcoming bookings">
      <ManagementListContent
        isLoading={myBookingsQ.isLoading}
        isEmpty={rows.length === 0}
        emptyTitle="No upcoming bookings"
        emptyDescription="Book a room above to see it here."
      >
        <div className="space-y-2">
          {rows.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-1 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-wt-text">
                  {b.title} <span className="font-normal text-wt-text-muted">· {b.room_name}</span>
                </p>
                <p className="mt-0.5 text-xs text-wt-text-muted">
                  {formatApiDateTimeDisplay(b.start_time)} – {formatApiDateTimeDisplay(b.end_time)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(b)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingCancel(b)}
                  disabled={cancelBooking.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ManagementListContent>

      {editing && editingRoom ? (
        <BookRoomDialog room={editingRoom} booking={editing} onClose={() => setEditing(null)} />
      ) : null}

      <ConfirmDialog
        open={pendingCancel != null}
        title="Cancel this booking?"
        description={pendingCancel ? `${pendingCancel.title} · ${pendingCancel.room_name}` : undefined}
        confirmLabel="Cancel booking"
        cancelLabel="Keep it"
        tone="danger"
        loading={cancelBooking.isPending}
        onCancel={() => setPendingCancel(null)}
        onConfirm={() => {
          if (!pendingCancel) return;
          cancelBooking.mutate(pendingCancel.id, { onSuccess: () => setPendingCancel(null) });
        }}
      />
    </ManagementListCard>
  );
}

function BookRoomTab() {
  return (
    <div className="space-y-6">
      <DayScheduleView />
      <MyBookingsSection />
    </div>
  );
}

function ManageRoomsTab() {
  const roomsQ = useMeetingRoomsList(true);
  const rooms = roomsQ.data ?? [];
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | "new" | null>(null);
  const { mutate: deactivateRoom } = useDeactivateMeetingRoom();

  return (
    <ManagementListCard
      title="All rooms"
      description="Register a new room, or edit/deactivate an existing one."
      headerAction={
        <Button type="button" variant="brand" size="sm" onClick={() => setEditingRoom("new")}>
          <Plus className="size-4" /> Add room
        </Button>
      }
    >
      <ManagementListContent
        isLoading={roomsQ.isLoading}
        isEmpty={rooms.length === 0}
        emptyTitle="No meeting rooms yet"
        emptyDescription="Register your first room to get started."
      >
        <ScrollableTable maxHeightClass="max-h-[min(60vh,520px)]">
          <WtTable>
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead>Room</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium text-wt-text">{room.name}</TableCell>
                  <TableCell>{room.location || "—"}</TableCell>
                  <TableCell className="text-center tabular-nums">{room.capacity ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={room.is_active ? "default" : "outline"}>
                      {room.is_active ? "Active" : "Deactivated"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button type="button" variant="outline" size="xs" onClick={() => setEditingRoom(room)}>
                        Edit
                      </Button>
                      {room.is_active ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="xs"
                          onClick={() => deactivateRoom(room.id)}
                        >
                          Deactivate
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </WtTable>
        </ScrollableTable>
      </ManagementListContent>

      {editingRoom ? (
        <RoomFormDialog
          room={editingRoom === "new" ? undefined : editingRoom}
          onClose={() => setEditingRoom(null)}
        />
      ) : null}
    </ManagementListCard>
  );
}

export function MeetingRoomsPageClient() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isRoomAdmin = ROOM_ADMIN_ROLES.some((role) => roles.includes(role));
  const [tab, setTab] = useState<"book" | "manage">("book");

  const tabs: PageTabItem[] = isRoomAdmin
    ? [
        { value: "book", label: "Book a Room" },
        { value: "manage", label: "Manage Rooms" },
      ]
    : [{ value: "book", label: "Book a Room" }];

  return (
    <DashboardPageShell>
      <PageHero
        title="Meeting Rooms"
        description="Book a room for your next meeting — or, if you manage facilities, register new rooms here."
      />
      {tabs.length > 1 ? (
        <PageTabs value={tab} onValueChange={(v) => setTab(v as "book" | "manage")} items={tabs} />
      ) : null}
      {tab === "manage" && isRoomAdmin ? <ManageRoomsTab /> : <BookRoomTab />}
    </DashboardPageShell>
  );
}
