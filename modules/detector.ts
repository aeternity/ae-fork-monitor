import { Sequelize, Op } from 'sequelize';
import { sequelize, Block } from '../models';
import { Block as BlockType } from '../models/block';
import { forwardQuery } from '../queries/followChain';

export interface Fork {
  forkLength: number,
  forkStart: BlockType,
  forkEnd: BlockType,
}

async function forwardSearch(startHash: string) {
  return sequelize.query(forwardQuery(startHash), {
    model: Block,
    mapToModel: true, // pass true here if you have any mapped fields
  });
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
  const forkBeginnings = await Block.findAll({
    where: {
      lastKeyHash: { [Op.in]: forkBeginningHashes.map(({ lastKeyHash }) => lastKeyHash).filter(h => !!h) },
    },
  });

  // TODO business logic

  return Promise.all(forkBeginnings.map(async startBlock => {
    const fork = await forwardSearch(startBlock.keyHash);
    // forks are sorted by height, just take the last block
    const forkEndBlock = fork[fork.length - 1];
    return {
      forkLength: forkEndBlock.height - startBlock.height + 1, // start block is the first block in the fork, so +1 for full fork length
      forkStart: startBlock,
      forkEnd: forkEndBlock,
    };
  }));
}
