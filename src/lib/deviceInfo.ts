export const getDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Detect browser
  if (ua.indexOf("Firefox") > -1) {
    browser = "Firefox";
  } else if (ua.indexOf("Chrome") > -1) {
    browser = "Chrome";
  } else if (ua.indexOf("Safari") > -1) {
    browser = "Safari";
  } else if (ua.indexOf("Edge") > -1) {
    browser = "Edge";
  }

  // Detect OS
  if (ua.indexOf("Windows") > -1) {
    os = "Windows";
  } else if (ua.indexOf("Mac") > -1) {
    os = "macOS";
  } else if (ua.indexOf("Linux") > -1) {
    os = "Linux";
  } else if (ua.indexOf("Android") > -1) {
    os = "Android";
  } else if (ua.indexOf("iOS") > -1 || ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) {
    os = "iOS";
  }

  return `${browser} on ${os}`;
};
