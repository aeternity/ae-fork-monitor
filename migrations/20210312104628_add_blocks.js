const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "Blocks", deps: [Blocks]
 *
 */

const info = {
  revision: 1,
  name: "add_blocks",
  created: "2021-03-12T10:46:28.889Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "Blocks",
      {
        height: { type: Sequelize.INTEGER, field: "height" },
        keyHash: { type: Sequelize.STRING, field: "keyHash", primaryKey: true },
        timestamp: { type: Sequelize.DATE, field: "timestamp" },
        lastKeyHash: {
          type: Sequelize.STRING,
          onUpdate: "CASCADE",
          onDelete: "NO ACTION",
          references: { model: "Blocks", key: "keyHash" },
          allowNull: true,
          field: "lastKeyHash",
        },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          field: "updatedAt",
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "dropTable",
    params: ["Blocks", { transaction }],
  },
];

const pos = 0;
const useTransaction = true;

const execute = (queryInterface, sequelize, _commands) => {
  let index = pos;
  const run = (transaction) => {
    const commands = _commands(transaction);
    return new Promise((resolve, reject) => {
      const next = () => {
        if (index < commands.length) {
          const command = commands[index];
          console.log(`[#${index}] execute: ${command.fn}`);
          index++;
          queryInterface[command.fn](...command.params).then(next, reject);
        } else resolve();
      };
      next();
    });
  };
  if (this.useTransaction) return queryInterface.sequelize.transaction(run);
  return run(null);
};

module.exports = {
  pos,
  useTransaction,
  up: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, migrationCommands),
  down: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, rollbackCommands),
  info,
};
