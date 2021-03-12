// determine length
// do alerts
import { Sequelize, Op } from 'sequelize';
import { sequelize, Block } from '../models';
import { forwardQuery } from '../queries/chainWalking';

async function forwardSearch(startHash: string) {
  return sequelize.query(forwardQuery(startHash), {
    model: Block,
    mapToModel: true, // pass true here if you have any mapped fields
  });
}

export async function checkForForks() {
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
    // find max height
    const forkEndHeight = Math.max(...fork.map(block => block.height));
    const forkEndBlock = fork.find(block => block.height === forkEndHeight);
    return {
      forkLength: forkEndHeight - startBlock.height,
      forkStartHash: startBlock,
      forkEndHash: forkEndBlock,
    };
  }));
}
