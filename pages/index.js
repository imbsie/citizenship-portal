import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, fileName, clientName, docId } = req.body;

    if (!file || !fileName || !clientName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const buffer = Buffer.from(file, 'base64');
    const uniqueId = uuidv4();
    const extension = fileName.split('.').pop();
    const storagePath = `${clientName.replace(/\s+/g, '-')}/${docId}-${uniqueId}.${extension}`;

    const blob = await put(storagePath, buffer, {
      access: 'public',
      addRandomSuffix: false,
    });

    return res.status(200).json({
      success: true,
      url: blob.url,
      fileName: fileName,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
}
