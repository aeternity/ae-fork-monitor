import { updateChainEnds } from './modules/chainWalker';
import { checkForForks } from './modules/detector';
import { alertForForks } from './modules/alert';
import './modules/api';

const waitTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {}, 1000000000);

async function main() {
  await updateChainEnds();
  const forks = await checkForForks();
  await alertForForks(forks);
  // start interval after first sync
  if (waitTimeout) clearTimeout(waitTimeout);
  setTimeout(() => main(), 180 * 1000);
}

main();
