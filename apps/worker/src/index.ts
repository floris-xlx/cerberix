import { createServer } from './server';
import { startDeliveryProcessor } from './processor';

const port = process.env.PORT ? Number(process.env.PORT) : 4001;

const app = createServer();
app.listen(port, () => {
  console.log(`worker listening on :${port}`);
});

startDeliveryProcessor();


