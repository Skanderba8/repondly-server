npm run build && pm2 restart admin-internal
tree -I "node_modules|.next" > structure.txt


Increment CACHE_VERSION in /dashboard-app/public/sw.js (e.g., v4 → v5)
Increment version in /dashboard-app/public/manifest.json (e.g., 1.0.4 → 1.0.5)
Deploy