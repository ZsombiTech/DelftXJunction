/* eslint-disable @typescript-eslint/no-explicit-any */

const MapControlPanel = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 16px rgba(0, 0, 0, 0.15)",
        padding: "20px 20px",
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
          fontSize: "14px",
          color: "#545454",
          lineHeight: "1.5",
        }}
      >
        Showing most profitable areas based on driver activity
      </p>
    </div>
  );
};

export default MapControlPanel;
