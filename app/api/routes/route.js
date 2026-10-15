import { neon } from '@neondatabase/serverless';

export async function GET() {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select r.id, r.to_area, r.fare, r.hand_sign, r.tip, r.phrases,
           r.confirmations, r.last_verified,
           p.name as from_name, p.area as from_area, p.type, p.maps_link,
           p.latitude, p.longitude
    from routes r
    join pickup_points p on p.id = r.from_point_id
    order by r.id`;
  return Response.json(rows);
}