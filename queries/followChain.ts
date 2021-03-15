export const forwardQuery = (startHash: string) => `WITH RECURSIVE subordinates AS (
    SELECT "keyHash",
           "lastKeyHash",
           "timestamp",
           "height"
    FROM "Blocks"
    WHERE "keyHash" = '${startHash}' -- start
    UNION
    SELECT b."keyHash",
           b."lastKeyHash",
           b.timestamp,
           b.height
    FROM "Blocks" b
              INNER JOIN subordinates s ON s."keyHash" = b."lastKeyHash"
)
SELECT *
FROM subordinates
ORDER BY height ASC;
`;

export const backwardQuery = (startHash: string) => `WITH RECURSIVE subordinates AS (
    SELECT "keyHash",
           "lastKeyHash",
           "timestamp",
           "height"
    FROM "Blocks"
    WHERE "keyHash" = '${startHash}' -- start
    UNION
    SELECT b."keyHash",
           b."lastKeyHash",
           b.timestamp,
           b.height
    FROM "Blocks" b
             INNER JOIN subordinates s ON s."lastKeyHash" = b."keyHash"
)
SELECT *
FROM subordinates
ORDER BY height ASC;
`;
