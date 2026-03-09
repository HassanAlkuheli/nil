import Skeleton from "./Skeleton";

export default function StatCard({ label, value, subvalue, loading }) {
  return (
    <div className="nil-card p-6 group hover:border-nil-ring transition-all duration-300">
      <p className="text-nil-grey text-xs uppercase tracking-widest mb-2">
        {label}
      </p>
      {loading ? (
        <>
          <Skeleton width="120px" height="28px" className="mb-2" />
          <Skeleton width="80px" height="16px" />
        </>
      ) : (
        <>
          <p className="text-nil-white text-2xl font-semibold font-mono tracking-tight">
            {value}
          </p>
          {subvalue && (
            <p className="text-nil-muted text-sm mt-1">{subvalue}</p>
          )}
        </>
      )}
    </div>
  );
}
