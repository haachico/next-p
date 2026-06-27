# Next.js Complete Guide - Interview Ready 🚀

## Table of Contents

1. [File Structure & Routing](#file-structure--routing)
2. [Server vs Client Components](#server-vs-client-components)
3. [Hydration](#hydration)
4. [API Routes](#api-routes)
5. [Layouts](#layouts)
6. [Navigation: Link vs `<a>`](#navigation-link-vs-a)
7. [Query Parameters](#query-parameters)
8. [Data Persistence](#data-persistence)
9. [Network Calls Explained](#network-calls-explained)
10. [Architecture Comparison](#architecture-comparison)
11. [Decision Tree](#decision-tree)
12. [Interview Questions](#interview-questions)
13. [Key Takeaways](#key-takeaways)

---

## File Structure & Routing

### How File Structure = URL

```
app/
  layout.js              → Root layout (wraps all pages)
  page.js                → Home page (/)
  posts/
    page.js              → /posts
    [id]/
      page.js            → /posts/123 (dynamic)
  api/
    posts/
      route.js           → /api/posts
    posts/[id]/
      route.js           → /api/posts/123
```

**Key:** File path automatically becomes URL. No routing configuration needed!

### Dynamic Routes

```javascript
// app/posts/[id]/page.js
export default async function PostDetail({ params }) {
  const { id } = await params; // ← MUST await!
  // id = "123" from URL
}
```

- `[id]` = dynamic segment
- `params.id` = the value from URL
- URL `/posts/hello` → `params.id = "hello"`

---

## Server vs Client Components

### Overview Table

| Feature         | Server Component            | Client Component                |
| --------------- | --------------------------- | ------------------------------- |
| **Default?**    | Yes (no `'use client'`)     | Only if `'use client'` at top   |
| **Runs on**     | Node.js (server)            | Browser (client)                |
| **Can use**     | Database, secrets, APIs     | `useState`, `useEffect`, events |
| **Can't use**   | Hooks (useState, etc)       | Direct database access          |
| **HTML sent**   | Already populated with data | Empty shell + scripts           |
| **Performance** | Faster (no extra requests)  | Slightly slower (fetch needed)  |
| **SEO**         | ✅ Good (content in HTML)   | ⚠️ Content loaded after JS      |

### Server Component Example

```javascript
// app/posts/[id]/page.js (NO 'use client')
import { posts } from "@/app/lib/mockPosts";

export default async function PostDetail({ params }) {
  const { id } = await params;

  // This code runs on SERVER
  const post = posts.find((p) => p.id === parseInt(id));

  // HTML with data already inside
  return <h1>{post.content}</h1>;
}
```

**What happens:**

1. User visits `/posts/1`
2. Server runs this code
3. Server finds the post
4. Server sends HTML: `<h1>Hello World</h1>`
5. Browser displays immediately ✅

### Client Component Example

```javascript
// app/posts/page.js ('use client')
"use client";
import { useState, useEffect } from "react";

export default function Posts() {
  const [posts, setPosts] = useState([]);

  // This code runs in BROWSER
  useEffect(() => {
    fetch("/api/posts") // Request to server
      .then((r) => r.json())
      .then((data) => setPosts(data.data));
  }, []);

  return posts.map((p) => <div key={p.id}>{p.content}</div>);
}
```

**What happens:**

1. User visits `/posts`
2. Server sends empty HTML + JavaScript
3. Browser downloads & runs JavaScript
4. useEffect triggers
5. Browser fetch('/api/posts')
6. Server responds with JSON
7. setState() → re-render ✅

---

## Hydration

### What is Hydration?

Hydration is when React takes HTML from the server and "wakes it up" with JavaScript to make it interactive.

```
Server sends:  <button>Click me</button>
Browser gets:  HTML string (not interactive yet)
React hydrates: Attaches onclick, state, hooks
Result:        Button now works ✅
```

### When Does Hydration Happen?

| Component Type       | Receives         | Hydration              |
| -------------------- | ---------------- | ---------------------- |
| **Server Component** | HTML only        | ❌ No hydration needed |
| **Client Component** | HTML + JS bundle | ✅ Hydration happens   |

### Server Component (No Hydration)

```javascript
// app/posts/[id]/page.js (NO 'use client')
export default async function PostDetail({ params }) {
  const { id } = await params;
  const post = posts.find((p) => p.id === parseInt(id));

  return <div>{post.content}</div>; // ← Just HTML, no JS needed
}
```

**What happens:**

1. Server renders → sends `<div>Hello World</div>`
2. Browser displays immediately
3. No hydration needed (static HTML) ✅

---

### Client Component (With Hydration)

```javascript
// app/posts/page.js ('use client')
"use client";
import { useState } from "react";

export default function PostsPage() {
  const [posts, setPosts] = useState([]);

  return (
    <form onSubmit={handleCreate}>
      <input onChange={(e) => setContent(e.target.value)} />
      <button>Create</button>
    </form>
  );
}
```

**What happens:**

1. Server renders → sends HTML with form
2. Browser receives:
   ```html
   <form>
     <input />
     <button>Create</button>
   </form>
   <script>
     /* React code, hooks, handlers */
   </script>
   ```
3. JavaScript loads
4. **React hydrates:** Attaches onChange, onSubmit, useState
5. Form becomes interactive ✅

---

### Timeline in Browser

```
1. HTML appears (no interaction yet)      ← Fast ⚡
2. JavaScript downloads                  ← 100-500ms
3. React hydrates (you don't see this)    ← <100ms
4. Form is now interactive ✅             ← User can type/click
```

---

### Hydration Mismatch (Common Bug)

```javascript
// ❌ WRONG - Can cause hydration mismatch
export default function BadComponent() {
  const time = new Date().toLocaleString();
  return <div>{time}</div>;
}
```

**Problem:**

- Server renders: `<div>2026-06-27 10:30:00</div>`
- Browser renders: `<div>2026-06-27 10:31:00</div>` ← Different!
- → Hydration error! ❌

**Fix:** Use `useEffect` for client-only code

```javascript
"use client";
import { useEffect, useState } from "react";

export default function GoodComponent() {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(new Date().toLocaleString()); // ← Browser only
  }, []);

  return <div>{time}</div>;
}
```

---

## API Routes

### How They Work

**File path = Endpoint:**

```
app/api/posts/route.js → /api/posts
app/api/posts/[id]/route.js → /api/posts/123
```

### Basic API Route

```javascript
// app/api/posts/route.js

export async function GET(request) {
  // Handles: GET /api/posts
  const posts = await db.posts.find();
  return Response.json({ success: true, data: posts });
}

export async function POST(request) {
  // Handles: POST /api/posts
  const body = await request.json();

  // Validate
  if (!body.content) {
    return Response.json(
      { success: false, error: "Content required" },
      { status: 400 },
    );
  }

  // Create
  const newPost = { id: Date.now(), ...body };
  await db.posts.insert(newPost);

  return Response.json({ success: true, data: newPost }, { status: 201 });
}
```

### Dynamic API Route

```javascript
// app/api/posts/[id]/route.js

export async function GET(request, { params }) {
  const { id } = await params; // ← MUST await!

  const post = await db.posts.findOne({ id: parseInt(id) });

  if (!post) {
    return Response.json(
      { success: false, error: "Not found" },
      { status: 404 },
    );
  }

  return Response.json({ success: true, data: post });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const updated = await db.posts.updateOne(
    { id: parseInt(id) },
    { $set: body },
  );

  return Response.json({ success: true, data: updated });
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  await db.posts.deleteOne({ id: parseInt(id) });

  return Response.json({ success: true, message: "Deleted" });
}
```

### HTTP Methods Mapping

```
GET    → Retrieve data
POST   → Create new data
PUT    → Update existing data (full replacement)
PATCH  → Partial update
DELETE → Remove data
```

### Status Codes

```
200 → OK (GET successful)
201 → Created (POST successful)
400 → Bad Request (client error - invalid input)
401 → Unauthorized (not authenticated)
404 → Not Found (resource doesn't exist)
500 → Server Error (something broke)
```

### Console Logs in API Routes

✅ **Works perfectly!** Logs appear in terminal where `npm run dev` runs:

```javascript
export async function GET(request, { params }) {
  const { id } = await params;

  console.log("User requested post ID:", id); // ✅ Appears in terminal
  console.log("Request URL:", request.url); // ✅ Appears in terminal

  return Response.json({ data: post });
}
```

---

## Layouts

### What are Layouts?

Layouts are shared components that wrap pages. They **persist across navigation** (don't unmount/remount when you navigate).

```
┌─────────────────────────────┐
│      layout.js (Navbar)     │ ← Persists! Doesn't change
├─────────────────────────────┤
│                             │
│   page.js content           │ ← Changes per route
│   (different per page)      │
│                             │
├─────────────────────────────┤
│      layout.js (Footer)     │ ← Persists! Doesn't change
└─────────────────────────────┘
```

### Automatic Layout Wrapping (No Imports!)

**Key:** You don't import layouts anywhere! Next.js automatically wraps pages.

```
When user visits /posts/123:

1. Next.js finds: app/posts/[id]/page.js
2. Next.js finds: app/posts/layout.js (if exists)
3. Next.js wraps: <PostsLayout><PostDetail /></PostsLayout>
4. Next.js finds: app/layout.js
5. Final: <RootLayout><PostsLayout><PostDetail /></PostsLayout></RootLayout>

All automatic! No manual imports needed!
```

### File Structure

```
app/
  layout.js              ← Root layout (ALL pages)
  page.js                ← Home page
  posts/
    layout.js            ← Posts layout (only /posts pages)
    page.js              ← /posts
    [id]/
      page.js            ← /posts/123
```

### Root Layout Example

```javascript
// app/layout.js

export const metadata = {
  title: "My App",
  description: "Social media app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* NAVBAR - Shows on ALL pages */}
        <nav style={{ background: "#333", color: "white", padding: "15px" }}>
          <h2>My App</h2>
          <a href="/">Home</a>
          <a href="/posts">Posts</a>
        </nav>

        {/* Page content changes here */}
        {children}

        {/* FOOTER - Shows on ALL pages */}
        <footer style={{ background: "#f0f0f0", padding: "20px" }}>
          <p>&copy; 2024</p>
        </footer>
      </body>
    </html>
  );
}
```

### Nested Layout Example

```javascript
// app/posts/layout.js

import Link from "next/link";

export default function PostsLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      {/* SIDEBAR - Only for posts pages */}
      <aside style={{ width: "200px", background: "#f9f9f9", padding: "20px" }}>
        <h3>Posts Menu</h3>
        <ul>
          <li>
            <Link href="/posts">All Posts</Link>
          </li>
          <li>
            <Link href="/posts?sort=latest">Latest</Link>
          </li>
          <li>
            <Link href="/posts?sort=oldest">Oldest</Link>
          </li>
        </ul>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "20px" }}>{children}</main>
    </div>
  );
}
```

### Interview Question

**Q: "Do layouts need to be imported in pages?"**

> _No! Layouts are automatically detected and applied based on file structure. Next.js automatically wraps pages with their corresponding layouts. You don't need to import or manually wrap anything._

---

## Navigation: Link vs `<a>`

### Quick Decision

- **`<Link>` for internal links** → `/posts`, `/profile`
- **`<a>` for external links** → `https://google.com`, `mailto:`

### Detailed Comparison

| Feature     | `<Link>`         | `<a>`                |
| ----------- | ---------------- | -------------------- |
| **For**     | Internal routing | External URLs        |
| **Example** | `/posts/123`     | `https://google.com` |
| **Reload**  | No (client-side) | Yes (full page)      |
| **Speed**   | Fast ⚡          | Slower               |
| **Layout**  | Persists         | Resets               |
| **State**   | Preserved        | Lost                 |

### `<Link>` (Client-Side Navigation)

```javascript
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/posts">Posts</Link>
      <Link href={`/posts/${id}`}>Post Detail</Link>
    </nav>
  );
}
```

**What happens:**

1. Click link
2. Next.js intercepts (no full reload)
3. URL changes
4. Only page content updates
5. Layout persists ✅
6. No flicker, fast ⚡

### `<a>` Tag (Full Reload)

```javascript
export default function Footer() {
  return (
    <footer>
      <a href="https://twitter.com">Follow Us</a>
      <a href="mailto:hello@example.com">Email</a>
    </footer>
  );
}
```

**What happens:**

1. Click link
2. Browser makes new request
3. Full page reloads ❌
4. All components re-mount
5. Component state resets
6. Takes longer

### Real Example

```javascript
// CORRECT ✅
import Link from "next/link";

export default function PostsList() {
  return (
    <div>
      {/* Internal links = Link component */}
      <Link href="/">Home</Link>
      <Link href="/posts">All Posts</Link>

      {/* External links = <a> tag */}
      <a href="https://github.com">GitHub</a>
      <a href="mailto:test@example.com">Email</a>
    </div>
  );
}
```

### Interview Question

**Q: "What's the difference between `<Link>` and `<a>` in Next.js?"**

> _`<Link>` is a Next.js component for internal navigation that uses client-side routing - no full page reload. `<a>` is an HTML tag that causes a full page reload. Use `<Link>` for internal routes and `<a>` for external URLs._

---

## Query Parameters

### What are Query Params?

Query parameters are key-value pairs in the URL after `?`:

```
/posts                          ← No params
/posts?sort=latest              ← 1 param: sort=latest
/posts?sort=latest&page=2       ← 2 params
/posts?sort=latest&page=2&limit=10  ← 3 params
```

### Client Component: Read Query Params

```javascript
"use client";
import { useSearchParams } from "next/navigation";

export default function PostsPage() {
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort"); // "latest" or null
  const page = searchParams.get("page"); // "1" or null

  useEffect(() => {
    fetch(`/api/posts?sort=${sort}&page=${page}`)
      .then((r) => r.json())
      .then((data) => setPosts(data.data));
  }, [sort, page]);

  return <div>{posts.map(...)}</div>;
}
```

### Server Component: Read Query Params

```javascript
// NO 'use client' - Server Component

export default async function PostsPage({ searchParams }) {
  const sort = await searchParams.sort; // "latest" or undefined
  const page = await searchParams.page; // "1" or undefined

  // Filter on server
  let posts = mockPosts.posts;
  if (sort === "latest") {
    posts = posts.sort((a, b) => b.id - a.id);
  }

  return <div>{posts.map(...)}</div>;
}
```

### API Route: Read Query Params

```javascript
// app/api/posts/route.js

export async function GET(request) {
  // Read query params from URL
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort");
  const page = url.searchParams.get("page");
  const limit = url.searchParams.get("limit");

  console.log({ sort, page, limit });

  // Filter based on params
  let posts = mockPosts.posts;

  if (sort === "latest") {
    posts = posts.sort((a, b) => b.id - a.id);
  }

  // Paginate
  const start = (parseInt(page || 1) - 1) * parseInt(limit || 10);
  const paginatedPosts = posts.slice(start, start + parseInt(limit || 10));

  return Response.json({ success: true, data: paginatedPosts });
}
```

### Multiple Query Params

```javascript
// Read all params at once
const url = new URL(request.url);
const params = Object.fromEntries(url.searchParams);

// Output: { sort: 'latest', page: '2', limit: '10' }
const { sort, page, limit } = params;

// Or read individually
const sort = url.searchParams.get("sort");
const page = url.searchParams.get("page");
```

### Build Query String from Object

```javascript
const filters = { sort: "latest", page: 2, limit: 10 };
const queryString = new URLSearchParams(filters).toString();
// Output: "sort=latest&page=2&limit=10"

fetch(`/api/posts?${queryString}`);
```

### Query Params vs Local State

| Use Case               | Approach     | Why                                    |
| ---------------------- | ------------ | -------------------------------------- |
| **Shareable filters**  | Query Params | URL can be bookmarked/shared           |
| **E-commerce filters** | Query Params | Users share `/products?category=shoes` |
| **Search results**     | Query Params | Google sees `/search?q=hello`          |
| **Temporary UI state** | Local State  | No need to change URL                  |
| **Form dropdowns**     | Local State  | Internal filtering only                |

**Example with Query Params (Better for Sharing):**

```javascript
// User can share this URL
/posts?sort=latest&page=2
```

**Example with Local State (Internal Only):**

```javascript
// URL stays as /posts
// Sorting only happens locally in component state
```

### Interview Question

**Q: "How do you read query parameters in an API route?"**

> _Use `const url = new URL(request.url)` to get the URL, then use `url.searchParams.get('paramName')` to read individual parameters. For multiple params, you can use `Object.fromEntries(url.searchParams)` to get all params as an object._

---

## Data Persistence

### Current System (Mock Data in RAM)

```javascript
// app/lib/mockPosts.js
export let posts = [{ id: 1, content: "Hello", username: "john" }];
```

**When data persists:**

- ✅ **Page refresh (F5):** Data stays (server still running)
- ❌ **Server restart:** Data lost (new process = new array)

### Why Refresh Persists Data

```
User creates post → posts.push(newPost) → data in SERVER RAM
User refreshes page (F5) →
  ✅ Browser reloads
  ✅ Server still running
  ✅ Same posts array in RAM
  ✅ Data persists!
```

### Why Server Restart Loses Data

```
User creates post → posts array has 3 items
Developer: Ctrl+C (stop server)
Developer: npm run dev (restart server)
  ❌ New Node.js process
  ❌ New posts array (from mockPosts.js defaults)
  ❌ Back to original 2 items
```

### Difference from React-Only App

| System             | Browser Refresh         | Data Loss              |
| ------------------ | ----------------------- | ---------------------- |
| **React App**      | State re-initializes ❌ | Immediately            |
| **Next.js Server** | Server data in RAM ✅   | Only on server restart |

**Key insight:** Server RAM persists across browser refreshes, but not server restarts!

### Real Solutions

| Option             | Where       | Persistence     | When to Use     |
| ------------------ | ----------- | --------------- | --------------- |
| **Mock (Current)** | Server RAM  | Refresh only ⚠️ | Learning        |
| **JSON File**      | Disk file   | Restart too ✅  | Simple projects |
| **Database**       | MongoDB/SQL | Forever ✅✅    | Production      |

---

## Network Calls Explained

### What is a "Network Call"?

Two different things people mean:

1. **Initial Page Load Request:** Browser → Server
   - ALL pages make this
   - Both Server & Client components use this

2. **fetch() in useEffect:** Browser JavaScript → Server API
   - ONLY Client components do this
   - Extra request after page loads

### Server Component (1 Total Request)

```
Browser GET /posts/1
    ↓
Server executes code
    ↓
Server sends: <div>Post content here</div>
    ↓
Done! No fetch() needed
```

**Network calls:** 1 ✅

### Client Component (2 Total Requests)

```
Browser GET /posts
    ↓
Server sends: JavaScript code + empty <div>
    ↓
JavaScript runs in browser
    ↓
useEffect runs
    ↓
Browser fetch('/api/posts')  ← Extra request!
    ↓
Server sends: JSON data
    ↓
Browser setState() → re-render
```

**Network calls:** 2 ⚠️

### What Browser Actually Receives

#### Server Component HTML

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="__next">
      <h1>Post Details</h1>
      <p>Hello World</p>
      ← Data already here!
    </div>
    <script src="/_next/static/chunks/main.js"></script>
  </body>
</html>
```

#### Client Component HTML

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="__next"></div>
    ← Empty!
    <script src="/_next/static/chunks/main.js"></script>
    <script src="/_next/static/chunks/posts.js"></script>
  </body>
</html>
```

**Note:** Server ALWAYS sends HTML! The difference is whether it has content already.

### Timeline Visualization

```
TIME 0: Server sends
        ├─ Server Component: HTML with data
        └─ Client Component: Empty HTML + scripts

TIME 1: Browser receives
        ├─ Server Component: Content visible immediately
        └─ Client Component: Blank page

TIME 2: JavaScript runs (Client Component only)
        ├─ React initializes
        ├─ Renders component
        └─ Page shows content structure

TIME 3: useEffect runs (Client Component only)
        ├─ fetch('/api/posts')
        ├─ Browser waits for server
        └─ Page still loading data

TIME 4: Data arrives (Client Component only)
        ├─ setState() updates
        ├─ Re-render
        └─ Content appears
```

---

## Architecture Comparison

### React + Express (Traditional)

```
┌─────────────────┐         ┌──────────────────┐
│   SERVER A      │         │   SERVER B       │
│  (React App)    │         │ (Express Backend)│
│  Vercel/Netlify │         │ Heroku/AWS/etc   │
│                 │         │                  │
│ - index.html    │         │ - GET /api/posts │
│ - bundle.js     │         │ - POST /api/posts│
│ - CSS           │         │ - Database       │
└─────────────────┘         └──────────────────┘
        ↑                           ↑
        │                           │
    Browser                    Network call
    downloads                (different server)
    React
```

**Characteristics:**

- Two separate servers
- More network latency
- More complex deployment
- React server sends SPA (Single Page App)
- Express server just provides data via APIs

### Next.js (Modern)

```
┌────────────────────────────────┐
│    ONE SERVER (Vercel)         │
├────────────────────────────────┤
│                                │
│ BACKEND (Node.js):             │
│ - Server Components execute    │
│ - API routes (/api/posts)      │
│ - Database queries             │
│                                │
│ FRONTEND (sent to browser):    │
│ - Client Components (JS)       │
│ - HTML (pre-rendered)          │
│                                │
└────────────────────────────────┘
        ↑
        │
    Browser
    downloads
    everything
```

**Characteristics:**

- ONE server handles both
- Less network latency
- Simpler deployment
- Can do server-side rendering
- Direct database access from components

### Key Differences

| Aspect              | React + Express       | Next.js                  |
| ------------------- | --------------------- | ------------------------ |
| **Frontend Server** | Separate              | Same                     |
| **Backend Server**  | Separate              | Same                     |
| **Deployment**      | 2 services            | 1 service                |
| **Data Fetching**   | Browser must fetch    | Direct on server         |
| **Latency**         | Higher                | Lower                    |
| **JavaScript**      | Heavy (all on client) | Reduced (some on server) |

### Deployment Example

**React + Express:**

```bash
# Deploy React to Vercel
npm run build
# Upload to vercel.com

# Deploy Express to Heroku
git push heroku main
```

**Next.js:**

```bash
# Deploy everything
npm run build
git push
# Done! Vercel handles both
```

---

## Decision Tree

### How to Choose Server vs Client Component

```
START: New page needed
│
├─ Does it have user interaction?
│  (buttons, forms, filters, clicks)
│  ├─ YES → 'use client' (Client Component)
│  │        └─ Create API route for data
│  │        └─ Use fetch() in useEffect
│  │
│  └─ NO → (no 'use client') (Server Component)
│         └─ Query DB directly
│         └─ No API route needed
│
├─ Does data change in real-time?
│  (notifications, live updates, comments appearing)
│  ├─ YES → 'use client' (Client Component)
│  │        └─ Polling or WebSocket
│  │
│  └─ NO → Server Component is fine
│
└─ Is SEO important?
   (Google needs to see content in HTML)
   ├─ YES → Server Component better
   │        (HTML has content immediately)
   │
   └─ NO → Either works
```

### Examples

**Server Component (no `'use client'`):**

- Post detail page (just display)
- User profile page (static info)
- Product page (read-only)
- Blog post (static content)

**Client Component (`'use client'`):**

- Posts list (has create form)
- Shopping cart (add/remove buttons)
- Chat page (real-time messages)
- Dashboard (filters, sorting)
- Settings page (form inputs)

---

## Interview Questions

### Q1: "Explain the difference between Server and Client components"

**Answer:**

> Server components run on the backend (Node.js) and can directly access databases and secrets. They're sent to the browser as HTML, so they don't require JavaScript execution. Client components run in the browser with React and can use hooks like useState and useEffect, but they can't access the database directly—they must use API routes to fetch data.

### Q2: "When would you use a Server Component over a Client Component?"

**Answer:**

> Use Server Components by default because they're faster and have smaller JavaScript bundles. Only switch to Client Components when you need:
>
> - User interactivity (forms, buttons, clicks)
> - Real-time data updates
> - Browser APIs (localStorage, geolocation)

### Q3: "How do API routes work in Next.js?"

**Answer:**

> API routes are created by exporting functions (GET, POST, PUT, DELETE) from `route.js` files in the `app/api/` directory. The file path becomes the URL. For example, `app/api/posts/route.js` creates the endpoint `/api/posts`. Each exported function corresponds to an HTTP method.

### Q4: "What's the advantage of Next.js over React + Express?"

**Answer:**

> Next.js runs frontend and backend on the same server, so communication is faster and there's no network latency between them. Deployment is simpler—one service instead of two. Also, Server Components can query the database directly without needing API routes, reducing unnecessary network calls.

### Q5: "Do you always need API routes?"

**Answer:**

> No. Use API routes only for Client Components that need data. Server Components can query the database directly without API routes. This reduces network calls and improves performance. API routes are the bridge between Client Components (which can't access the database) and the database.

### Q6: "How do you handle form submission in Next.js?"

**Answer:**

> For Client Components, use `onSubmit` with fetch to call an API route. For example:
>
> ```javascript
> const handleSubmit = async (e) => {
>   e.preventDefault();
>   const res = await fetch("/api/posts", {
>     method: "POST",
>     body: JSON.stringify(formData),
>   });
>   const data = await res.json();
> };
> ```

### Q7: "What happens when you refresh a page in Next.js?"

**Answer:**

> For Server Components, it re-fetches from the database. For Client Components, browser state is lost (useState resets), but the page structure is still there. Then useEffect runs and fetches data from the API.

### Q8: "What's the difference in network calls between Server and Client components?"

**Answer:**

> Server Components make one request: the initial page load. The server processes everything and sends HTML with data already inside. Client Components make two requests: first the page load (getting HTML + JavaScript), then an additional fetch() call from useEffect to get data as JSON.

### Q9: "How does the server know to run as a Server Component vs Client Component?"

**Answer:**

> If a component doesn't have `'use client'` at the top, it's a Server Component. Next.js runs it on the server and sends the result as HTML. If it has `'use client'`, Next.js sends it as JavaScript to the browser.

### Q10: "What's the purpose of `await params`?"

**Answer:**

> In Next.js 13+, `params` is a Promise, so you must await it before using it. This allows Next.js to handle dynamic routes asynchronously and fetch data based on the params if needed.

### Q11: "Explain how Layouts work in Next.js. Do you need to import them?"

**Answer:**

> Layouts are automatically detected and applied based on file structure. Next.js automatically wraps pages with their corresponding layouts. You don't need to import or manually use layouts anywhere - it's all automatic!

### Q12: "When should you use `<Link>` vs `<a>` tag?"

**Answer:**

> Use `<Link>` for internal navigation (like `/posts`, `/profile`). It provides faster client-side routing without full page reloads and preserves component state. Use `<a>` tags only for external URLs (like `https://google.com` or `mailto:`), where full page reload is necessary anyway.

### Q13: "How do you handle filters with query parameters in a Client Component?"

**Answer:**

> Use `useSearchParams()` hook to read query params from the URL. Then use them to fetch data from an API. Example:
>
> ```javascript
> const searchParams = useSearchParams();
> const sort = searchParams.get("sort");
> fetch(`/api/posts?sort=${sort}`);
> ```

### Q14: "What's the difference between using query params vs local state for filtering?"

**Answer:**

> Query params are better for shareable, bookmarkable filters (e-commerce, search). Users can share the URL and get the same results. Local state is simpler for temporary, internal UI state (form dropdowns, toggles) where you don't need the URL to change.

### Q15: "How do you read query parameters in an API route?"

**Answer:**

> Use `const url = new URL(request.url)` to get the URL object, then `url.searchParams.get('paramName')` to read individual parameters. For multiple params, use `Object.fromEntries(url.searchParams)` to get all params as an object.

### Q16: "What is hydration and when does it happen?"

**Answer:**

> Hydration is when React takes HTML from the server and attaches JavaScript to make it interactive. It happens only in Client Components (`'use client'`). The server sends HTML + JavaScript bundle, React loads the JS, and attaches event handlers and state management. Server Components don't need hydration because they're just static HTML.

### Q17: "Can Server Components cause hydration mismatches?"

**Answer:**

> No. Server Components don't need hydration because they only send HTML. Hydration mismatches happen in Client Components when the server-rendered HTML doesn't match the browser-rendered HTML (like different timestamps or random values). Fix this by using `useEffect` for client-only code.

### Q18: "What happens if you have a hydration mismatch?"

**Answer:**

> React will show an error and the page may not work correctly. Example: Server renders a timestamp, browser renders a different timestamp → Mismatch. Fix: Put time-dependent code in `useEffect` so it only runs on the browser after hydration.

---

## Key Takeaways

### 1. File Structure = URL

- No routing configuration needed
- `app/posts/[id]/page.js` → `/posts/123`

### 2. Server Component by Default

- No `'use client'` → Server Component ✅
- Faster, secure, smaller JS bundles
- Can access databases directly
- Can't use hooks (useState, useEffect)

### 3. Client Component for Interactivity

- `'use client'` at top
- Can use hooks (useState, useEffect)
- Must use fetch() to get data via API routes

### 4. Hydration Happens in Client Components

- Server sends: HTML + JavaScript bundle
- Browser receives both
- React hydrates: Attaches event handlers, state, hooks
- Server Components don't need hydration (static HTML only)

### 5. Layouts Auto-Wrap Pages

- No imports needed!
- Next.js automatically wraps based on file structure
- Persist across navigation (don't unmount)

### 5. Layouts Auto-Wrap Pages

- No imports needed!
- Next.js automatically wraps based on file structure
- Persist across navigation (don't unmount)

### 6. Navigation: Use Right Tool

- `<Link>` for internal routes → Fast, client-side
- `<a>` for external URLs → Standard HTML

### 7. Query Params vs Local State

- **Query Params:** Shareable, bookmarkable, SEO-friendly
- **Local State:** Simpler, internal-only filtering

### 8. API Routes are Bridges

- Client Components ↔ API Routes ↔ Database
- File path = endpoint
- Export GET, POST, PUT, DELETE functions
- Read query params with `url.searchParams.get()`

### 9. Server vs Client Decision

- **Server by default** (better performance)
- **Client only if needed** (interaction, real-time, hooks)

### 10. Data Persistence

- **Across browser refresh:** ✅ Yes (server RAM)
- **Across server restart:** ❌ No (new process)
- **Use database for real persistence**

### 11. Network Calls

- Server Component: 1 request (initial load)
- Client Component: 2+ requests (initial + fetch calls)
- Extra requests from useEffect's fetch()

### 12. Next.js vs React + Express

- **Same server:** Frontend + Backend together
- **Faster:** No inter-server network calls
- **Simpler deployment:** One service

### 13. What Browser Receives

- **Server Component:** HTML with data inside
- **Client Component:** HTML + JavaScript + hydration

### 14. Production Architecture

- Everything runs on ONE server (Vercel, Netlify, etc.)
- No need for separate frontend/backend servers
- Simpler scaling and management

### 15. Params are Promises

- Always `await params` in Server/Client components
- Also `await searchParams` in Server components
- Allows async data fetching based on route params

---

## Quick Reference

### Create POST API with validation

```javascript
export async function POST(request) {
  const body = await request.json();

  if (!body.content) {
    return Response.json({ error: "Content required" }, { status: 400 });
  }

  const item = { id: Date.now(), ...body };
  return Response.json({ data: item }, { status: 201 });
}
```

### Create Client Component with Form

```javascript
"use client";
import { useState } from "react";

export default function Form() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Create Server Component with Data

```javascript
// NO 'use client' - this is Server Component
import { db } from "@/app/lib/db";

export default async function Page({ params }) {
  const { id } = await params; // ← MUST await!
  const item = await db.find(parseInt(id));

  if (!item) return <div>Not found</div>;

  return <div>{item.content}</div>;
}
```

### Create Dynamic API Route

```javascript
export async function GET(request, { params }) {
  const { id } = await params; // ← MUST await!

  const item = mockData.find((p) => p.id === parseInt(id));

  if (!item) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ data: item });
}
```

---

## Study Tips

✅ **Review this before interviews**
✅ **Understand the decision tree** (Server vs Client)
✅ **Know the difference in network calls**
✅ **Practice with the examples** in your app
✅ **Test both Server and Client components** locally
✅ **Understand why await params is needed**
✅ **Remember: Server by default, Client only when needed**

Good luck with your interview! 🚀
