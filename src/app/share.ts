export type ShareOutcome = "shared" | "cancelled" | "copied" | "manual";

/** Web Share API if available, else clipboard; "manual" when both are unavailable or blocked. */
export async function shareLink(
  url: string,
  title: string,
): Promise<ShareOutcome> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "manual";
  }
}
