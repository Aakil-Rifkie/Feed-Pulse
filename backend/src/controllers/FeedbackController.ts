import type { Request, Response } from "express";
import Feedback from "../models/Feedback";
import { analyseFeedback } from "../services/GeminiService";

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category, submitterName, submitterEmail } = req.body;

    if (!title || !description || !category) {
      res.status(400).json({ success: false, error: "Missing required fields" });
      return;
    }

    const feedback = await Feedback.create({
      title,
      description,
      category,
      submitterName,
      submitterEmail,
    });

    analyseFeedback(title, description).then(async (analysis) => {
      if (analysis) {
        await Feedback.findByIdAndUpdate(feedback._id, {
          ai_category: analysis.category,
          ai_sentiment: analysis.sentiment,
          ai_priority: analysis.priority_score,
          ai_summary: analysis.summary,
          ai_tags: analysis.tags,
          ai_processed: true,
        });
      }
    });

    res.status(201).json({ success: true, data: feedback, message: "Feedback submitted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, status, sort, page = "1", limit = "10", search } = req.query;

    const filter: Record<string, unknown> = {};
    if (category) filter["category"] = category;
    if (status) filter["status"] = status;
    if (search) {
      filter["$or"] = [
        { title: { $regex: search, $options: "i" } },
        { ai_summary: { $regex: search, $options: "i" } },
      ];
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      date: { createdAt: -1 },
      priority: { ai_priority: -1 },
      sentiment: { ai_sentiment: 1 },
    };
    const sortOption = sortMap[sort as string] ?? { createdAt: -1 };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Feedback.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Feedback.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      message: "Feedback fetched",
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getFeedbackById = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedback = await Feedback.findById(req.params["id"]);
    if (!feedback) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const updateFeedbackStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params["id"],
      { status },
      { new: true, runValidators: true }
    );
    if (!feedback) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }
    res.json({ success: true, data: feedback, message: "Status updated" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const deleteFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params["id"]);
    if (!feedback) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const retriggerAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedback = await Feedback.findById(req.params["id"]);
    if (!feedback) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }

    const analysis = await analyseFeedback(feedback.title, feedback.description);
    if (!analysis) {
      res.status(500).json({ success: false, error: "Gemini analysis failed" });
      return;
    }

    const updated = await Feedback.findByIdAndUpdate(
      feedback._id,
      {
        ai_category: analysis.category,
        ai_sentiment: analysis.sentiment,
        ai_priority: analysis.priority_score,
        ai_summary: analysis.summary,
        ai_tags: analysis.tags,
        ai_processed: true,
      },
      { new: true }
    );

    res.json({ success: true, data: updated, message: "AI analysis re-triggered" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};