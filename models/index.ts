import { Sequelize, DataTypes } from 'sequelize';
import { initModel } from './block';

const env = process.env.NODE_ENV || 'development';
// eslint-disable-next-line import/no-dynamic-require
const config = require(`${__dirname}/../config/config.js`)[env];

export const sequelize = new Sequelize(config.database, config.username, config.password, config);

export const Block = initModel(sequelize, DataTypes);
