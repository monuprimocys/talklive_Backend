module.exports = (sequelize, DataTypes) => {
    const Country = sequelize.define("Country", {
        country_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        country_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        country_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
    }
    )
    return Country;
}