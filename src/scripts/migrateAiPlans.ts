import DietPlanModel from "../models/dietPlan";
import { EAiModel } from "../constants/model.enum";

/**
 * Migration script to convert single aiPlan to aiPlans array
 * Run this script once to migrate existing data
 */
export async function migrateAiPlansToArray() {
  console.log("Starting AI plans migration...");

  try {
    // Find all diet plans that have the old aiPlan structure
    const dietPlansWithOldStructure = await DietPlanModel.find({
      aiPlan: { $exists: true },
    });

    console.log(
      `Found ${dietPlansWithOldStructure.length} diet plans to migrate`
    );

    let migrated = 0;
    let errors = 0;

    for (const dietPlan of dietPlansWithOldStructure) {
      try {
        // Extract the old aiPlan data
        const oldAiPlan = (dietPlan as any).aiPlan;

        if (oldAiPlan && oldAiPlan.model && oldAiPlan.plan) {
          // Create new aiPlans array with the old data
          const newAiPlans = [
            {
              model: oldAiPlan.model,
              plan: oldAiPlan.plan,
              createdAt: dietPlan.createdAt || new Date(),
            },
          ];

          // Update the document
          await DietPlanModel.findByIdAndUpdate(
            dietPlan._id,
            {
              $set: { aiPlans: newAiPlans },
              $unset: { aiPlan: 1 },
            },
            { new: true }
          );

          migrated++;
          console.log(
            `Migrated diet plan ${dietPlan._id} (${oldAiPlan.model})`
          );
        } else {
          console.warn(
            `Diet plan ${dietPlan._id} has invalid aiPlan structure`
          );
        }
      } catch (error) {
        console.error(`Error migrating diet plan ${dietPlan._id}:`, error);
        errors++;
      }
    }

    console.log(`Migration completed: ${migrated} migrated, ${errors} errors`);

    return {
      total: dietPlansWithOldStructure.length,
      migrated,
      errors,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

/**
 * Rollback migration - convert aiPlans array back to single aiPlan
 * Use this if you need to rollback the changes
 */
export async function rollbackAiPlansToSingle() {
  console.log("Starting AI plans rollback...");

  try {
    // Find all diet plans that have the new aiPlans structure
    const dietPlansWithNewStructure = await DietPlanModel.find({
      aiPlans: { $exists: true, $ne: [] },
    });

    console.log(
      `Found ${dietPlansWithNewStructure.length} diet plans to rollback`
    );

    let rolledBack = 0;
    let errors = 0;

    for (const dietPlan of dietPlansWithNewStructure) {
      try {
        // Get the aiPlans array
        const aiPlans = (dietPlan as any).aiPlans;

        if (aiPlans && aiPlans.length > 0) {
          // Use the first AI plan or the one matching current type
          const currentType = dietPlan.type || EAiModel.LYCHEE;
          const targetPlan =
            aiPlans.find((plan: any) => plan.model === currentType) ||
            aiPlans[0];

          // Create old aiPlan structure
          const oldAiPlan = {
            model: targetPlan.model,
            plan: targetPlan.plan,
          };

          // Update the document
          await DietPlanModel.findByIdAndUpdate(
            dietPlan._id,
            {
              $set: { aiPlan: oldAiPlan },
              $unset: { aiPlans: 1 },
            },
            { new: true }
          );

          rolledBack++;
          console.log(
            `Rolled back diet plan ${dietPlan._id} (${targetPlan.model})`
          );
        }
      } catch (error) {
        console.error(`Error rolling back diet plan ${dietPlan._id}:`, error);
        errors++;
      }
    }

    console.log(
      `Rollback completed: ${rolledBack} rolled back, ${errors} errors`
    );

    return {
      total: dietPlansWithNewStructure.length,
      rolledBack,
      errors,
    };
  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  }
}

/**
 * Check migration status
 */
export async function checkMigrationStatus() {
  try {
    const oldStructureCount = await DietPlanModel.countDocuments({
      aiPlan: { $exists: true },
    });

    const newStructureCount = await DietPlanModel.countDocuments({
      aiPlans: { $exists: true },
    });

    const totalCount = await DietPlanModel.countDocuments();

    console.log("Migration Status:");
    console.log(`- Total diet plans: ${totalCount}`);
    console.log(`- Old structure (aiPlan): ${oldStructureCount}`);
    console.log(`- New structure (aiPlans): ${newStructureCount}`);
    console.log(
      `- Migration complete: ${oldStructureCount === 0 ? "Yes" : "No"}`
    );

    return {
      total: totalCount,
      oldStructure: oldStructureCount,
      newStructure: newStructureCount,
      migrationComplete: oldStructureCount === 0,
    };
  } catch (error) {
    console.error("Error checking migration status:", error);
    throw error;
  }
}

// CLI interface for running migrations
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "migrate":
      migrateAiPlansToArray()
        .then((result) => {
          console.log("Migration result:", result);
          process.exit(0);
        })
        .catch((error) => {
          console.error("Migration failed:", error);
          process.exit(1);
        });
      break;

    case "rollback":
      rollbackAiPlansToSingle()
        .then((result) => {
          console.log("Rollback result:", result);
          process.exit(0);
        })
        .catch((error) => {
          console.error("Rollback failed:", error);
          process.exit(1);
        });
      break;

    case "status":
      checkMigrationStatus()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("Status check failed:", error);
          process.exit(1);
        });
      break;

    default:
      console.log("Usage: npm run migrate-ai-plans [migrate|rollback|status]");
      console.log("");
      console.log("Commands:");
      console.log("  migrate  - Migrate from aiPlan to aiPlans array");
      console.log("  rollback - Rollback from aiPlans array to aiPlan");
      console.log("  status   - Check migration status");
      process.exit(1);
  }
}
