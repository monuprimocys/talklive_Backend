const { formatMediaUrl } = require("../src/helper/url.helper");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
      // set() {
      //   // Automatically set full_name when first_name or last_name is updated
      //   this.setDataValue(
      //     "full_name",
      //     `${this.getDataValue("first_name")} ${this.getDataValue(
      //       "last_name"
      //     )}`.trim()
      //   );
      // },
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

    user_name: {
      type: DataTypes.STRING,
      unique: true, // This will ensure only one unique index is created
      allowNull: true,
      get() {
        const data = this.getDataValue("user_name");
        if (!data) {
          return "";
        }
        return data;
      },
      set(value) {
        if (typeof value === "string") {
          this.setDataValue("user_name", value.toLowerCase());
        } else {
          this.setDataValue("user_name", value);
        }
      },
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

    country_code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    socket_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },

    mobile_num: {
      type: DataTypes.STRING,
      allowNull: true,
      get() {
        const data = this.getDataValue("mobile_num");
        if (!data) {
          return "";
        }

        return data;
      },
    },
    otp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: " ",
    },
    login_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // social_id: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    //   defaultValue: 0,
    // },
    profile_pic: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      get() {
        return formatMediaUrl(this.getDataValue("profile_pic"), "uploads/not-found-images/profile-image.png");
      },
    },
    id_proof: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      get() {
        return formatMediaUrl(this.getDataValue("id_proof"));
      },
    },
    selfie: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      get() {
        return formatMediaUrl(this.getDataValue("selfie"));
      },
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      get() {
        const data = this.getDataValue("dob");
        if (!data) {
          return "";
        }

        return data;
      },
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
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
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    bio: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    device_token: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    profile_verification_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    login_verification_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    intrests: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      get() {
        const intrests = this.getDataValue("intrests");
        if (!intrests) return []; // Return an empty array if null
        return intrests.length > 0 ? intrests : [];
      },
    },
    available_coins: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    // Bank Related Tasks
    account_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    account_number: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },

    bank_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    swift_code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    IFSC_code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    total_socials: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    blocked_by_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    platforms: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      get() {
        const platforms = this.getDataValue("platforms");
        return platforms?.length > 0 ? platforms : [];
      },
    },


    // Paid Communication Pricing
    message_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    call_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    video_call_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      }
    },
     revenuecat_customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    subscription_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
     voip_token: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },

  }
  );
  User.associate = function (models) {
    User.hasMany(models.Social, {
      foreignKey: "user_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    User.hasMany(models.Product, {
      foreignKey: "user_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    // To Tag Users in Profile

    User.belongsToMany(models.User, {
      through: models.Taged_user,
      foreignKey: "owner_id",
      as: "Owner",
      onDelete: "CASCADE",
    });

    User.belongsToMany(models.User, {
      through: models.Taged_user,
      foreignKey: "taged_user_id",
      as: "Taged_in",
      onDelete: "CASCADE",
    });

    User.hasMany(models.Action, {
      foreignKey: "action_by",
      allowNull: false,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    User.hasMany(models.ReportedSocials, {
      foreignKey: "reported_by",
      allowNull: false,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    User.hasMany(models.Like, {
      foreignKey: "like_by",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    User.hasMany(models.Save, {
      foreignKey: "save_by",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    User.hasMany(models.Comment, {
      foreignKey: "comment_by",
      as: "commenter",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    User.hasMany(models.Message_seen, {
      foreignKey: "user_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    User.hasMany(models.Participant, {
      foreignKey: "user_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    User.hasMany(models.Message, {
      foreignKey: "sender_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });

    User.belongsToMany(models.User, {
      through: models.Follow,
      foreignKey: "user_id",
      as: "User",
      onDelete: "CASCADE",
    });
    User.belongsToMany(models.User, {
      through: models.Follow,
      foreignKey: "follower_id",
      as: "follower",
      onDelete: "CASCADE",
    });
    User.belongsToMany(models.User, {
      through: models.Block,
      foreignKey: "user_id",
      as: "blocker",
      onDelete: "CASCADE",
    });
    User.belongsToMany(models.User, {
      through: models.Block,
      foreignKey: "blocked_id",
      as: "blocked",
      onDelete: "CASCADE",
    });
    User.hasMany(models.Report, {
      foreignKey: "report_by",
      as: "reportsMade",
      onDelete: "CASCADE",
    });

    User.hasMany(models.Report, {
      foreignKey: "report_to",
      as: "reportsReceived",
      onDelete: "CASCADE",
    });
    // User.hasMany(models.Music, {
    //   as: "Uploader",
    //   foreignKey: "uploader_id",
    //   onDelete: "CASCADE"
    // });



    User.hasMany(models.Money_coin_transaction, {
      foreignKey: "user_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
    User.hasMany(models.Notification, {
      foreignKey: "sender_id",
      as: "notification_sender",
      allowNull: true,
      onDelete: 'CASCADE'
    });
    User.hasMany(models.Notification, {
      foreignKey: "reciever_id",
      as: "notification_reciever",
      allowNull: true,
      onDelete: 'CASCADE'
    });
    User.hasMany(models.Live_host, {
      foreignKey: "user_id",
      onDelete: "CASCADE",
    });
    User.hasMany(models.SocialPin, {
      foreignKey: "pin_by",
      as: "pinned_socials",
    });
    User.hasMany(models.MusicSave, {
    foreignKey: "save_by",
    onDelete: "CASCADE",
});

    // Dynamic_Admins
    // User.hasMany(models.Transaction_conf, {
    //   as: 'uploader',
    //   foreignKey: "uploader_id",
    //   allowNull: false,
    //   onDelete: "CASCADE",
    // });
  };

  return User;
};
