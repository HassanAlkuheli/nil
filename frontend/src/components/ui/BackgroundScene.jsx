export default function BackgroundScene() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <iframe
        src="https://my.spline.design/ripplefield-Ah1sFXneUGkEyEfvImcokZef/"
        width="400%"
        height="100%"
        style={{
          border: "none",
          transform: "scale(1.2) translate(-30%, 0)",
          transformOrigin: "center center",
        }}
        title="Background 3D scene"
      />
    </div>
  );
}
