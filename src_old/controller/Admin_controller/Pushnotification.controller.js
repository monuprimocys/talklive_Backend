const { Broadcast_push_notification } = require("../../../models");
const { generalResponse } = require("../../helper/response.helper");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { getConfig } = require("../../service/repository/Project_conf.service");

async function broadcastMessage(req, res) {
    try {
        if (!req.body.title && !req.body.message) {
            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true,
                402
            )
        }
        const project_conf = await getConfig({ config_id: 1 })
        
        const result = await sendPushNotification({
            title: `${req.body.title}`,
            message: `${req.body.message}`,
            // appLogo: project_conf.app_logo_light,
            data: {
                type: "broadcast"
            },
            broadcast:true
            
        });
        const notification = Broadcast_push_notification.create({
            title: req.body.title,
            message: req.body.message
        })
        return generalResponse(res, result, 'Notification sent successfully', true, false, 200);
    } catch (error) {
        console.error("Error in broadcasting message:", error);
        return generalResponse(
            res,
            {},
            error.message,
            false,
            true,
            500
        );
    }
}
async function getbroadcastMessage(req, res) {
    try {

        const { page = 1, pageSize = 10 } = req.body;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        const { rows, count } = await  Broadcast_push_notification.findAndCountAll({
            limit,
            offset,
        }

        )

        return generalResponse(res, {
            Records: rows,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: Number(count),
                current_page: Number(page),
                records_per_page: Number(pageSize),
            },
        }, 'Notification listed successfully', true, false, 200);
    } catch (error) {
        console.error("Error in broadcasting message:", error);
        return generalResponse(
            res,
            {},
            error.message,
            false,
            true,
            500
        );
    }
}
// async function broadcastMessage(req, res) {
//     try {

//         const result = await sendPushNotification({
//             title: '🎉 Greetings Of the Day!',
//             message: "How's your day?",
//             appLogo: 'https://www.creativefabrica.com/wp-content/uploads/2020/08/25/Chat-Bubble-Logo-Design-Vector-Isolated-Graphics-5109808-1-1-580x387.jpg',
//             data: {
//                 type: 'update',
//                 version: '2.1.0',
//             },
//         });

//         return generalResponse(res, result, 'Notification sent successfully', true, false, 200);
//     } catch (error) {
//         console.error("Error in broadcasting message:", error);
//         return generalResponse(
//             res,
//             {},
//             error.message,
//             false,
//             true,
//             500
//         );
//     }
// }

module.exports = {
    broadcastMessage,
    getbroadcastMessage
};