import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_TIMEZONES = [
  {
    id: "local",
    name: "Local Time",
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  {
    id: "india",
    name: "Mumbai",
    zone: "Asia/Kolkata",
  },
  {
    id: "london",
    name: "London",
    zone: "Europe/London",
  },
  {
    id: "new-york",
    name: "New York",
    zone: "America/New_York",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    zone: "Asia/Tokyo",
  },
];

const formatTime = (date, timeZone, use24Hour, showSeconds = true) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: !use24Hour,
  }).format(date);
};

const formatDate = (date, timeZone) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getTimeParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  });

  return {
    hour: values.hour % 12,
    minute: values.minute,
    second: values.second,
  };
};

const getOffset = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  return parts.find((part) => part.type === "timeZoneName")?.value || "UTC";
};

function AnalogClock({ date, timeZone }) {
  const { hour, minute, second } = getTimeParts(date, timeZone);

  const secondAngle = second * 6;
  const minuteAngle = minute * 6 + second * 0.1;
  const hourAngle = hour * 30 + minute * 0.5;

  return (
    <div className="analog-clock">
      <div className="clock-number n12">12</div>
      <div className="clock-number n3">3</div>
      <div className="clock-number n6">6</div>
      <div className="clock-number n9">9</div>

      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="clock-tick"
          style={{
            transform: `rotate(${index * 30}deg)`,
          }}
        />
      ))}

      <div
        className="clock-hand hour-hand"
        style={{
          transform: `rotate(${hourAngle}deg)`,
        }}
      />

      <div
        className="clock-hand minute-hand"
        style={{
          transform: `rotate(${minuteAngle}deg)`,
        }}
      />

      <div
        className="clock-hand second-hand"
        style={{
          transform: `rotate(${secondAngle}deg)`,
        }}
      />

      <div className="clock-center" />
    </div>
  );
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const [timezones, setTimezones] = useState(() => {
    try {
      const saved = localStorage.getItem("worldClockTimezones");
      return saved ? JSON.parse(saved) : DEFAULT_TIMEZONES;
    } catch {
      return DEFAULT_TIMEZONES;
    }
  });

  const [alarms, setAlarms] = useState(() => {
    try {
      const saved = localStorage.getItem("worldClockAlarms");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedZone, setSelectedZone] = useState(
    DEFAULT_TIMEZONES[0].zone
  );

  const [newZone, setNewZone] = useState("");

  const [alarmTime, setAlarmTime] = useState("");

  const [use24Hour, setUse24Hour] = useState(true);

  const [showSeconds, setShowSeconds] = useState(true);

  const [darkMode, setDarkMode] = useState(true);

  const [compactMode, setCompactMode] = useState(false);

  const audioContextRef = useRef(null);

  /* --------------------------------
     REAL-TIME CLOCK
  -------------------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* --------------------------------
     LOCAL STORAGE
  -------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "worldClockTimezones",
      JSON.stringify(timezones)
    );
  }, [timezones]);

  useEffect(() => {
    localStorage.setItem("worldClockAlarms", JSON.stringify(alarms));
  }, [alarms]);

  /* --------------------------------
     ALARM CHECK
  -------------------------------- */

  useEffect(() => {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    setAlarms((previous) =>
      previous.map((alarm) => {
        if (
          alarm.enabled &&
          alarm.hour === currentHour &&
          alarm.minute === currentMinute &&
          alarm.lastTriggered !== currentTime.toDateString()
        ) {
          playAlarmSound();

          return {
            ...alarm,
            lastTriggered: currentTime.toDateString(),
          };
        }

        return alarm;
      })
    );
  }, [currentTime]);

  /* --------------------------------
     TIMEZONE LIST
  -------------------------------- */

  const supportedZones = useMemo(() => {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }

    return [
      "Asia/Kolkata",
      "Europe/London",
      "America/New_York",
      "America/Los_Angeles",
      "Asia/Tokyo",
      "Asia/Singapore",
      "Australia/Sydney",
      "Europe/Paris",
      "Asia/Dubai",
    ];
  }, []);

  /* --------------------------------
     ALARM SOUND
  -------------------------------- */

  const playAlarmSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current =
          new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;

      gainNode.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.25,
        audioContext.currentTime + 0.02
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.8
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.error("Alarm sound could not be played:", error);
    }
  };

  /* --------------------------------
     ADD TIMEZONE
  -------------------------------- */

  const addTimezone = () => {
    if (!newZone) return;

    const alreadyExists = timezones.some(
      (timezone) => timezone.zone === newZone
    );

    if (alreadyExists) return;

    const cityName = newZone.split("/").pop().replaceAll("_", " ");

    setTimezones((previous) => [
      ...previous,
      {
        id: `${Date.now()}`,
        name: cityName,
        zone: newZone,
      },
    ]);

    setNewZone("");
  };

  /* --------------------------------
     REMOVE TIMEZONE
  -------------------------------- */

  const removeTimezone = (id) => {
    setTimezones((previous) =>
      previous.filter((timezone) => timezone.id !== id)
    );
  };

  /* --------------------------------
     ADD ALARM
  -------------------------------- */

  const addAlarm = () => {
    if (!alarmTime) return;

    const [hour, minute] = alarmTime.split(":").map(Number);

    const newAlarm = {
      id: Date.now(),
      hour,
      minute,
      enabled: true,
      lastTriggered: null,
    };

    setAlarms((previous) => [...previous, newAlarm]);

    setAlarmTime("");
  };

  /* --------------------------------
     TOGGLE ALARM
  -------------------------------- */

  const toggleAlarm = (id) => {
    setAlarms((previous) =>
      previous.map((alarm) =>
        alarm.id === id
          ? {
              ...alarm,
              enabled: !alarm.enabled,
            }
          : alarm
      )
    );
  };

  /* --------------------------------
     DELETE ALARM
  -------------------------------- */

  const deleteAlarm = (id) => {
    setAlarms((previous) =>
      previous.filter((alarm) => alarm.id !== id)
    );
  };

  /* --------------------------------
     RESET DASHBOARD
  -------------------------------- */

  const resetDashboard = () => {
    setTimezones(DEFAULT_TIMEZONES);
    setAlarms([]);
    setSelectedZone(DEFAULT_TIMEZONES[0].zone);
    setUse24Hour(true);
    setShowSeconds(true);
    setCompactMode(false);
  };

  return (
    <div
      className={`app ${
        darkMode ? "dark" : "light"
      } ${compactMode ? "compact" : ""}`}
    >
      {/* ================= HEADER ================= */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">◷</div>

          <div>
            <h1>Chronos</h1>
            <p>World Clock Dashboard</p>
          </div>
        </div>

        <div className="header-controls">
          <button
            className="control-button"
            onClick={() => setDarkMode((value) => !value)}
          >
            {darkMode ? "☀ Light" : "☾ Dark"}
          </button>

          <button
            className="control-button"
            onClick={() => setCompactMode((value) => !value)}
          >
            {compactMode ? "▣ Normal" : "▦ Compact"}
          </button>
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="dashboard">

        {/* ================= HERO CLOCK ================= */}

        <section className="hero-card">

          <div className="hero-clock">

            <AnalogClock
              date={currentTime}
              timeZone={selectedZone}
            />

            <div className="digital-section">

              <div className="live-indicator">
                <span />
                LIVE
              </div>

              <div className="digital-time">
                {formatTime(
                  currentTime,
                  selectedZone,
                  use24Hour,
                  showSeconds
                )}
              </div>

              <div className="digital-date">
                {formatDate(currentTime, selectedZone)}
              </div>

              <div className="timezone-label">
                {selectedZone}
              </div>

              <div className="timezone-offset">
                {getOffset(currentTime, selectedZone)}
              </div>

            </div>

          </div>

          {/* ================= CLOCK CONTROLS ================= */}

          <div className="clock-controls">

            <div className="setting">

              <label>Timezone</label>

              <select
                value={selectedZone}
                onChange={(event) =>
                  setSelectedZone(event.target.value)
                }
              >
                {timezones.map((timezone) => (
                  <option
                    key={timezone.id}
                    value={timezone.zone}
                  >
                    {timezone.name}
                  </option>
                ))}
              </select>

            </div>

            <div className="setting-toggle">

              <span>24 Hour</span>

              <button
                className={`toggle ${
                  use24Hour ? "active" : ""
                }`}
                onClick={() =>
                  setUse24Hour((value) => !value)
                }
              >
                <span />
              </button>

            </div>

            <div className="setting-toggle">

              <span>Seconds</span>

              <button
                className={`toggle ${
                  showSeconds ? "active" : ""
                }`}
                onClick={() =>
                  setShowSeconds((value) => !value)
                }
              >
                <span />
              </button>

            </div>

          </div>

        </section>

        {/* ================= STAT CARDS ================= */}

        <section className="stats-grid">

          <div className="stat-card">
            <span className="stat-icon">🌐</span>

            <div>
              <span className="stat-label">
                TIME ZONES
              </span>

              <strong>{timezones.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">⏰</span>

            <div>
              <span className="stat-label">
                ACTIVE ALARMS
              </span>

              <strong>
                {alarms.filter((alarm) => alarm.enabled).length}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">⚡</span>

            <div>
              <span className="stat-label">
                SYSTEM
              </span>

              <strong>ONLINE</strong>
            </div>
          </div>

        </section>

        {/* ================= CONTENT GRID ================= */}

        <section className="content-grid">

          {/* ================= WORLD CLOCKS ================= */}

          <div className="panel timezone-panel">

            <div className="panel-header">

              <div>
                <span className="section-kicker">
                  WORLD CLOCKS
                </span>

                <h2>Time Zones</h2>
              </div>

              <span className="panel-count">
                {timezones.length}
              </span>

            </div>

            <div className="timezone-list">

              {timezones.map((timezone) => (

                <div
                  className={`timezone-item ${
                    selectedZone === timezone.zone
                      ? "selected"
                      : ""
                  }`}
                  key={timezone.id}
                  onClick={() =>
                    setSelectedZone(timezone.zone)
                  }
                >

                  <div className="timezone-info">

                    <div className="timezone-dot" />

                    <div>
                      <strong>
                        {timezone.name}
                      </strong>

                      <small>
                        {timezone.zone}
                      </small>
                    </div>

                  </div>

                  <div className="timezone-time">

                    <strong>
                      {formatTime(
                        currentTime,
                        timezone.zone,
                        use24Hour,
                        showSeconds
                      )}
                    </strong>

                    <small>
                      {getOffset(
                        currentTime,
                        timezone.zone
                      )}
                    </small>

                  </div>

                  {timezone.id !== "local" && (
                    <button
                      className="delete-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeTimezone(timezone.id);
                      }}
                    >
                      ×
                    </button>
                  )}

                </div>

              ))}

            </div>

            {/* ADD TIMEZONE */}

            <div className="add-timezone">

              <select
                value={newZone}
                onChange={(event) =>
                  setNewZone(event.target.value)
                }
              >

                <option value="">
                  Add a timezone...
                </option>

                {supportedZones
                  .filter(
                    (zone) =>
                      !timezones.some(
                        (item) => item.zone === zone
                      )
                  )
                  .map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}

              </select>

              <button onClick={addTimezone}>
                + Add
              </button>

            </div>

          </div>

          {/* ================= ALARMS ================= */}

          <div className="panel alarm-panel">

            <div className="panel-header">

              <div>
                <span className="section-kicker">
                  SCHEDULE
                </span>

                <h2>Alarms</h2>
              </div>

              <span className="panel-count">
                {alarms.length}
              </span>

            </div>

            <div className="alarm-create">

              <input
                type="time"
                value={alarmTime}
                onChange={(event) =>
                  setAlarmTime(event.target.value)
                }
              />

              <button onClick={addAlarm}>
                Set Alarm
              </button>

            </div>

            <div className="alarm-list">

              {alarms.length === 0 ? (

                <div className="empty-state">
                  <span>⏰</span>
                  <p>No alarms scheduled</p>
                  <small>
                    Set an alarm using the controls above.
                  </small>
                </div>

              ) : (

                alarms.map((alarm) => (

                  <div
                    className="alarm-item"
                    key={alarm.id}
                  >

                    <div className="alarm-time">

                      <strong>
                        {String(alarm.hour).padStart(2, "0")}
                        :
                        {String(alarm.minute).padStart(2, "0")}
                      </strong>

                      <small>
                        {alarm.enabled
                          ? "ACTIVE"
                          : "DISABLED"}
                      </small>

                    </div>

                    <button
                      className={`toggle ${
                        alarm.enabled ? "active" : ""
                      }`}
                      onClick={() =>
                        toggleAlarm(alarm.id)
                      }
                    >
                      <span />
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteAlarm(alarm.id)
                      }
                    >
                      ×
                    </button>

                  </div>

                ))

              )}

            </div>

          </div>

        </section>

        {/* ================= FOOTER CONTROLS ================= */}

        <section className="system-bar">

          <div className="system-status">

            <span className="status-dot" />

            <div>
              <strong>Clock Engine Running</strong>
              <small>
                Real-time synchronization active
              </small>
            </div>

          </div>

          <button
            className="reset-button"
            onClick={resetDashboard}
          >
            Reset Dashboard
          </button>

        </section>

      </main>

      <footer>
        <span>CHRONOS WORLD CLOCK</span>
        <span>REAL-TIME DASHBOARD • {new Date().getFullYear()}</span>
      </footer>

    </div>
  );
}

export default App;