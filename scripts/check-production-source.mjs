// Run during every build, including Vercel Git deployments and local CLI deploys.
if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_GIT_COMMIT_REF !== "main") {
  console.error("Production must build from the Git-connected main branch. Merge tested changes into main before deploying; promoting isolated feature builds loses unrelated features.");
  process.exit(1);
}
