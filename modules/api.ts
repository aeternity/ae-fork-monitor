import express, { Request, Response } from 'express';
import exphbs from 'express-handlebars';
import { checkForForks } from './detector';
import { Block } from '../models';

const app = express();
const port = 3000;

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.get('/', async (req: Request, res: Response) => {
  const forks = await checkForForks();
  const height = await Block.max('height');
  const newestBlocks = await Block.findAll({ where: { height }, raw: true });
  res.render('home', {
    height,
    forks,
    newestBlocks,
    topBlockLength: newestBlocks.length,
    forkLength: forks.length,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
