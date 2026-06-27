import { posts } from "../../lib/mockPosts";

export default async function PostPage({ params }) {
  const { id } = await params;

  const post = posts.find((post) => post.id === parseInt(id));

  if (!post) {
    return <p>Post not found</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Post Details</h1>
      <p>
        <strong>ID:</strong> {post.id}
      </p>
      <p>
        <strong>Content:</strong> {post.content}
      </p>
      <p>
        <strong>Username:</strong> {post.username}
      </p>
    </div>
  );
}
