import { updateChainEnds } from './modules/chainWalker';

let intervalId: ReturnType<typeof setInterval>;

async function main() {
  await updateChainEnds();
  // start interval after first sync
  if (!intervalId) {
    clearTimeout(waitTimeout);
    intervalId = setInterval(() => main(), 180 * 1000);
  }
}

main();
const waitTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {}, 1000000000);
// check for blocks, that have no next block referencing back --> expensive but can be done on chain ends & new blocks only
// follow the chain until a block is found, that has two next blocks
