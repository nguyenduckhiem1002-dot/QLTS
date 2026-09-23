export default function Loading() {
  return (
    <section className="page" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="metric-grid loading-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="skeleton skeleton-card" key={index} />
        ))}
      </div>
    </section>
  );
}
