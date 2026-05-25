module.exports = (sequelize, DataTypes) => {
  const FeedReport = sequelize.define("FeedReport", {
    feed_report_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    report_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of report: inappropriate, spam, harassment, etc.',
    },
    report_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
      comment: 'Detailed description of the report',
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'rejected'),
      defaultValue: 'pending',
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes by admin regarding the report',
    },
  });

  FeedReport.associate = function (models) {
    FeedReport.belongsTo(models.Feed, {
      foreignKey: "feed_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
    FeedReport.belongsTo(models.User, {
      foreignKey: "reported_by_user_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
  };

  return FeedReport;
};
