export function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (err) {
    return null;
  }
}

export function getCurrentUserId() {
  return getCurrentUser()?.userId || "";
}

export function getCurrentUserName() {
  return getCurrentUser()?.name || "You";
}
