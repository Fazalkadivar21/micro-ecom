import ImageKit from "imagekit";
import { v4 } from "uuid";

interface UploadImageParams {
  buffer: Buffer;
  folder?: string;
}

interface UploadedImage {
  url: string;
  thumbnail: string;
  id: string;
}

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "test_public",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "test_private",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/demo",
});

export async function uploadImage({buffer,folder = "/products",}: UploadImageParams):Promise<UploadedImage> {
  const res = await imagekit.upload({
    file: buffer,
    fileName: v4(),
    folder,
  });

  return {
    url: res.url,
    thumbnail: res.thumbnailUrl || res.url,
    id: res.fileId,
  };
}
