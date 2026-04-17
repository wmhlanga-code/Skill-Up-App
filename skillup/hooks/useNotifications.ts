// Push notifications require a standalone dev build — not supported in Expo Go.
// The database tables (push_tokens) and RPCs are in place.
// Re-enable this hook when building with `npx expo run:ios` or `eas build`.

export function useNotifications(_userId: string | null) {
  // no-op in Expo Go
}
