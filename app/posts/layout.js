import Link from "next/link";

export default function PostsLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      {/* SIDEBAR - Only for posts pages */}
      <aside
        style={{
          width: "200px",
          background: "#f9f9f9",
          padding: "20px",
          borderRight: "1px solid #ddd",
        }}
      >
        <h3>Posts Menu</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>
            <Link
              href="/posts"
              style={{ display: "block", marginBottom: "10px" }}
            >
              All Posts
            </Link>
          </li>
          <li>
            <Link
              href="/posts?sort=latest"
              style={{ display: "block", marginBottom: "10px" }}
            >
              Latest
            </Link>
          </li>
          <li>
            <Link href="/posts?sort=oldest" style={{ display: "block" }}>
              Oldest
            </Link>
          </li>
        </ul>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "20px" }}>{children}</main>
    </div>
  );
}
