"use client";

import { useState } from "react";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { InputField, TextAreaField } from "@/components/dashboard/ui/forms";
import { useCreateMeetingRoom, useUpdateMeetingRoom } from "@/hooks/meeting-rooms/useMeetingRooms";
import type { MeetingRoom } from "@/types/meetingRoom";

export function RoomFormDialog({
  room,
  onClose,
}: {
  /** Omit to create a new room; pass an existing one to edit it. */
  room?: MeetingRoom;
  onClose: () => void;
}) {
  const isEditing = Boolean(room);
  const [name, setName] = useState(room?.name ?? "");
  const [location, setLocation] = useState(room?.location ?? "");
  const [capacity, setCapacity] = useState(room?.capacity != null ? String(room.capacity) : "");
  const [amenities, setAmenities] = useState(room?.amenities ?? "");
  const createRoom = useCreateMeetingRoom();
  const updateRoom = useUpdateMeetingRoom();
  const saving = createRoom.isPending || updateRoom.isPending;

  const canSubmit = Boolean(name.trim());

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = {
      name: name.trim(),
      location: location.trim() || null,
      capacity: capacity.trim() ? Number(capacity) : null,
      amenities: amenities.trim() || null,
    };
    if (isEditing && room) {
      updateRoom.mutate({ id: room.id, payload }, { onSuccess: onClose });
    } else {
      createRoom.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <WtFormDialog
      open
      title={isEditing ? `Edit ${room?.name}` : "Register a meeting room"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Save changes" : "Register room"}
      submittingLabel="Saving…"
      submitDisabled={!canSubmit}
      loading={saving}
    >
      <div className="space-y-5">
        <InputField label="Room name" value={name} onChange={setName} required placeholder="Falcon" />
        <InputField
          label="Location"
          value={location}
          onChange={setLocation}
          placeholder="3rd floor, near the cafeteria"
        />
        <InputField
          label="Capacity"
          value={capacity}
          onChange={setCapacity}
          type="number"
          inputMode="numeric"
          placeholder="8"
        />
        <TextAreaField
          label="Amenities"
          value={amenities}
          onChange={setAmenities}
          rows={3}
          placeholder="Projector, whiteboard, video conferencing"
        />
      </div>
    </WtFormDialog>
  );
}
