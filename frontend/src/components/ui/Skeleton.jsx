export default function Skeleton({ width = "100%", height = "20px", className = "" }) {
  return (
    <div
      className={`bg-nil-elevated rounded-md animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
}
