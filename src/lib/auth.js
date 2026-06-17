// Simple app-level auth using localStorage
export function getAppUser() {
  try {
    const raw = localStorage.getItem("app_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAppUser(user) {
  localStorage.setItem("app_user", JSON.stringify(user));
}

export function clearAppUser() {
  localStorage.removeItem("app_user");
}

export function isAdmin(user) {
  return user?.role === "admin";
}