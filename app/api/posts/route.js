const pool = require("@/app/lib/db");

export async function GET(request) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query("SELECT * FROM posts");

    return Response.json({ success: true, data: rows });
  } catch (error) {
    return Response.json(
      { success: false, message: "Error fetching posts", error: error.message },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request) {
  let connection;
  try {
    const body = await request.json();

    if (!body.content || !body.username) {
      return Response.json(
        { success: false, message: "Content and username are required" },
        { status: 400 },
      );
    }

    connection = await pool.getConnection();

    const [result] = await connection.query(
      "INSERT INTO posts (content, username) VALUES (?, ?)",
      [body.content, body.username],
    );
    return Response.json(
      {
        success: true,
        data: {
          id: result.insertId,
          content: body.content,
          username: body.username,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Error creating post", error: error.message },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
