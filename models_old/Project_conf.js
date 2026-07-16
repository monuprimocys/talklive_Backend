module.exports = (sequelize, DataTypes) => {
  const Project_conf = sequelize.define("Project_conf", {
      config_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      phone_authentication: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      email_authentication: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      maximum_members_in_group: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      show_all_contatcts: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      show_phone_contatcs: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      app_logo_light: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const raw_urls = this.getDataValue("app_logo_light");
          const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
          return imageUrls != process.env.baseUrl ? imageUrls : ``;
        },
      },
      app_logo_dark: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const raw_urls = this.getDataValue("app_logo_dark");
          const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
          return imageUrls != process.env.baseUrl ? imageUrls : ``;
        },
      },
      splash_image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const raw_urls = this.getDataValue("splash_image");
          const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
          return imageUrls != process.env.baseUrl ? imageUrls : ``;
        },
      },
      one_signal_app_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        // get() {
        //   const data = this.getDataValue("one_signal_app_id");
        //   if (!data) return "";
        //   return data.length > 4
        //     ? "*".repeat(data.length - 4) + data.slice(-4)
        //     : data;
        // }
      },
      one_signal_api_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const data = this.getDataValue("one_signal_api_key");
          if (!data) return "";
          return data.length > 4
            ? "*".repeat(data.length - 4) + data.slice(-4)
            : data;
        }
      },
      android_channel_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const data = this.getDataValue("android_channel_id");
          if (!data) return "";
          return data.length > 4
            ? "*".repeat(data.length - 4) + data.slice(-4)
            : data;
        }
      },
      app_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_text: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_primary_color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_secondary_color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_ios_link: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_android_link: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_tell_a_friend_text: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      web_logo_light: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const raw_urls = this.getDataValue("web_logo_light");
          const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
          return imageUrls != process.env.baseUrl ? imageUrls : ``;
        },
      },
      web_logo_dark: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const raw_urls = this.getDataValue("web_logo_dark");
          const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
          return imageUrls != process.env.baseUrl ? imageUrls : ``;
        },
      },
      twilio_account_sid: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const data = this.getDataValue("twilio_account_sid");
          if (!data) return "";
          return data.length > 4
            ? "*".repeat(data.length - 4) + data.slice(-4)
            : data;
        }
      },
      twilio_auth_token: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const data = this.getDataValue("twilio_auth_token");
          if (!data) return "";
          return data.length > 4
            ? "*".repeat(data.length - 4) + data.slice(-4)
            : data;
        }
      },
      msg_91_auth_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const data = this.getDataValue("msg_91_auth_key");
          if (!data) return "";
          return data.length > 4
            ? "*".repeat(data.length - 4) + data.slice(-4)
            : data;
        }
      },
      msg_91_private_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const data = this.getDataValue("msg_91_private_key");
          if (!data) return "";
          return data.length > 4
            ? "*".repeat(data.length - 4) + data.slice(-4)
            : data;
        }
      },
      msg_91_template_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const data = this.getDataValue("msg_91_template_id");
          if (!data) return "";
          return data.length > 4
            ? "*".repeat(data.length - 4) + data.slice(-4)
            : data;
        }
      },
      twilio_phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const data = this.getDataValue("twilio_phone_number");
          if (!data) return "";
          return data.length > 4
            ? "*".repeat(data.length - 4) + data.slice(-4)
            : data;
        }
      },
      email_service: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      smtp_host: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      email_port: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const data = this.getDataValue("password");
          if (!data) return "";
          return "*".repeat(data.length)
        }
      },
      email_title: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      purchase_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      copyright_text: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      email_banner: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get() {
          const raw_urls = this.getDataValue("email_banner");
          const imageUrls = `${process.env.baseUrl}${raw_urls}`;
          return imageUrls != process.env.baseUrl ? imageUrls : ``;
        },
      },
      privacy_policy: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      terms_and_conditions: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      delete_account: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      // s3
      s3_region: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      s3_access_key_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      s3_secret_access_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      s3_bucket_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      mediaflow: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "LOCAL",
      },
      stripe:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      stripe_public_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      stripe_secret_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      gpay: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      gpay_merch_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      gpay_merch_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      gpay_country_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      gpay_currency_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      apple_pay: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      apple_pay_merch_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      apple_pay_merch_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      apple_pay_country_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      apple_pay_currency_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      paypal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      paypal_public_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      paypal_secret_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      google_login_authentication: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      apple_login_authentication: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_extended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_demo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    isRechargeEnable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
  })
  return Project_conf

 ;
}

