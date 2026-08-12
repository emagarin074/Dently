import { Pool } from "pg";

async function deepSearch() {
  const ports = [5432, 5433, 5434, 5435];
  const users = ["dently", "postgres", "emmanagarin", "root"];
  const dbs = ["dently", "dently_dev", "postgres", "emmanagarin", "dently_db"];

  for (const port of ports) {
    for (const u of users) {
      for (const db of dbs) {
        const conn = `postgresql://${u}:${u}@localhost:${port}/${db}`;
        const altConn = `postgresql://${u}@localhost:${port}/${db}`;

        for (const c of [conn, altConn]) {
          try {
            const pool = new Pool({
              connectionString: c,
              connectionTimeoutMillis: 1000,
            });
            const res = await pool.query(
              "SELECT table_name FROM information_schema.tables WHERE table_name = 'Clinic' OR table_name = 'clinic';",
            );
            if (res.rows.length > 0) {
              console.log(`\n🎉 FOUND CLINIC TABLE AT: ${c}`);
              const clinics = await pool.query(
                'SELECT id, name, slug, plan, "isActive" FROM "Clinic";',
              );
              const usersRes = await pool.query(
                'SELECT id, email, name, role, "clinicId" FROM "User";',
              );
              console.log(`Clinics (${clinics.rows.length}):`);
              clinics.rows.forEach((col) =>
                console.log(
                  `  • ${col.name} (${col.slug}) [Plan: ${col.plan}]`,
                ),
              );
              console.log(`Users (${usersRes.rows.length}):`);
              usersRes.rows.forEach((usr) =>
                console.log(`  • ${usr.name} <${usr.email}> (${usr.role})`),
              );
            }
            await pool.end();
          } catch (e) {
            // Ignore connection failures
          }
        }
      }
    }
  }
}

deepSearch().catch(console.error);
