const { Router } = require("express")

const userRoutes = require("./user.routes");
const socialRoutes = require("./social.routes")
const followRoutes = require("./follow.routes") 
const blockRoutes = require("./block.routes") 
const reportRoutes = require("./report.routes") 
const likeRoutes = require("./like.routes") 
const saveRoutes = require("./saves.routes") 
const commentRoutes = require("./comment.routes") 
const chatRoutes = require("./chat.routes") 
const productRoutes = require("./product.routes") 
const musicRoutes = require("./Music.routes") 
const giftRoutes = require("./gift.routes") 
const transactionRoutes = require("./transaction.routes") 
const liveRoutes = require("./live.routes") 
const hashtag_routes = require("./hashtag.routes")
const admin_routes= require("./admin.routes") 
const avatar_routes= require("./Avatar.routes") 
const language_routes= require("./Language.routes"); 
const { get_Config } = require("../controller/Admin_controller/ProjectConf.controller");
const callRoutes = require("./call.routes");
const feedRoutes = require("./feed.routes")
const paidCommunicationRoutes = require("./paid-communication.routes")

const router = Router();


router.use('/users', userRoutes);
router.use('/social', socialRoutes);
router.use('/follow', followRoutes);
router.use('/block', blockRoutes);
router.use('/report', reportRoutes);
router.use('/like', likeRoutes);
router.use('/save', saveRoutes);
router.use('/comment', commentRoutes);
router.use('/chat', chatRoutes);
router.use('/ecommerce',productRoutes );

router.use("/music" , musicRoutes)
router.use("/gift" , giftRoutes)
router.use("/transaction", transactionRoutes)
router.use("/live", liveRoutes )


router.use("/hashtag", hashtag_routes )


router.use("/feed", feedRoutes)


router.use("/avatar", avatar_routes )

router.use("/language", language_routes )
// Admin routes
router.use("/admin", admin_routes )

// Conf routes 
router.get("/project_conf", get_Config)


router.use("/call", callRoutes);
router.use("/paid-communication", paidCommunicationRoutes);


module.exports = router;