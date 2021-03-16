import { Telegraf } from 'telegraf';
import { Fork } from './detector';

if (!process.env.BOT_TOKEN) throw Error('env BOT_TOKEN is not defined.');
if (!process.env.CHAT_ID) throw Error('env CHAT_ID is not defined.');
const chatId = process.env.CHAT_ID;
const bot = new Telegraf(process.env.BOT_TOKEN);
let forksFromLastCall: Fork[] = [];

bot.start(ctx => {
  ctx.reply('Welcome');
});
bot.hears('hi', ctx => ctx.reply('Hey there'));
bot.launch();

async function sendMessage(message: string) {
  return bot.telegram.sendMessage(chatId, message);
}

export async function alertForForks(forks: Fork[]) {
  // ALERT RULES
  const MINIMUM_FORK_LENGTH = 1;

  // Filter longest fork (its not a fork, its the main chain)
  forks.sort((a, b) => b.forkLength - a.forkLength).shift();

  // if memory is empty, dont send anything
  if (forksFromLastCall.length === 0) {
    forksFromLastCall = [...forks];
    return;
  }

  // match forks

  // alert for all other forks
  forks.forEach(fork => {
    if (fork.forkLength >= MINIMUM_FORK_LENGTH) {
      // check if its growing
      const previousMatch = forksFromLastCall.find(({ forkStart }) => forkStart.keyHash === fork.forkStart.keyHash);
      // if there is no previous fork, ignore it
      if (!previousMatch) {
        console.log(`Could not find previous fork for ${fork.forkStart.keyHash} with length ${fork.forkLength}`);
      } else if (previousMatch.forkLength < fork.forkLength) {
        sendMessage(`Found a Fork. Length: ${fork.forkLength} from ${fork.forkStart.lastKeyHash} to ${fork.forkEnd.keyHash}`);
      } else if (previousMatch.forkLength >= fork.forkLength) {
        console.log(`Fork is not growing in length. Length: ${fork.forkLength} from ${fork.forkStart.lastKeyHash} to ${fork.forkEnd.keyHash}`);
      }
    }
  });

  // Update forks memory
  forksFromLastCall = [...forks];
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
