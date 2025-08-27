import express from "express";
import { searchMusic } from "../controllers/searchController.js";

const router = express.Router();

router.get("/", searchMusic);

export default router;
