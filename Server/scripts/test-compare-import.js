const { importCompareListing } = require("../src/lib/compareImport");

async function run() {
  const cases = [
    {
      cat: "transport",
      url: "https://somon.tj/adv/16778812_bmw-x5-2025/",
    },
    {
      cat: "realestate",
      url: "https://somon.tj/adv/16834918_2-komn-kvartira-17-etazh-77-m2-i-somoni-prospekt-rudaki/",
    },
  ];

  for (const item of cases) {
    const result = await importCompareListing(item.url, item.cat);
    console.log("\n===", item.cat, "===");
    console.log(JSON.stringify(result, null, 2));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
