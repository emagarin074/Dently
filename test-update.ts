import { updateProcedure } from "./src/app/actions/procedures";

async function run() {
  const fd = new FormData();
  fd.append("name", "Test Procedure");
  fd.append("priceType", "FIXED");
  fd.append("isInstallmentAvailable", "true");
  // Just use a random procedure ID that exists, like Braces (Full)

  const res = await updateProcedure(
    "verano-dental-hub",
    "cm580c85c0005zvw619b0iutb",
    fd,
  );
  console.log("Result:", res);
}
run().catch(console.error);
