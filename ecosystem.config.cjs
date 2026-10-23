module.exports = {
  apps: [
    {
      name: 'computer-shop-ssr',
      script: 'dist/computer-shop/server/server.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '0.0.0.0',
        NG_ALLOWED_HOSTS: 'computer-shop.duckdns.org,localhost,127.0.0.1'
      }
    }
  ]
};
