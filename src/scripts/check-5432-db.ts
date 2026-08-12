import { Pool } from "pg";

async function check5432() {
  const passwords = ["postgres", "dently", "root", "secret", "password", ""];
  const user = "postgres";

  for (const pass of passwords) {
    const connStr = `postgresql://${user}:${pass}@localhost:5432/postgres`;
    try {
      const pool = new Pool({
        connectionString: connStr,
        connectionTimeoutMillis: 1500,
      });
      const res = await pool.query(
        "SELECT datname FROM pg_database WHERE datistemplate = false;",
      );
      console.log(`\n🎉 CONNECTED TO PORT 5432 WITH PASS "${pass}"`);
      console.log(
        "Databases on 5432:",
        res.rows.map((r) => r.datname),
      );

      for (const dbName of res.rows.map((r) => r.datname)) {
        const dbConn = `postgresql://${user}:${pass}@localhost:5432/${dbName}`;
        try {
          const dbPool = new Pool({
            connectionString: dbConn,
            connectionTimeoutMillis: 1500,
          });
          const tables = await dbPool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_name = 'Clinic' OR table_name = 'clinic' OR table_name = 'User' OR table_name = 'user';",
          );
          if (tables.rows.length > 0) {
            console.log(`  └─ [DB: ${dbName}] Found matching tables!`);
            try {
              const clinics = await dbPool.query('SELECT * FROM "Clinic";');
              const users = await dbPool.query('SELECT * FROM "User";');
              console.log(
                `     Clinics (${clinics.rows.length}):`,
                clinics.rows.map((c) => ({
                  name: c.name,
                  slug: c.slug,
                  plan: c.plan,
                })),
              );
              console.log(
                `     Users (${users.rows.length}):`,
                users.rows.map((u) => ({
                  name: u.name,
                  email: u.email,
                  role: u.role,
                })),
              );
            } catch (err) {
              console.log(`     (Error querying tables in ${dbName}:`, err);
            }
          }
          await dbPool.end();
        } catch (e) {
          // ignore
        }
      }

      await pool.end();
      break;
    } catch (e) {
      // ignore
    }
  }
}

check5432().catch(console.error);
