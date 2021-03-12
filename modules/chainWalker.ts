import axios from 'axios';
// @ts-ignore
import { Block } from '../models';

const nodes = [
  'https://mainnet.aeternity.io/v2',
];

interface NodeBlock {
  height: number,
  hash: string,
  // eslint-disable-next-line camelcase
  prev_key_hash: string,
  time: number
}

function prepForDB(block: NodeBlock) {
  return {
    height: block.height,
    keyHash: block.hash,
    timestamp: new Date(block.time),
  };
}

async function backTrack(nodeUrl: string, chainEndBlock: NodeBlock) {
  try {
    await insertBlock(chainEndBlock);
  } catch (e) {
    if (!e.original?.message.includes('duplicate key value violates unique constraint')) {
      console.error(e.message);
    }
  }
  await backTraceOnNode(nodeUrl, chainEndBlock);
}

async function resolveBlockOnNode(nodeUrl: string, keyHash: string): Promise<NodeBlock | null> {
  return axios.get(`${nodeUrl}/key-blocks/hash/${keyHash}`)
    .then(({ data } : {data: NodeBlock}) => data)
    .catch((e: Error) => {
      console.error(e.message);
      return null;
    });
}
async function resolveBlock(nodeUrl: string, keyHash: string): Promise<NodeBlock | null> {
  // if height is known, try to work with the middleware
  let block = await resolveBlockOnNode(nodeUrl, keyHash);
  if (block === null) {
    // eslint-disable-next-line no-restricted-syntax
    for (const otherNodeUrl of nodes) {
      if (nodeUrl !== otherNodeUrl) block = await resolveBlockOnNode(otherNodeUrl, keyHash);
      if (block !== null) return block;
    }
  }
  return block;
}

async function isBlockInDB(hash: string) {
  return Boolean(await Block.findOne({ where: { keyHash: hash }, raw: true }));
}

async function insertBlock(block:NodeBlock) {
  process.stdout.write('.');
  return Block.create(prepForDB(block));
}
async function insertReference(topBlock:NodeBlock) {
  return Block.update({ lastKeyHash: topBlock.prev_key_hash }, { where: { keyHash: topBlock.hash } });
}

async function backTraceOnNode(nodeUrl: string, topKeyBlock: NodeBlock) {
  // check if block is already in db
  let keepSearching = !(await isBlockInDB(topKeyBlock.prev_key_hash));
  let currentBlock = topKeyBlock;
  while (keepSearching) {
    const lastBlock = await resolveBlock(nodeUrl, currentBlock.prev_key_hash);
    if (!lastBlock) {
      throw Error(`Could not find block ${currentBlock.prev_key_hash} in node`);
    }
    try {
      if (lastBlock.height % 250 === 0) console.log(`Inserting block at height ${lastBlock.height} with hash ${lastBlock.hash}`);
      await insertBlock(lastBlock);
      // do it async
      insertReference({ ...currentBlock });
      currentBlock = lastBlock;
    } catch (e) {
      // it already exists
      if (!e.original?.message.includes('duplicate key value violates unique constraint "Blocks_pkey"')) console.error(e);
      console.log(`Found existing block ${lastBlock.hash}. Stopping backwards search.`);
      keepSearching = false;
    }
  }
}

export async function getChainEnds() {
  // get chain ends
  const queryResults = await Promise.all(nodes.map(async nodeUrl => {
    const keyBlockHashes: string[] = await axios.get(`${nodeUrl}/status/chain-ends`).then(({ data }: {data: string[] }) => data).catch((e: Error) => {
      console.error(e.message);
      console.log('where');
      return [];
    });
    return keyBlockHashes.map(hash => ({ hash, nodeUrl }));
  }));

  // get all unique chain ends
  return Promise.all(queryResults.flat()
    .filter((value, index, self) => self.map(x => x.hash).indexOf(value.hash) === index)
    .map(async end => ({
      ...end,
      // also get block from same node
      block: await resolveBlock(end.nodeUrl, end.hash),
    })));
}

export async function updateChainEnds() {
  const uniqueChainEnds = await getChainEnds();
  console.log('chainEnds', uniqueChainEnds.map(end => end.hash));

  // back trace blocks
  await Promise.all(uniqueChainEnds.map(chainEnd => {
    if (chainEnd.block === null) {
      return console.error(`Could not find block ${chainEnd.hash} on node ${chainEnd.nodeUrl}`);
    }
    return backTrack(chainEnd.nodeUrl, chainEnd.block);
  }));
  console.log('Finished initial insert');
}
