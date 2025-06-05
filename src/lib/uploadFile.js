import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './public/lampiran',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

export default function handler(req, res) {
  if (req.method === 'POST') {
    upload.single('lampiran')(req, res, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ filePath: `/lampiran/${req.file?.filename}` });
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
