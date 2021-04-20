# Fork Detection

The following steps are repeated with pauses of 180 seconds in between.

## 1. Update Chain Ends

1. Call the endpoint of a single node `http://206.81.24.215:3013/v2/status/chain-ends`
1. From each unique chain end, recursively query the `prev_key_hash` from the node
   1. Get `prev_key_hash` from current Block ("Block 2")
   1. Query the previous block ("Block 1") from node
   1. Insert block ("Block 1") in database
   1. Set reference from inserted ("Block 1") to next block ("Block 2") (via `prev_key_hash`)
   1. Repeat unless the `key_hash` of ("Block 1") is already in the database

## 2. Check for Forks

1. Search the database for `prev_key_hash` which occur more than once
1. Get all blocks with these `prev_key_hash` which are not older than 1k blocks from the current top
1. Run a forward search on these. For each potential fork:
  1. Get all future blocks (height > current)
  1. For current Block ("Block 1") get the next block ("Block 2") where `2.prev_key_hash` is `1.key_hash`
  1. If there are two next Blocks, do a forward search for each of them and merge the result in current fork
  1. Repeat 2. & 3. until there are no next blocks

## 3. Alert for forks

1. Remove the longest (highest height - lowest height) fork, its the main chain
1. For all other found forks,
   1. verify that a fork contains more than one block
   1. check if it has been growing (compare with memory state of last alert iterations)
   1. if both of the above are true, alert users in telegram group

