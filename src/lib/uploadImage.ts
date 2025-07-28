// lib/uploadImage.ts
export const uploadImage = async (file: File) => {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  const cloud  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD!;
  const form   = new FormData();
  form.append("upload_preset", preset);
  form.append("file", file);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/upload`, {
    method: "POST",
    body:   form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Upload failed");
  return { url: data.secure_url as string, name: file.name };
};
