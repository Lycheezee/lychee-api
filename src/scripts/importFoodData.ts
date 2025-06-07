import csv from "csv-parser";
import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import FoodEntry, { IFoodEntry } from "../models/foodEntry";

// Load environment variables
dotenv.config();

interface CSVRow {
  Date: string;
  User_ID: string;
  Food_Item: string;
  Category: string;
  "Calories (kcal)": string;
  "Protein (g)": string;
  "Carbohydrates (g)": string;
  "Fat (g)": string;
  "Fiber (g)": string;
  "Sugars (g)": string;
  "Sodium (mg)": string;
  "Cholesterol (mg)": string;
  Meal_Type: string;
  "Water_Intake (ml)": string;
}

interface ProcessedFoodEntry {
  name: string;
  category: string;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugars: number;
    sodium: number;
    cholesterol: number;
    waterIntake: number;
  };
  mealType: string;
}

class FoodDataImporter {
  private csvFilePath: string;
  private outputCsvPath: string;

  constructor(csvFilePath: string) {
    this.csvFilePath = csvFilePath;
    this.outputCsvPath = csvFilePath.replace(".csv", "_with_ids.csv");
  }

  async connectToDatabase(): Promise<void> {
    try {
      const mongoUri = `${process.env.MONGO_URI}${process.env.DATABASE_NAME}`;
      await mongoose.connect(mongoUri);
      console.log("✅ Connected to MongoDB successfully");
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      throw error;
    }
  }

  async disconnectFromDatabase(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log("🔌 Disconnected from MongoDB");
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
    }
  }
  parseCSVRow(row: CSVRow): ProcessedFoodEntry {
    return {
      name: row.Food_Item.trim(),
      category: row.Category.trim(),
      nutrition: {
        calories: parseFloat(row["Calories (kcal)"]),
        protein: parseFloat(row["Protein (g)"]),
        carbohydrates: parseFloat(row["Carbohydrates (g)"]),
        fat: parseFloat(row["Fat (g)"]),
        fiber: parseFloat(row["Fiber (g)"]),
        sugars: parseFloat(row["Sugars (g)"]),
        sodium: parseFloat(row["Sodium (mg)"]),
        cholesterol: parseFloat(row["Cholesterol (mg)"]),
        waterIntake: parseFloat(row["Water_Intake (ml)"]),
      },
      mealType: row.Meal_Type.trim(),
    };
  }

  async readCSVFile(): Promise<ProcessedFoodEntry[]> {
    return new Promise((resolve, reject) => {
      const results: ProcessedFoodEntry[] = [];

      fs.createReadStream(this.csvFilePath)
        .pipe(csv())
        .on("data", (row: CSVRow) => {
          try {
            const processedRow = this.parseCSVRow(row);
            results.push(processedRow);
          } catch (error) {
            console.warn(
              `⚠️ Skipping invalid row: ${JSON.stringify(
                row
              )} - Error: ${error}`
            );
          }
        })
        .on("end", () => {
          console.log(`📄 Successfully read ${results.length} rows from CSV`);
          resolve(results);
        })
        .on("error", (error) => {
          console.error("❌ Error reading CSV file:", error);
          reject(error);
        });
    });
  }

  async clearExistingData(): Promise<void> {
    try {
      const deleteResult = await FoodEntry.deleteMany({});
      console.log(
        `🗑️ Cleared ${deleteResult.deletedCount} existing food entries`
      );
    } catch (error) {
      console.error("❌ Error clearing existing data:", error);
      throw error;
    }
  }

  async importDataToMongoDB(data: ProcessedFoodEntry[]): Promise<IFoodEntry[]> {
    try {
      console.log("📥 Starting bulk import to MongoDB...");

      // Insert data in batches to avoid memory issues
      const batchSize = 1000;
      const insertedEntries: IFoodEntry[] = [];

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const insertedBatch = await FoodEntry.insertMany(batch);
        insertedEntries.push(...insertedBatch);

        console.log(
          `📊 Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            data.length / batchSize
          )} (${insertedBatch.length} entries)`
        );
      }

      console.log(
        `✅ Successfully imported ${insertedEntries.length} food entries to MongoDB`
      );
      return insertedEntries;
    } catch (error) {
      console.error("❌ Error importing data to MongoDB:", error);
      throw error;
    }
  }

  async createCSVWithIds(
    originalData: ProcessedFoodEntry[],
    insertedEntries: IFoodEntry[]
  ): Promise<void> {
    try {
      // Create header with _id column
      const header =
        "_id,Food_Item,Category,Calories (kcal),Protein (g),Carbohydrates (g),Fat (g),Fiber (g),Sugars (g),Sodium (mg),Cholesterol (mg),Meal_Type,Water_Intake (ml)\n";

      // Create CSV content with MongoDB IDs
      let csvContent = header;

      for (let i = 0; i < insertedEntries.length; i++) {
        const entry = insertedEntries[i];
        const originalEntry = originalData[i];

        const csvRow = [
          entry._id.toString(),
          `"${originalEntry.name}"`, // Quote strings that might contain commas
          `"${originalEntry.category}"`,
          originalEntry.nutrition.calories,
          originalEntry.nutrition.protein,
          originalEntry.nutrition.carbohydrates,
          originalEntry.nutrition.fat,
          originalEntry.nutrition.fiber,
          originalEntry.nutrition.sugars,
          originalEntry.nutrition.sodium,
          originalEntry.nutrition.cholesterol,
          `"${originalEntry.mealType}"`,
          originalEntry.nutrition.waterIntake,
        ].join(",");

        csvContent += csvRow + "\n";
      }

      // Write to new file
      await fs.promises.writeFile(this.outputCsvPath, csvContent, "utf8");
      console.log(`📄 Created new CSV file with IDs: ${this.outputCsvPath}`);
    } catch (error) {
      console.error("❌ Error creating CSV with IDs:", error);
      throw error;
    }
  }

  async generateStatistics(data: ProcessedFoodEntry[]): Promise<void> {
    console.log("\n📊 IMPORT STATISTICS:");
    console.log("=".repeat(50));

    // Basic stats
    console.log(`Total entries: ${data.length}`);

    // Categories
    const categories = [...new Set(data.map((entry) => entry.category))];
    console.log(`Food categories: ${categories.length}`);
    categories.forEach((category) => {
      const count = data.filter((entry) => entry.category === category).length;
      console.log(`  - ${category}: ${count} entries`);
    }); // Meal types
    const mealTypes = [...new Set(data.map((entry) => entry.mealType))];
    console.log(`Meal types: ${mealTypes.length}`);
    mealTypes.forEach((mealType) => {
      const count = data.filter((entry) => entry.mealType === mealType).length;
      console.log(`  - ${mealType}: ${count} entries`);
    });

    // Unique food items
    const uniqueFoodItems = [...new Set(data.map((entry) => entry.name))];
    console.log(`Unique food items: ${uniqueFoodItems.length}`);

    console.log("=".repeat(50));
  }

  async run(): Promise<void> {
    try {
      console.log("🚀 Starting Food Data Import Process");
      console.log("=".repeat(50));

      // Check if CSV file exists
      if (!fs.existsSync(this.csvFilePath)) {
        throw new Error(`CSV file not found: ${this.csvFilePath}`);
      }

      // Connect to database
      await this.connectToDatabase();

      // Read CSV data
      const data = await this.readCSVFile();

      // Generate statistics
      await this.generateStatistics(data);

      // Clear existing data (optional - comment out if you want to append)
      await this.clearExistingData();

      // Import to MongoDB
      const insertedEntries = await this.importDataToMongoDB(data);

      // Create new CSV with IDs
      await this.createCSVWithIds(data, insertedEntries);

      console.log("\n✅ Import process completed successfully!");
    } catch (error) {
      console.error("❌ Import process failed:", error);
      throw error;
    } finally {
      await this.disconnectFromDatabase();
    }
  }
}

// Main execution
async function main() {
  // Update this path to point to your CSV file
  const csvFilePath = path.join(
    __dirname,
    "../../daily_food_nutrition_dataset.csv"
  );

  const importer = new FoodDataImporter(csvFilePath);

  try {
    await importer.run();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to import data:", error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

export default FoodDataImporter;
