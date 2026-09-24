export default function Loading() {
  return (
    <section className="page" aria-busy="true">
      <div className="skeleton" style={{ width: 220, height: 30 }} />
      <div className="skeleton" style={{ width: 340, height: 16 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      <div className="two-col">
        <div className="skeleton" style={{ height: 240, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 240, borderRadius: 12 }} />
      </div>
    </section>
  );
}
