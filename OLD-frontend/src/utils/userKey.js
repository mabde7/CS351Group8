
export function getOrCreateUserKey(isAuthenticated, user) {
  if (isAuthenticated && user?.sub) return user.sub;
  let gid = localStorage.getItem("guestId");
  if (!gid) {
    gid = cryptoRandomId();
    localStorage.setItem("guestId", gid);
  }
  return `guest:${gid}`;
}

// lightweight, non-crypto fallback (works in all browsers)
function cryptoRandomId() {
  const tpl = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return tpl.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
