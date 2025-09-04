import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { FaEdit, FaCamera, FaTimes } from "react-icons/fa";
import { getCurrentUser, onAuthStateChange } from "../services/authService";

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
            nick: current.nick || prev.nick,
            email: current.email || prev.email,
            phone: current.phone || prev.phone,
            gender: current.gender || prev.gender,
            country: current.country || prev.country,
            language: current.language || prev.language,
            timezone: current.timezone || prev.timezone,
            ...current, // keep any other profile fields
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
          nick: u.nick || prev.nick,
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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUser((u) => ({ ...u, avatar: url }));
  };

  const handleSave = () => {
    // TODO: call API to save
    setEditing(false);
    alert("Đã lưu (demo)");
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
                      onClick={() => setEditing((v) => !v)}
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
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 18,
                  alignItems: "start",
                }}
              >
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Full Name</label>
                  <input
                    value={user.name}
                    onChange={handleChange("name")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Your full name"
                  />
                </div>

                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Nick Name</label>
                  <input
                    value={user.nick}
                    onChange={handleChange("nick")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Nickname"
                  />
                </div>

                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Gender</label>
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
                  <label style={pageStyles.label}>Country</label>
                  <input
                    value={user.country}
                    onChange={handleChange("country")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Country"
                  />
                </div>

                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Language</label>
                  <input
                    value={user.language}
                    onChange={handleChange("language")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Language"
                  />
                </div>

                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Time Zone</label>
                  <input
                    value={user.timezone}
                    onChange={handleChange("timezone")}
                    disabled={!editing}
                    style={editing ? pageStyles.input : pageStyles.inputPlain}
                    placeholder="Time zone"
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
                      <button type="button" style={pageStyles.addEmailBtn}>
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
                        onClick={() => setEditing(false)}
                        type="button"
                        style={pageStyles.secondaryBtn}
                      >
                        Cancel
                      </button>
                      <button type="submit" style={pageStyles.primaryBtn}>
                        Save Changes
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
