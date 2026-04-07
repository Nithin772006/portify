import app, { initializeApp } from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  await initializeApp();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });
}

void start();
