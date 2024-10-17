import { Request, RequestHandler } from "express";
import formidable, { Files, File } from "formidable";

export interface RequestWithFiles extends Request {
  files?: { [key: string]: File | File[] };
}

export const fileParser: RequestHandler = (req: RequestWithFiles, res, next): any => {
  if (!req.headers["content-type"]?.startsWith("multipart/form-data;")) {
    return res.status(422).json({ error: "Only accepts form-data!" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "File parsing error" });
    }

    // Add parsed fields to req.body
    for (const key in fields) {
      const field = fields[key];
      if (field) {
        req.body[key] = Array.isArray(field) ? field[0] : field; // Handle arrays if they exist
      }
    }

    // Add parsed files to req.files
    for (const key in files) {
      const file = files[key];
      if (!req.files) {
        req.files = {};
      }
      if (file) {
        // No need for [0], since `multiples: false`, each key will have a single file
        req.files[key] = file as unknown as File; // Cast to File type explicitly
      }
    }

    next();
  });
};
