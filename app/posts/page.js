"use client"; // This makes it a Client Component (can use useState, useEffect)

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newUsername, setNewUsername] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editUsername, setEditUsername] = useState("");

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      console.log(data, "check");
      setPosts(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          username: newUsername,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data, "check in create");
        setPosts([...posts, data.data]);
        setNewContent("");
        setNewUsername("");
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleDeletePost = async (id) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts(posts.filter((post) => post.id !== id));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleEditPost = (id) => {
    const post = posts.find((p) => p.id === id);
    setEditingId(id);
    setEditContent(post.content);
    setEditUsername(post.username);
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          username: editUsername,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update post in list
        setPosts(posts.map((p) => (p.id === id ? data.data : p)));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error editing post:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditUsername("");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Posts</h1>

      {/* Create Post Form */}
      <form
        onSubmit={handleCreatePost}
        style={{
          marginBottom: "20px",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <input
          type="text"
          placeholder="Username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          required
        />
        <textarea
          placeholder="What's on your mind?"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          required
        />
        <button type="submit">Post</button>
      </form>

      {/* Posts List */}
      {posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            {editingId === post.id ? (
              // Edit Form
              <div style={{ background: "#f9f9f9", padding: "10px" }}>
                <h3>Edit Post</h3>
                <input
                  type="text"
                  placeholder="Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  style={{
                    width: "100%",
                    marginBottom: "10px",
                    padding: "5px",
                  }}
                />
                <textarea
                  placeholder="Content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    width: "100%",
                    marginBottom: "10px",
                    padding: "5px",
                    minHeight: "80px",
                  }}
                />
                <button
                  onClick={() => handleSaveEdit(post.id)}
                  style={{
                    marginRight: "5px",
                    padding: "5px 10px",
                    background: "#4CAF50",
                    color: "white",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: "5px 10px",
                    background: "#999",
                    color: "white",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              // View Mode
              <>
                <Link
                  href={`/posts/${post.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ cursor: "pointer", marginBottom: "10px" }}>
                    <strong>{post.username}</strong>
                    <p>{post.content}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleEditPost(post.id)}
                  style={{
                    marginRight: "5px",
                    padding: "5px 10px",
                    background: "#2196F3",
                    color: "white",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  style={{
                    padding: "5px 10px",
                    background: "#f44336",
                    color: "white",
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
