import { neon } from '@neondatabase/serverless';

async function getUser(sql, request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/session=([a-f0-9]+)/);
  if (!match) return null;
  const rows = await sql`select user_id from sessions where token = ${match[1]}`;
  return rows[0]?.user_id || null;
}

export async function POST(request) {
  const sql = neon(process.env.DATABASE_URL);
  const { route_id, action, fare } = await request.json();

  const user_id = await getUser(sql, request);
  if (!user_id) {
    return Response.json(
      { message: "Please log in to vote." },
      { status: 401 }
    );
  }

  if (action === "confirm") {
    const already = await sql`
      select id from votes
      where user_id = ${user_id} and route_id = ${route_id} and action = 'confirm'`;
    if (already.length > 0) {
      return Response.json({ message: "You already confirmed this route." });
    }

    await sql`insert into votes (user_id, route_id, action) values (${user_id}, ${route_id}, 'confirm')`;
    await sql`update routes set confirmations = confirmations + 1, last_verified = current_date where id = ${route_id}`;
    return Response.json({ message: "Thanks! Fare confirmed." });
  }

  if (action === "report") {
    const amount = Number(fare);
    if (!amount || amount < 1 || amount > 500) {
      return Response.json({ message: "Please enter a sensible fare." }, { status: 400 });
    }

    const already = await sql`
      select id from votes
      where user_id = ${user_id} and route_id = ${route_id} and action = 'report'`;
    if (already.length > 0) {
      return Response.json({ message: "You already reported a fare for this route." });
    }

    await sql`insert into votes (user_id, route_id, action) values (${user_id}, ${route_id}, 'report')`;
    await sql`insert into fare_reports (route_id, suggested_fare) values (${route_id}, ${amount})`;
    const match = await sql`select count(*)::int as n from fare_reports where route_id = ${route_id} and suggested_fare = ${amount}`;
    if (match[0].n >= 3) {
      await sql`update routes set fare = ${amount}, last_verified = current_date, confirmations = 0 where id = ${route_id}`;
      return Response.json({ message: "Thanks! The fare is now R" + amount });
    }
    return Response.json({ message: "Thanks! Saved. It takes 3 matching reports to change the fare." });
  }

  return Response.json({ message: "Unknown action" }, { status: 400 });
}