import { Request, Response } from "express";
import { SearchService } from "../services/SearchService";

export const searchAutocomplete = async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;
  if (!q) {
    res.status(200).json({ success: true, results: [] });
    return;
  }
  try {
    const results = await SearchService.autocomplete(q as string);
    // Add to recent search logs
    SearchService.addRecentSearch(q as string);
    res.status(200).json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getSearchMeta = async (req: Request, res: Response): Promise<void> => {
  try {
    const recents = SearchService.getRecentSearches();
    const saved = SearchService.getSavedLocations();
    res.status(200).json({ success: true, recents, saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
