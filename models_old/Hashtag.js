module.exports = (sequelize, DataTypes) => {
    const Hashtag = sequelize.define("Hashtag", {
        hashtag_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        hashtag_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            set(value) {
                if (typeof value === "string") {
                    this.setDataValue("hashtag_name", value.toLowerCase());
                } else {
                    this.setDataValue("hashtag_name", value);
                }
              },
        },
        counts:{
            type: DataTypes.INTEGER,
            allowNull:false,
            defaultValue:0
        }
    })

    return Hashtag
}