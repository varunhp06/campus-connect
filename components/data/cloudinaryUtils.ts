// utils/cloudinaryUtils.ts

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export const uploadToCloudinary = async (
  imageUri: string,
  cloudName: string,
  uploadPreset: string
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  
  // Create file object from URI
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as any);
  
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (
  publicId: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string
): Promise<void> => {
  try {
    // Generate timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Create signature (you'll need to implement this on your backend for security)
    // For now, this is a placeholder - DO NOT expose API secret in client code
    // You should create a backend endpoint to handle deletions
    
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    // formData.append('signature', signature); // Generate on backend

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data.result !== 'ok') {
      console.error('Failed to delete from Cloudinary:', data);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw - deletion failure shouldn't block the app
  }
};

// Safer approach: Delete via backend
export const deleteImageViaBackend = async (
  publicId: string,
  backendUrl: string
): Promise<void> => {
  try {
    const response = await fetch(`${backendUrl}/delete-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  } catch (error) {
    console.error('Backend delete error:', error);
  }
};