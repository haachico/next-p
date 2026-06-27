export const metadata = {
  title: "My Social App",
  description: "A Next.js social media app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* NAVBAR - Shows on ALL pages */}
        <nav style={{ background: "#333", color: "white", padding: "15px" }}>
          <h2>My Social App</h2>
          <a href="/" style={{ color: "white", marginRight: "20px" }}>
            Home
          </a>
          <a href="/posts" style={{ color: "white" }}>
            Posts
          </a>
        </nav>

        {/* Page content changes here */}
        <main style={{ minHeight: "80vh" }}>{children}</main>

        {/* FOOTER - Shows on ALL pages */}
        <footer
          style={{
            background: "#f0f0f0",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <p>2024 My Social App. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
