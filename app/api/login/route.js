import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request) {
  const sql = neon(process.env.DATABASE_URL);
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ message: "Please fill in all fields." }, { status: 400 });
  }

  const rows = await sql`select id, password_hash from users where email = ${email}`;
  if (rows.length === 0) {
    return Response.json({ message: "Wrong email or password." }, { status: 400 });
  }

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) {
    return Response.json({ message: "Wrong email or password." }, { status: 400 });
  }

  const token = randomBytes(32).toString('hex');
  await sql`insert into sessions (token, user_id) values (${token}, ${rows[0].id})`;

  const res = Response.json({ message: "Logged in!" });
  res.headers.set(
    'Set-Cookie',
    `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  );
  return res;
}