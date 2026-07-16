module.exports = (sequelize, DataTypes) => {
    const Report = sequelize.define("Report", {
        report_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        // report_by: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        // },
        report_type: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        report_text: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // report_to: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        // },

    })

    Report.associate = function (models) {
        Report.belongsTo(models.User, {
            foreignKey: "report_by",
            as: "reporter",
            onDelete: "CASCADE",
        });

        Report.belongsTo(models.User, {
            foreignKey: "report_to",
            as: "reported",
            onDelete: "CASCADE",
        });
        Report.belongsTo(models.Report_type, {
            foreignKey: "report_type_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }

    return Report
}