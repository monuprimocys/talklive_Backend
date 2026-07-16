module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define("Admin", {
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",

    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // This will ensure only one unique index is created
      get() {
        const data = this.getDataValue("email");
        if (!data) {
          return "";
        }
        return data;
      },
    },

    socket_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: " ",
    },
    mobile_number:{
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    gender:{
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    dob:{
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    profile_pic: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      get() {
        const raw_urls = this.getDataValue("profile_pic");
        const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
        return imageUrls != `${process.env.baseUrl}/`
          ? imageUrls
          : `${process.env.baseUrl}/uploads/not-found-images/profile-image.png`;
      },
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    country_short_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },



  });

  Admin.associate = function (models) {

    Admin.hasMany(models.Gift_category, {
      as: "GiftCategoryUploader",
      foreignKey: "uploader_id",
      onDelete: "CASCADE",
    });
    Admin.hasMany(models.Gift, {
      as: "GiftUploader",
      foreignKey: "uploader_id",
      onDelete: "CASCADE",
    });
  }

  return Admin;
};
