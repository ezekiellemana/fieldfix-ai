import crypto from "node:crypto";
import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

function deterministicUuid(label) {
  const hash = crypto.createHash("sha256").update(label).digest("hex");

  const chars = hash.slice(0, 32).split("");

  chars[12] = "4";

  const variant = parseInt(chars[16], 16);
  chars[16] = ((variant & 0x3) | 0x8).toString(16);

  const value = chars.join("");

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20, 32),
  ].join("-");
}

const ORG_ID = deterministicUuid("fieldfix-demo-org");
const TECHNICIAN_ID = deterministicUuid("fieldfix-demo-technician");
const SUPERVISOR_ID = deterministicUuid("fieldfix-demo-supervisor");

const sites = [
  ["dodoma-central", "Dodoma Central Water Station", "Dodoma"],
  ["chamwino", "Chamwino Water Station", "Dodoma"],
  ["morogoro-north", "Morogoro North Pump Station", "Morogoro"],
  ["aru-meru", "Meru Water Station", "Arusha"],
  ["mwanza-east", "Mwanza East Pump Station", "Mwanza"],
  ["iringa-central", "Iringa Central Water Station", "Iringa"],
  ["mbeya-south", "Mbeya South Pump Station", "Mbeya"],
  ["singida-main", "Singida Main Water Station", "Singida"],
].map(([slug, name, region]) => ({
  id: deterministicUuid(`site-${slug}`),
  slug,
  name,
  region,
}));

const patterns = [
  {
    key: "capacitor",
    title: "Heavy vibration and delayed pressure loss",
    symptoms:
      "Pump develops heavy vibration and loses pressure after approximately twenty minutes of operation.",
    rootCause: "Motor capacitor degradation",
    goodFix:
      "Inspect operating voltage and capacitor capacitance, then replace degraded motor capacitor.",
    goodOutcome:
      "Pressure and vibration returned to normal with no recurrence during the verification period.",
    lesson:
      "When vibration appears together with delayed pressure loss, inspect the electrical system and capacitor before replacing hydraulic valves.",
    badFix: "Replace pressure control valve.",
    badOutcome:
      "Pressure temporarily improved but the same failure returned shortly afterward.",
  },
  {
    key: "intake",
    title: "Persistent low water flow",
    symptoms:
      "Pump runs continuously but output flow remains consistently below normal operating range.",
    rootCause: "Blocked intake filter",
    goodFix: "Inspect and clean the intake screen and filter assembly.",
    goodOutcome:
      "Normal flow was restored and remained stable after cleaning the intake assembly.",
    lesson:
      "Persistent low flow without intermittent shutdown should trigger intake and filtration inspection before electrical component replacement.",
    badFix: "Replace motor capacitor.",
    badOutcome:
      "Electrical repair produced no meaningful improvement in water flow.",
  },
  {
    key: "seal",
    title: "Leakage with unstable pressure",
    symptoms:
      "Visible leakage is present around the pump housing while discharge pressure fluctuates during operation.",
    rootCause: "Mechanical seal failure",
    goodFix: "Replace mechanical seal and inspect shaft sealing surfaces.",
    goodOutcome:
      "Leakage stopped and discharge pressure stabilized after seal replacement.",
    lesson:
      "Leakage combined with pressure fluctuation strongly indicates mechanical sealing problems and should be inspected before hydraulic tuning.",
    badFix: "Adjust pressure regulator.",
    badOutcome: "Pressure changed temporarily but leakage persisted.",
  },
  {
    key: "voltage",
    title: "Intermittent unexpected shutdown",
    symptoms:
      "Pump shuts down unpredictably and restarts after a short interval without consistent mechanical symptoms.",
    rootCause: "Unstable electrical supply voltage",
    goodFix:
      "Measure supply voltage under load, inspect electrical connections, and stabilize the incoming power supply.",
    goodOutcome:
      "Unexpected shutdowns stopped after the electrical supply condition was corrected.",
    lesson:
      "Random shutdown without a consistent mechanical signature should trigger supply-voltage inspection before replacing pump components.",
    badFix: "Replace pump impeller.",
    badOutcome:
      "Mechanical replacement did not stop the intermittent shutdowns.",
  },
];

function assetCode(index) {
  return `TZ-PUMP-${String(index + 1).padStart(3, "0")}`;
}

function isoDaysAgo(days, hour = 8) {
  const now = new Date("2026-08-07T12:00:00.000Z");
  now.setUTCDate(now.getUTCDate() - days);
  now.setUTCHours(hour, 0, 0, 0);
  return now.toISOString();
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const memoryCandidates = [];

async function main() {
  await client.connect();

  await client.query("BEGIN");

  try {
    await client.query(
      `
        INSERT INTO organizations (id, name)
        VALUES ($1, $2)
        ON CONFLICT (id) DO NOTHING
      `,
      [ORG_ID, "FIELDfix Demo Water Operations"],
    );

    await client.query(
      `
    INSERT INTO users (
      id,
      org_id,
      cognito_sub,
      name,
      role
    )
    VALUES
      ($1, $3, $4, 'Asha Mrema', 'technician'),
      ($2, $3, $5, 'Daniel Mushi', 'supervisor')
    ON CONFLICT (id) DO NOTHING
  `,
      [
        TECHNICIAN_ID,
        SUPERVISOR_ID,
        ORG_ID,
        "fieldfix-demo-technician",
        "fieldfix-demo-supervisor",
      ],
    );

    for (const site of sites) {
      await client.query(
        `
          INSERT INTO sites (
            id,
            org_id,
            name,
            region
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING
        `,
        [site.id, ORG_ID, site.name, site.region],
      );
    }

    for (let assetIndex = 0; assetIndex < 60; assetIndex++) {
      const assetId = deterministicUuid(`asset-${assetIndex}`);
      const site = sites[assetIndex % sites.length];

      const models = ["CP-250", "CP-300", "WP-180"];
      const model = models[assetIndex % models.length];

      await client.query(
        `
          INSERT INTO assets (
            id,
            org_id,
            site_id,
            asset_code,
            asset_type,
            manufacturer,
            model,
            installed_at,
            criticality,
            status,
            metadata
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'centrifugal_pump',
            'DemoPump Industries',
            $5,
            $6,
            $7,
            'active',
            $8::JSONB
          )
          ON CONFLICT (id) DO NOTHING
        `,
        [
          assetId,
          ORG_ID,
          site.id,
          assetCode(assetIndex),
          model,
          `202${2 + (assetIndex % 4)}-0${1 + (assetIndex % 8)}-15`,
          assetIndex % 7 === 0 ? "high" : "medium",
          JSON.stringify({
            synthetic: true,
            nominal_voltage: 230,
            power_kw: 7.5 + (assetIndex % 4) * 2.5,
          }),
        ],
      );

      for (let incidentIndex = 0; incidentIndex < 6; incidentIndex++) {
        const incidentId = deterministicUuid(
          `asset-${assetIndex}-incident-${incidentIndex}`,
        );

        const actionId = deterministicUuid(
          `asset-${assetIndex}-incident-${incidentIndex}-action`,
        );

        const outcomeId = deterministicUuid(
          `asset-${assetIndex}-incident-${incidentIndex}-outcome`,
        );

        const patternIndex = (assetIndex + incidentIndex) % patterns.length;

        const pattern = patterns[patternIndex];

        // Make repair success/failure independent from failure-pattern selection.
        // For the 240 memory candidates, each pattern gets:
        // 45 successful repairs + 15 failed/recurring repairs.
        const useSuccessfulFix =
          (assetIndex * 17 +
            incidentIndex * 29 +
            Math.floor(assetIndex / 5) * 7) %
            4 !==
          0;

        const startedAt = isoDaysAgo(30 + assetIndex * 4 + incidentIndex * 17);

        const resolvedAt = isoDaysAgo(
          29 + assetIndex * 4 + incidentIndex * 17,
          14,
        );

        const fix = useSuccessfulFix ? pattern.goodFix : pattern.badFix;

        const outcome = useSuccessfulFix
          ? pattern.goodOutcome
          : pattern.badOutcome;

        const recurrence = !useSuccessfulFix;

        await client.query(
          `
            INSERT INTO incidents (
              id,
              org_id,
              asset_id,
              reported_by,
              title,
              symptom_text,
              severity,
              status,
              started_at,
              resolved_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              'resolved',
              $8,
              $9
            )
            ON CONFLICT (id) DO NOTHING
          `,
          [
            incidentId,
            ORG_ID,
            assetId,
            TECHNICIAN_ID,
            pattern.title,
            pattern.symptoms,
            incidentIndex % 5 === 0 ? "high" : "medium",
            startedAt,
            resolvedAt,
          ],
        );

        await client.query(
          `
            INSERT INTO repair_actions (
              id,
              incident_id,
              org_id,
              sequence_no,
              action_type,
              description,
              proposed_by,
              approval_status,
              approved_by,
              performed_at,
              result_text
            )
            VALUES (
              $1,
              $2,
              $3,
              1,
              'corrective_repair',
              $4,
              'technician',
              'approved',
              $5,
              $6,
              $7
            )
            ON CONFLICT (id) DO NOTHING
          `,
          [
            actionId,
            incidentId,
            ORG_ID,
            fix,
            SUPERVISOR_ID,
            resolvedAt,
            outcome,
          ],
        );

        await client.query(
          `
            INSERT INTO outcomes (
              id,
              incident_id,
              org_id,
              resolution_status,
              downtime_minutes,
              recurrence_detected,
              days_to_recurrence,
              outcome_text,
              verified_by,
              verified_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10
            )
            ON CONFLICT (id) DO NOTHING
          `,
          [
            outcomeId,
            incidentId,
            ORG_ID,
            useSuccessfulFix ? "successful" : "partial",
            45 + ((assetIndex + incidentIndex) % 8) * 15,
            recurrence,
            recurrence ? 7 + ((assetIndex + incidentIndex) % 24) : null,
            outcome,
            SUPERVISOR_ID,
            resolvedAt,
          ],
        );

        // Four verified memory candidates per asset = 240 total.
        if (incidentIndex < 4) {
          const canonicalText = [
            `Asset type: Centrifugal water pump ${model}.`,
            `Symptoms: ${pattern.symptoms}`,
            `Root cause: ${pattern.rootCause}.`,
            `Repair action: ${fix}`,
            `Outcome: ${outcome}`,
            recurrence
              ? `Recurrence: Failure returned after ${
                  7 + ((assetIndex + incidentIndex) % 24)
                } days.`
              : "Recurrence: No recurrence observed during the verification period.",
            `Lesson: ${pattern.lesson}`,
          ].join("\n");

          memoryCandidates.push({
            id: deterministicUuid(
              `asset-${assetIndex}-incident-${incidentIndex}-memory`,
            ),
            org_id: ORG_ID,
            asset_id: assetId,
            incident_id: incidentId,
            asset_type: "centrifugal_pump",
            asset_model: model,
            title: pattern.title,
            symptom_summary: pattern.symptoms,
            root_cause: pattern.rootCause,
            fix_summary: fix,
            outcome_summary: outcome,
            lesson: pattern.lesson,
            canonical_text: canonicalText,
            quality_score: useSuccessfulFix ? 0.95 : 0.82,
            verified: true,
          });
        }
      }
    }

    await client.query("COMMIT");

    await fs.writeFile(
      "database/seeds/memory-candidates.json",
      JSON.stringify(memoryCandidates, null, 2),
    );

    console.log("FIELDfix structured demo dataset seeded.");
    console.log(`Organization: 1`);
    console.log(`Sites: ${sites.length}`);
    console.log(`Assets: 60`);
    console.log(`Incidents: 360`);
    console.log(`Memory candidates: ${memoryCandidates.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("FIELDfix seed failed:");
  console.error(error);
  process.exitCode = 1;
});
