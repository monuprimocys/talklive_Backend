module.exports = (sequelize, DataTypes) => {
    const ReportedSocials = sequelize.define("ReportedSocials", {
        report_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        report_type: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        report_text: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    });
    ReportedSocials.associate = function (models) {
        ReportedSocials.belongsTo(models.Social, {
            foreignKey: "social_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'

        })
        ReportedSocials.belongsTo(models.User, {
            foreignKey: "reported_by",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        ReportedSocials.belongsTo(models.Report_type, {
            foreignKey: "report_type_id",
            allowNull: true,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }
    return ReportedSocials;
};
