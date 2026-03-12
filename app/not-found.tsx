import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="site-shell site-main">
      <section className="empty-state">
        <h1>Page not found</h1>
        <p>The route is missing or the city is not public yet.</p>
        <Link href="/en" className="button button-primary">
          Back to kinelo.fit
        </Link>
      </section>
    </main>
  );
}
