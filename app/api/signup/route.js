import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request) {
  const sql = neon(process.env.DATABASE_URL);
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return Response.json({ message: "Please fill in all fields." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ message: "Password must be 8+ characters." }, { status: 400 });
  }

  const existing = await sql`select id from users where email = ${email}`;
  if (existing.length > 0) {
    return Response.json({ message: "That email is already used." }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`
    insert into users (name, email, password_hash)
    values (${name}, ${email}, ${hash})
    returning id
  `;
  const user_id = rows[0].id;

  const token = randomBytes(32).toString('hex');
  await sql`insert into sessions (token, user_id) values (${token}, ${user_id})`;

  const res = Response.json({ message: "Account created! You are logged in." });
  res.headers.set(
    'Set-Cookie',
    `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  );
  return res;
}