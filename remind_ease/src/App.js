import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// PUBLIC_INTERFACE
function App() {
  /** Color Theme */
  const colors = {
    primary: "#1976D2",
    secondary: "#FFFFFF",
    accent: "#FFC107",
    text: "#222",
    border: "#e0e0e0",
  };

  // Reminder state structure: { id, title, description, time }
  const [reminders, setReminders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    time: "",
  });
  const [notification, setNotification] = useState(null);

  // To store timer ids for scheduled notifications
  const timersRef = useRef({});

  // For notification permission (if needed)
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    scheduleAllNotifications(reminders);
    // Only reschedule when reminders change
    return () => clearAllScheduled();
    // eslint-disable-next-line
  }, [reminders]);

  // Handle modal open for add/edit
  const openModal = (reminder = null) => {
    setModalOpen(true);
    if (reminder) {
      setEditId(reminder.id);
      setFormState({
        title: reminder.title,
        description: reminder.description,
        time: reminder.time.slice(0, 16), // For input[type="datetime-local"]
      });
    } else {
      setEditId(null);
      setFormState({ title: "", description: "", time: "" });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setFormState({ title: "", description: "", time: "" });
  };

  // Handle form field change
  const onFieldChange = (e) =>
    setFormState((s) => ({
      ...s,
      [e.target.name]: e.target.value,
    }));

  // PUBLIC_INTERFACE
  function handleAddOrEdit(e) {
    e.preventDefault();
    if (!formState.title.trim() || !formState.time) return;
    const newReminder = {
      id: editId || Date.now(),
      title: formState.title.trim(),
      description: formState.description.trim(),
      time: formState.time,
    };
    if (editId) {
      setReminders((prev) =>
        prev.map((r) => (r.id === editId ? newReminder : r))
      );
    } else {
      setReminders((prev) => [...prev, newReminder]);
    }
    closeModal();
  }

  // PUBLIC_INTERFACE
  function handleDelete(id) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  // Sorted reminders by time ascending
  const sortedReminders = [...reminders].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  // NOTIFICATION LOGIC --------------------------
  // Schedules all reminders for pop-up at the right time
  function scheduleAllNotifications(reminders) {
    clearAllScheduled();
    const now = Date.now();
    reminders.forEach((reminder) => {
      const timeMs = new Date(reminder.time).getTime();
      if (!isNaN(timeMs) && timeMs > now) {
        // Schedule notification as setTimeout
        const tId = setTimeout(() => {
          showNotification(reminder);
        }, timeMs - now);
        timersRef.current[reminder.id] = tId;
      }
    });
  }
  // Clear all scheduled notifications
  function clearAllScheduled() {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
  }
  // Show notification (system or in-app)
  function showNotification(reminder) {
    // Try using browser notification, fallback to local
    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      // PUBLIC_INTERFACE
      new Notification(`Reminder: ${reminder.title}`, {
        body: reminder.description || "",
        icon: undefined,
      });
    } else {
      // In-app popup
      setNotification(reminder);
      setTimeout(() => setNotification(null), 5000); // Pop-up auto-dismiss
    }
  }
  // End of NOTIFICATION LOGIC -------------------

  // Floating action button
  function FloatingButton() {
    return (
      <button
        className="remind-fab"
        onClick={() => openModal()}
        aria-label="Add Reminder"
        style={{
          background: colors.accent,
          color: colors.primary,
          boxShadow:
            "0 3px 8px rgba(25, 118, 210, 0.08), 0 1.5px 6px #FFC10760",
        }}
      >
        +
      </button>
    );
  }

  // Modal for add/edit
  function ReminderModal() {
    return (
      <div className="remind-modal-overlay">
        <div className="remind-modal" style={{ background: colors.secondary }}>
          <h2 style={{ color: colors.primary, marginTop: 0 }}>
            {editId ? "Edit Reminder" : "Add Reminder"}
          </h2>
          <form onSubmit={handleAddOrEdit} autoComplete="off">
            <label>
              Title<span style={{ color: colors.accent }}> *</span>
              <input
                name="title"
                value={formState.title}
                onChange={onFieldChange}
                required
                autoFocus
                maxLength={64}
                style={{ borderColor: colors.primary }}
                type="text"
                placeholder="e.g. Meeting, Doctor, Event"
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                value={formState.description}
                onChange={onFieldChange}
                maxLength={256}
                placeholder="Brief details (optional)"
                style={{ borderColor: colors.primary, resize: "vertical" }}
              />
            </label>
            <label>
              Time<span style={{ color: colors.accent }}> *</span>
              <input
                type="datetime-local"
                name="time"
                value={formState.time}
                onChange={onFieldChange}
                required
                style={{ borderColor: colors.primary }}
                min={new Date().toISOString().slice(0, 16)}
              />
            </label>
            <div className="remind-modal-actions">
              <button
                className="btn"
                type="button"
                onClick={closeModal}
                style={{ background: "#eee", color: colors.primary }}
              >
                Cancel
              </button>
              <button
                className="btn"
                type="submit"
                style={{
                  background: colors.primary,
                  color: "#fff",
                  marginLeft: 12,
                }}
              >
                {editId ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Notification Pop-Up UI
  function NotificationPopUp({ reminder }) {
    return (
      <div className="remind-popup" style={{ borderColor: colors.accent }}>
        <strong style={{ color: colors.primary }}>
          ⏰ {reminder.title}
        </strong>
        <div style={{ fontSize: "0.98rem" }}>
          {reminder.description}
        </div>
      </div>
    );
  }

  // Reminder List Item
  function ReminderItem({ reminder }) {
    const dateStr = new Date(reminder.time).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return (
      <div className="remind-item" style={{ borderColor: colors.primary }}>
        <div style={{ flex: "1 1 0%" }}>
          <div className="remind-item-title">{reminder.title}</div>
          <div className="remind-item-desc">
            {reminder.description}
          </div>
          <div className="remind-item-time">
            <span role="img" aria-label="clock">
              🕒
            </span>
            <span style={{ marginLeft: 4 }}>{dateStr}</span>
          </div>
        </div>
        <div className="remind-item-actions">
          <button
            title="Edit"
            className="remind-action edit"
            aria-label="Edit"
            onClick={() => openModal(reminder)}
            style={{ color: colors.accent }}
          >
            ✎
          </button>
          <button
            title="Delete"
            className="remind-action delete"
            aria-label="Delete"
            onClick={() => handleDelete(reminder.id)}
            style={{ color: "#d32f2f" }}
          >
            🗑
          </button>
        </div>
      </div>
    );
  }

  // Layout
  return (
    <div
      className="remindease-app"
      style={{
        minHeight: "100vh",
        background: colors.secondary,
        color: colors.text,
        fontFamily:
          "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      }}
    >
      {/* Header Bar */}
      <nav
        className="remindease-navbar"
        style={{
          background: colors.primary,
          color: colors.secondary,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            height: 60,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "1.3rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 26,
                color: colors.accent,
                marginRight: 8,
                position: "relative",
                top: 2,
              }}
            >
              ⏰
            </span>
            Remind<span style={{ color: colors.accent }}>Ease</span>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main
        style={{
          minHeight: "90vh",
          paddingTop: 80,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontWeight: 600,
            fontSize: "2.5rem",
            marginBottom: 6,
            color: colors.primary,
          }}
        >
          Your Reminders
        </h1>
        <div style={{ marginBottom: 24, color: "#444" }}>
          Never forget anything important again. Add, edit, delete, and get notified!
        </div>
        {/* Reminders list */}
        {sortedReminders.length > 0 ? (
          <div className="remind-list">
            {sortedReminders.map((r) => (
              <ReminderItem key={r.id} reminder={r} />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "#888",
              marginTop: 42,
              fontSize: "1.2rem",
            }}
          >
            No reminders yet. <br />
            <span style={{ fontSize: "2.1rem", opacity: 0.4 }}>⏳</span>
            <br />
            Add a new reminder!
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <FloatingButton />

      {/* Modal */}
      {modalOpen && <ReminderModal />}

      {/* Notification popup */}
      {notification && <NotificationPopUp reminder={notification} />}
      <style>{`
        .remindease-navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 60px;
          z-index: 100;
          box-shadow: 0px 2px 10px rgba(25, 118, 210, 0.08);
        }
        .remind-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .remind-item {
          background: #f7fafd;
          border-left: 6px solid;
          padding: 16px 20px 14px 18px;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 18px;
          transition: box-shadow 0.18s;
          box-shadow: 0 2px 5px #1976d208;
        }
        .remind-item-title {
          font-size: 1.14rem;
          font-weight: 600;
          color: ${colors.primary};
        }
        .remind-item-desc {
          color: #525252;
          margin: 4px 0 2px 0;
          font-size: 1rem;
          line-height: 1.38;
          max-width: 80vw;
          word-break: break-word;
        }
        .remind-item-time {
          font-size: 0.98rem;
          color: #827717;
          margin-top: 4px;
          display: flex;
          align-items: center;
        }
        .remind-item-actions {
          display: flex;
          flex-direction: column;
          gap: 13px;
          margin-left: 16px;
        }
        .remind-action {
          background: none;
          border: none;
          font-size: 1.16rem;
          cursor: pointer;
          transition: color 0.2s;
        }
        .remind-action.edit:hover {
          color: #1565c0;
        }
        .remind-action.delete:hover {
          color: #b71c1c;
        }
        .remind-fab {
          position: fixed;
          bottom: 36px;
          right: 48px;
          z-index: 200;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          font-size: 2.1rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          box-shadow: 0 4px 22px #1976d230;
          transition: box-shadow 0.2s, background 0.2s;
        }
        .remind-fab:hover {
          background: #ffd050;
          box-shadow: 0 7px 28px #1976d250;
        }
        /* MODAL styles */
        .remind-modal-overlay {
          position: fixed;
          z-index: 1000;
          left: 0; top: 0; right: 0; bottom: 0;
          background: rgba(25, 118, 210, 0.11);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .remind-modal {
          min-width: 325px;
          max-width: 98vw;
          width: 370px;
          background: #fff;
          border-radius: 13px;
          padding: 26px 22px 18px 22px;
          box-shadow: 0 8px 30px #1976d225;
          animation: fadeIn 0.15s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96);}
          to { opacity: 1; transform: scale(1);}
        }
        .remind-modal label {
          margin-top: 13px;
          display: block;
          color: #313131;
          font-size: 1rem;
        }
        .remind-modal input, .remind-modal textarea {
          width: 100%;
          margin-top: 6px;
          margin-bottom: 8px;
          border: 1.5px solid ${colors.primary};
          border-radius: 5px;
          font-size: 0.99rem;
          padding: 7px;
          outline: none;
          font-family: inherit;
          background: #fafdff;
          color: #212121;
          box-sizing: border-box;
        }
        .remind-modal textarea {
          min-height: 46px;
          max-height: 110px;
        }
        .remind-modal-actions {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .remind-popup {
          position: fixed;
          right: 26px;
          bottom: 110px;
          background: #fff9e5;
          border-left: 5px solid ${colors.accent};
          border-radius: 7px;
          box-shadow: 0 4px 22px #ffc10755;
          padding: 16px 28px 14px 20px;
          color: #262626;
          font-size: 1.07rem;
          min-width: 225px;
          max-width: 92vw;
          z-index: 1100;
          animation: popup-slide-in 0.14s;
        }
        @keyframes popup-slide-in {
          from { opacity: 0; transform: translateY(20px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}

export default App;
