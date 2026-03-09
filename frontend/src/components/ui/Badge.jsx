export default function Badge({ status }) {
  const styles = {
    safe: "nil-badge-safe",
    warning: "nil-badge-warning",
    danger: "nil-badge-danger",
  };

  return (
    <span className={styles[status] || "nil-badge-safe"}>
      {status?.toUpperCase()}
    </span>
  );
}
