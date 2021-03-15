import {
  DataTypes as DataTypesType, Sequelize, Model, Optional,
} from 'sequelize';

// We recommend you declare an interface for the attributes, for stricter typechecking
interface BlockAttributes {
  height: number;
  keyHash: string;
  timestamp: Date;
  lastKeyHash: string;
}
// Some fields are optional when calling UserModel.create() or UserModel.build()
interface BlockCreationAttributes extends Optional<BlockAttributes, 'lastKeyHash'> {}
export class Block extends Model<BlockAttributes, BlockCreationAttributes> implements BlockAttributes {
  public height!: number;

  public keyHash!: string;

  public timestamp!: Date;

  public lastKeyHash!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}
// export the model
export const initModel = (sequelize: Sequelize, DataTypes: typeof DataTypesType) => {
  Block.init({
    height: DataTypes.INTEGER,
    keyHash: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    timestamp: DataTypes.DATE,
    lastKeyHash: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Block',
  });
  Block.belongsTo(Block, { as: 'last' });
  return Block;
};
