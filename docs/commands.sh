npm run build && pm2 restart admin
tree -I "node_modules|.next" > structure.txt


Increment CACHE_VERSION in /app/public/sw.js (e.g., v4 → v5)
Increment version in /app/public/manifest.json (e.g., 1.0.4 → 1.0.5)
Deploy

sudo systemctl start opencode
sudo systemctl stop opencode
sudo systemctl restart opencodesudo systemctl stop opencode
sudo systemctl disable opencode

# ── Database ────────────────────────────────────────────
# Run after any schema change to regenerate all Prisma clients
db:generate:all() {
  echo "Generating Prisma client for admin..."
  (cd admin && npx prisma generate)
  echo "Generating Prisma client for app..."
  (cd app && npx prisma generate)
  echo "Generating Prisma client for bot..."
  (cd bot && npx prisma generate)
  echo "Done. All clients up to date."
}

# Run migrations (always from admin only)
db:migrate() {
  echo "Running migrations from admin..."
  (cd admin && npx prisma migrate dev)
}