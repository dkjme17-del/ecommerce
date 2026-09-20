module.exports = {
  apps: [
    {
      name: 'marketplace-api',
      cwd: './backend',
      script: 'src/server.js',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 1000,
      max_memory_restart: '300M',
    },
    {
      name: 'marketplace-web',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 1000,
      max_memory_restart: '600M',
    },
  ],
};