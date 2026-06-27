const pool = require("@/app/lib/db");

export async function GET(request, { params }) {
  const { id } = await params;

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT * FROM posts WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return Response.json(
        { success: false, message: "Post not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, data: rows[0] });
  } catch (error) {
    return Response.json(
      { success: false, message: "Error fetching post", error: error.message },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;

  const body = await request.json();

  if (!body.content || !body.username) {
    return Response.json(
      { success: false, message: "Content and username are required" },
      { status: 400 },
    );
  }

  let connection;

  try {
    connection = await pool.getConnection();

    const [result] = await connection.query(
      `update posts set content = ?, username = ? where id = ?`,
      [body.content, body.username, id],
    );
    if (result.affectedRows === 0) {
      return Response.json(
        { success: false, message: "Post not found" },
        { status: 404 },
      );
    }

    return Response.json(
      {
        success: true,
        data: {
          id: parseInt(id),
          content: body.content,
          username: body.username,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Error updating post", error: error.message },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  let connection;
  try {
    connection = await pool.getConnection();

    const [result] = await connection.query("DELETE FROM posts WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return Response.json(
        { success: false, message: "Post not found" },
        { status: 404 },
      );
    }
    return Response.json(
      { success: true, message: "Post deleted" },
      { status: 203 },
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Error deleting post", error: error.message },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
