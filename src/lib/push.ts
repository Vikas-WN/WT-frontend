/** Browser web-push helpers. Pure browser APIs: no network calls here (those live in services/push.service.ts). */

export type PushSupport = "supported" | "unsupported";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window ? "supported" : "unsupported";
}

/** The VAPID public key arrives as base64url text; the browser wants the raw bytes. */
export function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function toBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  let binary = "";
  new Uint8Array(buffer).forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The three values the server stores for a subscription. */
export function subscriptionBody(subscription: PushSubscription): { endpoint: string; keys: { p256dh: string; auth: string } } {
  return {
    endpoint: subscription.endpoint,
    keys: { p256dh: toBase64Url(subscription.getKey("p256dh")), auth: toBase64Url(subscription.getKey("auth")) },
  };
}

/** The service worker, registered if it is not yet, and the newest version made active so it can receive pushes. */
export async function readyRegistration(swUrl: string): Promise<ServiceWorkerRegistration> {
  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) registration = await navigator.serviceWorker.register(swUrl);
  // An older worker that is already running has no push handler; let the waiting one take over before subscribing.
  if (registration.waiting) registration.waiting.postMessage("SKIP_WAITING");
  return navigator.serviceWorker.ready;
}

export async function currentSubscription(swUrl: string): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration(swUrl);
  return registration ? registration.pushManager.getSubscription() : null;
}
