"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PUSH_COPY, PWA } from "@/constants/pwa";
import { currentSubscription, pushSupport, readyRegistration, subscriptionBody, urlBase64ToUint8Array } from "@/lib/push";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { pushService } from "@/services/push.service";

export type PushState = "loading" | "unsupported" | "unavailable" | "blocked" | "off" | "on";

/** Whether this browser gets message notifications, and the switch to change it. */
export function usePushNotifications() {
  const queryClient = useQueryClient();
  const supported = pushSupport() === "supported";

  const config = useQuery({
    queryKey: PUSH_COPY.queryKeyConfig,
    enabled: supported,
    staleTime: 10 * 60_000,
    queryFn: async () => (await pushService.config()).data ?? { enabled: false, public_key: "" },
  });
  const subscribed = useQuery({
    queryKey: PUSH_COPY.queryKeyState,
    enabled: supported,
    queryFn: async () => Boolean(await currentSubscription(PWA.swUrl)),
  });

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: PUSH_COPY.queryKeyState }), [queryClient]);

  const enable = useMutation({
    mutationFn: async () => {
      const publicKey = config.data?.public_key;
      if (!config.data?.enabled || !publicKey) throw new Error(PUSH_COPY.notReady);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error(PUSH_COPY.blocked);
      const registration = await readyRegistration(PWA.swUrl);
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      await pushService.subscribe(subscriptionBody(subscription));
    },
    onSuccess: () => {
      showSuccessToast(PUSH_COPY.enabled);
      void refresh();
    },
    onError: (error) => showErrorToast(error instanceof Error && error.message ? error.message : PUSH_COPY.failed),
  });

  const disable = useMutation({
    mutationFn: async () => {
      const subscription = await currentSubscription(PWA.swUrl);
      if (!subscription) return;
      await pushService.unsubscribe(subscription.endpoint).catch(() => undefined);
      await subscription.unsubscribe();
    },
    onSuccess: () => {
      showSuccessToast(PUSH_COPY.disabled);
      void refresh();
    },
    onError: () => showErrorToast(PUSH_COPY.failed),
  });

  let state: PushState;
  if (!supported) state = "unsupported";
  else if (config.isLoading || subscribed.isLoading) state = "loading";
  else if (!config.data?.enabled) state = "unavailable";
  else if (typeof Notification !== "undefined" && Notification.permission === "denied") state = "blocked";
  else state = subscribed.data ? "on" : "off";

  return { state, busy: enable.isPending || disable.isPending, enable: () => enable.mutate(), disable: () => disable.mutate() };
}
