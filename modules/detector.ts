import { Sequelize, Op } from 'sequelize';
import { Block } from '../models';
import { Block as BlockType } from '../models/block';

export interface Fork {
  forkLength: number,
  forkStart: BlockType,
  forkEnd: BlockType,
}

async function forwardSearch(startHash: string) {
  const fork: BlockType[] = [];
  let keepSearching = true;
  let nextHash = startHash;
  const startBlock = await Block.findOne({ where: { keyHash: startHash }, raw: true }) as BlockType;
  fork.push(startBlock);

  // all future blocks
  const allFutureBlocks = await Block.findAll({
    where: {
      height: {
        [Op.gte]: startBlock.height,
      },
    },
    raw: true,
  });

  const lastKeyHashMapping = allFutureBlocks.reduce((acc:Record<string, string[]>, curr) => {
    if (acc[curr.lastKeyHash]) {
      acc[curr.lastKeyHash].push(curr.keyHash);
    } else {
      acc[curr.lastKeyHash] = [curr.keyHash];
    }
    return acc;
  }, {});
  const keyHashBlockMap = allFutureBlocks.reduce((acc: Record<string, BlockType>, curr) => {
    acc[curr.keyHash] = curr;
    return acc;
  }, {});

  while (keepSearching) {
    const nextHashes = lastKeyHashMapping[nextHash];
    if (!nextHashes) {
      // END OF FORK
      keepSearching = false;
      break;
    }
    if (nextHashes.length === 1) {
      // ONE NEXT BLOCK
      fork.push(keyHashBlockMap[nextHash]);
      [nextHash] = nextHashes;
    } else {
      // MORE THAN ONE NEXT BLOCK
      const furtherForks: BlockType[] = await Promise
        .all(nextHashes.map(forkStartHash => forwardSearch(forkStartHash)))
        .then(forks => forks.flat());

      return [...fork, ...furtherForks];
    }
  }
  return fork;
}

export async function checkForForks(): Promise<Fork[]> {
  // here it can be assumed that the tracing is finished

  // find the hashes of all blocks that have the two next blocks
  const forkBeginningHashes = await Block.findAll({
    attributes: ['lastKeyHash'],
    group: ['lastKeyHash'],
    having: Sequelize.literal('count(*) > 1'),
  });

  // get all the fork beginning blocks (the 1. block of the fork)
  const height: number = await Block.max('height');
  const forkBeginnings = await Block.findAll({
    where: {
      lastKeyHash: { [Op.in]: forkBeginningHashes.map(({ lastKeyHash }) => lastKeyHash).filter(h => !!h) },
      // only consider the last 1k blocks
      height: {
        [Op.gte]: height - 1000,
      },
    },
    raw: true,
  });

  return Promise.all(forkBeginnings.map(async startBlock => {
    // forward search the fork
    const fork = await forwardSearch(startBlock.keyHash);
    // forks are sorted by height, just take the last block
    fork.sort((b1, b2) => b1.height - b2.height);
    const forkEndBlock = fork[fork.length - 1];
    return {
      forkLength: forkEndBlock.height - startBlock.height + 1, // start block is the first block in the fork, so +1 for full fork length
      forkStart: startBlock,
      forkEnd: forkEndBlock,
    };
  }));
}
