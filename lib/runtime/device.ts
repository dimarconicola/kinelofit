const MOBILE_USER_AGENT_PATTERN =
  /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini|Mobi/i;

export function isMobileUserAgent(userAgent: string | null | undefined) {
  if (!userAgent) return false;
  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
}
