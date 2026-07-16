module.exports = (sequelize, DataTypes) => {
  const PaymentWebhookLog = sequelize.define("PaymentWebhookLog", {
    webhook_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    purchase_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "CoinPurchaseOrders",
        key: "purchase_id",
      },
      comment: "Reference to purchase order",
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
      index: true,
      comment: "NOWPayments payment ID (for duplicate detection)",
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: true,
      index: true,
      comment: "NOWPayments order ID",
    },
    webhook_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Type of webhook event",
    },
    request_headers: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Request headers (excluding auth tokens)",
    },
    request_body: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "Full webhook payload for debugging",
    },
    signature_valid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether signature validation passed",
    },
    signature_received: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Signature provided in webhook",
    },
   status: {
  type: DataTypes.STRING,
  allowNull: false,
  defaultValue: "PROCESSED",
} ,
    processing_error: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Error message if processing failed",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  return PaymentWebhookLog;
};
