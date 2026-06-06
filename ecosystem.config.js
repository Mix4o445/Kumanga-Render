// PM2 process config — keeps the Next.js server running and restarts on crash/reboot.
module.exports = {
  apps: [
    {
      name: "manga",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/manga",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
