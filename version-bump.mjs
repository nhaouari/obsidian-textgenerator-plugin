import { readFileSync, writeFileSync } from "fs";
import { execSync } from "node:child_process";
import { exit } from "process";
const packageJSON = JSON.parse(readFileSync("package.json", "utf8"));

const targetVersion = packageJSON.version;
const dryRun = !process.argv[2] || process.argv[2] !== "--go";

try {
  // check if local repository contains changes
  const result = execSync(`git status --porcelain`, { cwd: "." });
  if (result.length !== 0) {
    console.log(`Local repository contains changes`);
    console.log("Please commit changes first");
    exit(-1);
  }
  // check if tag already exists
  const result2 = execSync(
    `git fetch origin 'refs/tags/*:refs/tags/*' && git tag -l ${targetVersion}`,
    { cwd: "." }
  );
  if (result2.length !== 0) {
    console.log(`Tag ${targetVersion} already exists`);
    console.log("Please bump version in package.json first");
    exit(-1);
  }

  // load manifest and check beta version
  const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
  const obsidian = packageJSON.obsidian;
  const isBeta = targetVersion.endsWith("beta");

  console.log(`new version : ${targetVersion}`);
  console.log(`with obsidian compatibility : ${obsidian.minAppVersion}`);

  console.log("\n-------------------------------------------------");
  console.log("Will update :");
  console.log(` - manifest-beta.json`);
  if (!isBeta) {
    console.log(` - manifest.json`);
    console.log(` - versions.json`);
  }
  console.log(`It will commit, push, create tag ${targetVersion} and push tags`);


  console.log("\n-------------------------------------------------");
  if (dryRun) {
    console.log("/!\\ DRY RUN /!\\");
    console.log("to apply versioning, create new tag and push all to origin");
    console.log("run : npm run version:go");
  } else {
    // always update manifest-beta.json with last version for BRAT users, otherwise they will stay on beta
    manifest.version = targetVersion;
    writeFileSync("manifest-beta.json", JSON.stringify(manifest, null, "\t"));
    console.log("writing manifest-beta.json");

    if (!isBeta) {
      // bump version to target version
      manifest.version = targetVersion;
      writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
      console.log("writing manifest.json");

      // update versions.json with target version and minAppVersion from manifest
      let versions = JSON.parse(readFileSync("versions.json", "utf8"));
      versions[targetVersion] = manifest.minAppVersion;
      writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
      console.log("writing versions.json");
    }

    // commit, create tag and push to origin (that will trigger github release action)
    execSync(
      `git add manifest.json manifest-beta.json versions.json && git commit -m "prepare release ${targetVersion}"`, // && git push origin ${targetVersion}`,
      {
        cwd: ".",
        stdio: "inherit",
      }
    );

    execSync(
      `git push`,
      {
        cwd: ".",
        stdio: "inherit",
      }
    );


    execSync(
      `git tag ${targetVersion}`,
      {
        cwd: ".",
        stdio: "inherit",
      }
    );

    execSync(
      `git push --tags`,
      {
        cwd: ".",
        stdio: "inherit",
      }
    );
    console.log("DONE !");
  }
} catch (e) {
  console.log("Unexpected error, please review and try again");
  console.log(e);
}
