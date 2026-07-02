function Loader({ text = "Loading...", fullScreen = true }) {
  return (
    <div
      style={{
        position: fullScreen ? "fixed" : "absolute",
        inset: 0,
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(2px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="d-flex flex-column align-items-center"
        style={{
          background: "#fff",
          padding: "25px 35px",
          borderRadius: "15px",
          boxShadow: "0 8px 25px rgba(0,0,0,.15)",
        }}
      >
        <div
          className="spinner-border text-success"
          style={{
            width: "3rem",
            height: "3rem",
          }}
        ></div>

        <div
          className="mt-3"
          style={{
            fontWeight: 600,
            fontSize: "16px",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

export default Loader;
