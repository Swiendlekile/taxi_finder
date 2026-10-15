import { neon } from '@neondatabase/serverless';

export async function POST(request) {
  const sql = neon(process.env.DATABASE_URL);
  const { route_id, action, fare } = await request.json();

  if (action === "confirm") {
    await sql`update routes set confirmations = confirmations + 1, last_verified = current_date where id = ${route_id}`;
    return Response.json({ message: "Thanks! Fare confirmed." });
  }

  if (action === "report") {
    const amount = Number(fare);
    if (!amount || amount < 1 || amount > 500) {
      return Response.json({ message: "Please enter a sensible fare." }, { status: 400 });
    }
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