import { Router } from "express";
import { searchAutocomplete, getSearchMeta } from "../controllers/search.controller";

const router = Router();

router.get("/autocomplete", searchAutocomplete);
router.get("/meta", getSearchMeta);

export default router;
