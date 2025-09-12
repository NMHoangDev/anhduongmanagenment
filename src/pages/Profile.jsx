import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { FaEdit, FaCamera, FaTimes } from "react-icons/fa";
import {
  getCurrentUser,
  onAuthStateChange,
  updateUserProfile,
} from "../services/authService";

const defaultUser = {
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  name: "Alexa Rowles",
  nick: "Alexa",
  email: "alexarowles@gmail.com",
  phone: "",
  gender: "Female",
  country: "Vietnam",
  language: "English",
  timezone: "GMT+7",
};

export default function Profile() {
  const [user, setUser] = useState(defaultUser);
  const [editing, setEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [loading, setLoading] = useState(true);

  // local states for password changes (don't store plain password in user object)
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  // helper: convert File -> base64 string (data URL)
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", onResize);

    // Load current user once on mount
    let mounted = true;
    const loadUser = async () => {
      setLoading(true);
      try {
        const current = await getCurrentUser();
        if (!mounted) return;
        if (current) {
          // Normalize fields and merge with defaults to avoid undefined
          setUser((prev) => ({
            ...prev,
            avatar: current.avatar || prev.avatar,
            name: current.name || current.displayName || prev.name,
            nick: current.username || current.nick || prev.nick,
            email: current.email || prev.email,
            phone: current.phone || prev.phone,
            gender: current.gender || prev.gender,
            country: current.country || prev.country,
            language: current.language || prev.language,
            timezone: current.timezone || prev.timezone,
            ...current, // keep any other profile fields (including uid)
          }));
        } else {
          // not logged in -> keep defaults or clear
          setUser(defaultUser);
        }
      } catch (err) {
        console.error("Error loading current user:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUser();

    // Also subscribe to auth changes to keep profile in sync
    const unsub = onAuthStateChange((u) => {
      if (u) {
        setUser((prev) => ({
          ...prev,
          avatar: u.avatar || prev.avatar,
          name: u.name || u.displayName || prev.name,
          nick: u.username || u.nick || prev.nick,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
          gender: u.gender || prev.gender,
          country: u.country || prev.country,
          language: u.language || prev.language,
          timezone: u.timezone || prev.timezone,
          ...u,
        }));
      } else {
        setUser(defaultUser);
      }
    });

    return () => {
      mounted = false;
      window.removeEventListener("resize", onResize);
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const handleChange = (key) => (e) =>
    setUser((u) => ({ ...u, [key]: e.target.value }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setUser((u) => ({ ...u, avatar: previewUrl }));

    // convert to base64 and save immediately to Firestore via service
    try {
      setLoading(true);
      const base64 = await fileToBase64(file);
      // call service to persist avatar (this will create/merge fields in users / teachers)
      const res = await updateUserProfile(user.uid, { avatar: base64 });
      if (res.success) {
        // ensure UI uses stored value (could be base64 or a processed URL)
        setUser((prev) => ({
          ...prev,
          ...res.user,
          avatar:
            typeof res.user?.avatar !== "undefined" ? res.user.avatar : base64,
        }));
        setAvatarFile(null);
      } else {
        console.error("updateUserProfile failed:", res.error);
        alert(res.error || "Lỗi khi cập nhật ảnh đại diện.");
      }
    } catch (err) {
      console.error("Avatar conversion/save error:", err);
      alert("Không thể lưu ảnh đại diện. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !user.uid) {
      alert("Không tìm thấy người dùng hiện tại.");
      return;
    }

    // if user tries to change password/email require currentPassword
    if (
      (newPassword && !currentPassword) ||
      (user.email &&
        user.email !== (user.originalEmail || user.email) &&
        !currentPassword)
    ) {
      // note: we use user.originalEmail below to track original loaded email; if not available require currentPassword when email changes
      alert(
        "Để thay đổi email hoặc mật khẩu, vui lòng nhập mật khẩu hiện tại."
      );
      return;
    }

    setLoading(true);
    try {
      const updates = {};
      if (user.name) updates.name = user.name;
      if (user.nick) updates.username = user.nick;
      // If a new avatar file was selected, convert to base64 and store that.
      if (avatarFile) {
        try {
          const base64 = await fileToBase64(avatarFile);
          updates.avatar = base64;
        } catch (convErr) {
          console.error("Avatar conversion failed:", convErr);
          alert("Không thể chuyển ảnh sang base64. Vui lòng thử lại.");
          setLoading(false);
          return;
        }
      } else if (typeof user.avatar !== "undefined") {
        // no new file selected -> keep existing avatar value (could be url or base64)
        updates.avatar = user.avatar;
      }
      if (user.email) updates.email = user.email;
      if (newPassword) updates.password = newPassword;
      if (currentPassword) updates.currentPassword = currentPassword;
      if (user.phone) updates.phone = user.phone;
      if (user.gender) updates.gender = user.gender;
      if (user.country) updates.country = user.country;
      if (user.language) updates.language = user.language;
      if (user.timezone) updates.timezone = user.timezone;

      const res = await updateUserProfile(user.uid, updates);
      if (res.success) {
        // merge returned user doc if available
        setUser((prev) => ({
          ...prev,
          ...res.user,
          // keep display values if returned user doesn't contain them
          name: res.user?.name || prev.name,
          nick: res.user?.username || prev.nick,
          avatar:
            typeof res.user?.avatar !== "undefined"
              ? res.user.avatar
              : prev.avatar,
          email: res.user?.email || prev.email,
        }));
        // clear avatarFile after successful save
        setAvatarFile(null);
        setEditing(false);
        setNewPassword("");
        setCurrentPassword("");
        alert("Cập nhật thông tin thành công.");
      } else {
        alert(res.error || "Lỗi khi cập nhật thông tin.");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      alert(err.message || "Lỗi khi lưu profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyles.wrapper}>
      <Sidebar />
      <div style={pageStyles.main}>
        <Header />
        <div style={pageStyles.container}>
          <div style={pageStyles.card}>
            {/* Header gradient */}
            <div style={pageStyles.cardHeader}>
              <div style={pageStyles.headerLeft}>
                <div style={pageStyles.avatarWrap}>
                  <img
                    src={user.avatar}
                    alt="avatar"
                    style={pageStyles.avatar}
                  />
                  <label style={pageStyles.avatarEdit}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: "none" }}
                    />
                    <FaCamera />
                  </label>
                </div>
                <div style={{ marginLeft: 14 }}>
                  <div style={pageStyles.nameRow}>
                    <div style={pageStyles.name}>{user.name}</div>
                    <button
                      onClick={() => {
                        if (editing) {
                          // cancel edits: reload current user
                          (async () => {
                            const cur = await getCurrentUser();
                            if (cur) setUser((prev) => ({ ...prev, ...cur }));
                          })();
                          setNewPassword("");
                          setCurrentPassword("");
                          setEditing(false);
                        } else {
                          setEditing(true);
                        }
                      }}
                      style={pageStyles.editBtn}
                      title={editing ? "Hủy" : "Chỉnh sửa"}
                    >
                      {editing ? <FaTimes /> : <FaEdit />}{" "}
                      {isMobile ? "" : editing ? "Hủy" : "Chỉnh sửa"}
                    </button>
                  </div>
                  <div style={pageStyles.email}>{user.email}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={pageStyles.cardBody}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleSave();
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 18,
                  alignItems: "start",
                }}
              >
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Tên</label>
                  <input
                    value={user.name}
                    onChange={handleChange("name")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Your full name"
                  />
                </div>

                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Username</label>
                  <input
                    value={user.nick}
                    onChange={handleChange("nick")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Nickname"
                  />
                </div>

                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Giới tính</label>
                  <select
                    value={user.gender}
                    onChange={handleChange("gender")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>

                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Quốc tịch</label>
                  <input
                    value={user.country}
                    onChange={handleChange("country")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Country"
                  />
                </div>

                {/* Email */}
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Email</label>
                  <input
                    value={user.email}
                    onChange={handleChange("email")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="you@domain.com"
                    type="email"
                  />
                </div>

                {/* Password change fields */}
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Mật khẩu mới</label>
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Để trống nếu không đổi"
                    type="password"
                  />
                </div>

                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>
                    Mật khẩu hiện tại (bắt buộc nếu đổi email/mật khẩu)
                  </label>
                  <input
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Nhập mật khẩu hiện tại"
                    type="password"
                  />
                </div>

                {/* full-width email list area */}
                <div style={{ gridColumn: isMobile ? "1 / -1" : "1 / -1" }}>
                  <div style={pageStyles.sectionTitle}>My email address</div>
                  <div style={pageStyles.emailList}>
                    <div style={pageStyles.emailRow}>
                      <div>
                        <div style={pageStyles.smallMuted}>{user.email}</div>
                        <div style={pageStyles.smallMuted}>1 month ago</div>
                      </div>
                      <button
                        type="button"
                        style={pageStyles.addEmailBtn}
                        disabled
                      >
                        Add Email Address
                      </button>
                    </div>
                  </div>
                </div>

                {/* actions */}
                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                  }}
                >
                  {editing ? (
                    <>
                      <button
                        onClick={async () => {
                          // cancel: reload current user from auth
                          const cur = await getCurrentUser();
                          if (cur) setUser((prev) => ({ ...prev, ...cur }));
                          setNewPassword("");
                          setCurrentPassword("");
                          setEditing(false);
                        }}
                        type="button"
                        style={pageStyles.secondaryBtn}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={pageStyles.primaryBtn}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      type="button"
                      style={pageStyles.primaryBtn}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* styles */
const pageStyles = {
  wrapper: { display: "flex", minHeight: "100vh", background: "#f3f7fb" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  container: { padding: 24, maxWidth: 1200, margin: "0 auto", width: "100%" },

  card: {
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 12px 30px rgba(16, 24, 40, 0.08)",
  },

  cardHeader: {
    padding: 22,
    background: "linear-gradient(90deg, #dff3ff 0%, #f6f9ff 100%)",
    display: "flex",
    alignItems: "center",
  },
  headerLeft: { display: "flex", alignItems: "center" },
  avatarWrap: { position: "relative", width: 88, height: 88 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 18,
    objectFit: "cover",
    border: "3px solid #fff",
    boxShadow: "0 6px 18px rgba(11,60,120,0.08)",
  },
  avatarEdit: {
    position: "absolute",
    right: -6,
    bottom: -6,
    background: "#fff",
    borderRadius: 10,
    padding: 8,
    boxShadow: "0 6px 16px rgba(11,60,120,0.08)",
    cursor: "pointer",
    border: "1px solid #e6eefc",
    color: "#0b61b7",
  },

  nameRow: { display: "flex", alignItems: "center", gap: 12 },
  name: { fontSize: 18, fontWeight: 800, color: "#102a43" },
  email: { marginTop: 6, color: "#4b5563" },

  editBtn: {
    marginLeft: 12,
    background: "#fff",
    border: "1px solid #dbeafe",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#075985",
    fontWeight: 700,
  },

  cardBody: { padding: 22 },

  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { color: "#64748b", fontSize: 13, fontWeight: 600 },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e6eefc",
    outline: "none",
    background: "#fff",
    fontSize: 14,
  },
  inputPlain: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    fontSize: 14,
    color: "#374151",
  },

  sectionTitle: { fontWeight: 700, marginBottom: 8, color: "#102a43" },
  emailList: {
    background: "#fafcff",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #eef6ff",
  },
  emailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallMuted: { color: "#6b7280", fontSize: 13 },

  addEmailBtn: {
    background: "#e6f2ff",
    color: "#075985",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },

  primaryBtn: {
    background: "#2b9cff",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 800,
  },
  secondaryBtn: {
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #e6eefc",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
};
