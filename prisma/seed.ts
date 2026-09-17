import { PrismaClient } from "@prisma/client";
import { SEED_PROBLEMS } from "./seedData";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database seed...");

  for (const prob of SEED_PROBLEMS) {
    const { approaches, ...problemData } = prob;

    const problem = await prisma.problem.upsert({
      where: { slug: prob.slug },
      update: {
        title: problemData.title,
        difficulty: problemData.difficulty,
        topic: problemData.topic,
        description: problemData.description,
        externalLinks: problemData.externalLinks,
        hints: problemData.hints,
        order: problemData.order,
      },
      create: {
        slug: problemData.slug,
        title: problemData.title,
        difficulty: problemData.difficulty,
        topic: problemData.topic,
        description: problemData.description,
        externalLinks: problemData.externalLinks,
        hints: problemData.hints,
        order: problemData.order,
      },
    });

    console.log(`Upserted problem: ${problem.title}`);

    // Recreate approaches for deterministic order
    await prisma.solutionApproach.deleteMany({
      where: { problemId: problem.id },
    });

    for (const approach of approaches) {
      await prisma.solutionApproach.create({
        data: {
          problemId: problem.id,
          approachName: approach.approachName,
          order: approach.order,
          intuition: approach.intuition,
          timeComplexity: approach.timeComplexity,
          spaceComplexity: approach.spaceComplexity,
          pseudoCode: approach.pseudoCode,
          codeSnippets: approach.codeSnippets,
        },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
