import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

const createTable = await client.query(`
  SHOW CREATE TABLE memory_episodes
`);

const definition = createTable.rows[0]?.create_statement ?? "";

console.log("\n=== memory_episodes definition ===");
console.log(definition);

console.log("\n=== Required memory checks ===");

const checks = {
  vector1024: /embedding VECTOR\(1024\)/i.test(definition),
  vectorIndex: /VECTOR INDEX memory_embedding_idx/i.test(definition),
  cosineOps: /embedding vector_cosine_ops/i.test(definition),
  orgPrefix: /memory_embedding_idx\s*\(\s*org_id/i.test(definition),
};

console.table(checks);

const indexes = await client.query(`
  SHOW INDEX FROM memory_episodes
`);

console.log("\n=== memory_embedding_idx columns ===");
console.table(
  indexes.rows
    .filter((row) => row.index_name === "memory_embedding_idx")
    .map((row) => ({
      index_name: row.index_name,
      seq_in_index: row.seq_in_index,
      column_name: row.column_name,
      definition: row.definition,
      implicit: row.implicit,
      visible: row.visible,
    }))
);

if (!Object.values(checks).every(Boolean)) {
  throw new Error("FIELDfix vector-memory schema verification failed.");
}

console.log("\nFIELDfix vector-memory schema verified successfully.");

await client.end();
