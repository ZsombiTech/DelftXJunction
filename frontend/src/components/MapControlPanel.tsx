/* eslint-disable @typescript-eslint/no-explicit-any */
function formatTime(time: number) {
  const date = new Date(time);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

const MapControlPanel = (props: any) => {
  const {
    startTime,
    endTime,
    onChangeTime,
    allDays,
    onChangeAllDays,
    selectedTime,
  } = props;
  const day = 24 * 60 * 60 * 1000;
  const days = Math.round((endTime - startTime) / day);
  const selectedDay = Math.round((selectedTime - startTime) / day);

  const onSelectDay = (evt: any) => {
    const daysToAdd = evt.target.value;
    // add selected days to start time to calculate new time
    const newTime = startTime + daysToAdd * day;
    onChangeTime(newTime);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 16px rgba(0, 0, 0, 0.15)",
        padding: "20px 24px",
        minWidth: "320px",
        maxWidth: "380px",
        zIndex: 900,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: "18px",
          fontWeight: "600",
          color: "#1a1a1a",
          letterSpacing: "-0.2px",
        }}
      >
        Driver Heatmap
      </h3>

      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: "13px",
          color: "#545454",
          lineHeight: "1.5",
        }}
      >
        Showing most profitable from{" "}
        <span style={{ fontWeight: "600", color: "#1a1a1a" }}>
          {formatTime(startTime)}
        </span>{" "}
        to{" "}
        <span style={{ fontWeight: "600", color: "#1a1a1a" }}>
          {formatTime(endTime)}
        </span>
      </p>

      <div
        style={{
          marginBottom: "20px",
          paddingBottom: "20px",
          borderBottom: "1px solid #eeeeee",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            color: "#1a1a1a",
          }}
        >
          <input
            type="checkbox"
            name="allday"
            checked={allDays}
            onChange={(evt) => onChangeAllDays(evt.target.checked)}
            style={{
              marginRight: "10px",
              width: "18px",
              height: "18px",
              cursor: "pointer",
              accentColor: "#000000",
            }}
          />
          Show All Days
        </label>
      </div>

      <div
        style={{
          opacity: allDays ? 0.4 : 1,
          transition: "opacity 0.2s ease",
          pointerEvents: allDays ? "none" : "auto",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "500",
            color: "#1a1a1a",
            marginBottom: "8px",
          }}
        >
          Date: {formatTime(selectedTime)}
        </label>
        <input
          type="range"
          disabled={allDays}
          min={1}
          max={days}
          value={selectedDay}
          step={1}
          onChange={onSelectDay}
          style={{
            width: "100%",
            height: "6px",
            borderRadius: "3px",
            outline: "none",
            background: allDays
              ? "#e0e0e0"
              : `linear-gradient(to right, #000000 0%, #000000 ${
                  (selectedDay / days) * 100
                }%, #e0e0e0 ${(selectedDay / days) * 100}%, #e0e0e0 100%)`,
            WebkitAppearance: "none",
            cursor: allDays ? "not-allowed" : "pointer",
          }}
        />
      </div>
    </div>
  );
};

export default MapControlPanel;
