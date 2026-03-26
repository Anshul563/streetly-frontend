"use client";

import { useState } from "react";
import { API } from "@/lib/api";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  MapPin,
  UploadCloud,
  Loader2,
  AlertCircle,
  RouteIcon,
  Trash2,
  Droplet,
  Zap,
  Bath,
  MoreHorizontal,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Hash,
  X,
  FileImage,
  Plus,
  PenSquare,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { id: "road", label: "Road", icon: RouteIcon },
  { id: "garbage", label: "Garbage", icon: Trash2 },
  { id: "water", label: "Water", icon: Droplet },
  { id: "electricity", label: "Electricity", icon: Zap },
  { id: "toilet", label: "Toilet", icon: Bath },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
});

type PostType = "issue" | "post";

export default function CreatePage() {
  const [postType, setPostType] = useState<PostType>("issue");

  // Issue fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("road");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [pincode, setPincode] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Post fields
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [postImages, setPostImages] = useState<File[]>([]);
  const [postPreviews, setPostPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleIssueDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handlePostDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    addPostImages(files);
  };

  const addPostImages = (files: File[]) => {
    const remaining = 5 - postImages.length;
    const toAdd = files.slice(0, remaining);
    setPostImages((prev) => [...prev, ...toAdd]);
    setPostPreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removePostImage = (index: number) => {
    setPostImages((prev) => prev.filter((_, i) => i !== index));
    setPostPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#+/, "").toLowerCase();
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setTags((prev) => [...prev, tag]);
      }
      setTagInput("");
    }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset || cloudName === "your_cloud_name_here") {
      return "";
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url || "";
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      toast.error("Please select a location on the map.");
      return;
    }
    if (!image) {
      toast.error("Please upload a photo of the issue.");
      return;
    }
    try {
      setLoading(true);
      const imageUrl = await uploadToCloudinary(image);
      await API.post("/issues", {
        title,
        description,
        category,
        city,
        address,
        locality,
        pincode,
        latitude: position.lat,
        longitude: position.lng,
        imageUrl,
        type: "issue",
      });
      toast.success("Issue reported successfully 🎉");
      window.location.href = "/feed";
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Error creating issue");
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      toast.error("Please add a caption.");
      return;
    }
    if (postImages.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }
    try {
      setLoading(true);
      const uploadedUrls = await Promise.all(postImages.map(uploadToCloudinary));
      const validUrls = uploadedUrls.filter(Boolean);
      await API.post("/issues", {
        title: caption.slice(0, 100),
        description: caption,
        type: "post",
        images: validUrls,
        imageUrl: validUrls[0] || "",
        tags,
      });
      toast.success("Post shared successfully 🚀");
      window.location.href = "/feed";
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Error creating post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex justify-center pb-24">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/feed">
            <Button variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create</h1>
            <p className="text-muted-foreground text-sm">Share a post or report an issue</p>
          </div>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setPostType("post")}
            className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border-2 transition-all duration-200 font-semibold text-sm ${
              postType === "post"
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:border-primary/40"
            }`}
          >
            <PenSquare className="w-5 h-5" />
            <span>Create Post</span>
            <span className="text-xs font-normal opacity-70">Caption · Tags · Photos</span>
          </button>
          <button
            onClick={() => setPostType("issue")}
            className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border-2 transition-all duration-200 font-semibold text-sm ${
              postType === "issue"
                ? "border-destructive bg-destructive/10 text-destructive shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:border-destructive/40"
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            <span>Report Issue</span>
            <span className="text-xs font-normal opacity-70">Location · Category · Photo</span>
          </button>
        </div>

        {/* ---- POST FORM ---- */}
        {postType === "post" && (
          <form onSubmit={handlePostSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Caption + Tags */}
            <div className="space-y-6">
              <Card className="shadow-sm border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <PenSquare className="w-5 h-5 text-primary" />
                    Post Details
                  </CardTitle>
                  <CardDescription>Write a caption and add hashtags</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="caption" className="text-foreground">Caption</Label>
                    <Textarea
                      id="caption"
                      placeholder="What's happening in your neighborhood? Share your thoughts..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      required
                      className="min-h-[140px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {caption.length}/500
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-1">
                      <Hash className="w-4 h-4" />
                      Hashtags
                    </Label>
                    <div
                      className={`flex flex-wrap gap-2 min-h-[48px] p-3 rounded-xl border transition-colors ${
                        tags.length > 0 ? "border-primary/40 bg-primary/5" : "border-border bg-background"
                      }`}
                    >
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1 text-primary bg-primary/10 border-primary/20 hover:bg-primary/20"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 rounded-full hover:bg-primary/20 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder={tags.length === 0 ? "Type a tag and press Enter..." : "Add more..."}
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Press Enter or Space to add a tag. Max 10 tags.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full py-6 text-base font-semibold shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <PenSquare className="mr-2 h-5 w-5" />
                    Publish Post
                  </>
                )}
              </Button>
            </div>

            {/* Right: Multi-image upload */}
            <div className="space-y-6">
              <Card className="shadow-sm border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-primary" />
                    Photos
                  </CardTitle>
                  <CardDescription>
                    Upload up to 5 photos ({postImages.length}/5)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Dropzone */}
                  <label
                    htmlFor="post-image-upload"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handlePostDrop}
                    className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                      postImages.length >= 5
                        ? "opacity-50 pointer-events-none border-border bg-muted"
                        : isDragging
                        ? "border-primary bg-primary/10 scale-[1.01]"
                        : "border-border bg-muted/50 hover:bg-muted hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">Click to upload</span> or drag & drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                    <input
                      id="post-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) addPostImages(Array.from(e.target.files));
                      }}
                    />
                  </label>

                  {/* Image grid preview */}
                  {postPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {postPreviews.map((src, i) => (
                        <div
                          key={i}
                          className="relative group rounded-xl overflow-hidden aspect-square border border-border shadow-sm"
                        >
                          <img
                            src={src}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePostImage(i)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {i === 0 && (
                            <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                      {postImages.length < 5 && (
                        <label
                          htmlFor="post-image-upload"
                          className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:bg-muted hover:border-primary/50 transition-all"
                        >
                          <Plus className="w-6 h-6 text-muted-foreground" />
                        </label>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        )}

        {/* ---- ISSUE FORM ---- */}
        {postType === "issue" && (
          <form id="issue-form" onSubmit={handleIssueSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Issue Details */}
              <div className="space-y-6">
                <Card className="shadow-sm border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      Issue Details
                    </CardTitle>
                    <CardDescription>Describe the infrastructure problem</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-foreground">Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g. Broken road near station"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-foreground">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Provide specific details about the issue..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-foreground">Category</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {CATEGORIES.map((cat) => (
                          <div
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all duration-200 select-none ${
                              category === cat.id
                                ? "border-primary bg-primary/10 text-primary shadow-sm scale-[0.98]"
                                : "border-border bg-card text-muted-foreground hover:bg-muted hover:border-primary/50"
                            }`}
                          >
                            <cat.icon className="w-5 h-5 mb-2" />
                            <span className="text-xs font-semibold text-center">{cat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-foreground">City</Label>
                      <Input
                        id="city"
                        placeholder="e.g. Mumbai"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-foreground">Address / Street</Label>
                      <Input
                        id="address"
                        placeholder="e.g. MG Road, Near Station"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="locality" className="text-foreground">Locality</Label>
                        <Input
                          id="locality"
                          placeholder="e.g. Andheri East"
                          value={locality}
                          onChange={(e) => setLocality(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode" className="text-foreground">Pincode</Label>
                        <Input
                          id="pincode"
                          placeholder="e.g. 400069"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Map + Photo */}
              <div className="space-y-6 lg:mt-0">
                <Card className="shadow-sm border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-destructive" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-[250px] w-full border border-border rounded-xl overflow-hidden shrink-0 z-0 relative shadow-inner">
                      <MapPicker
                        position={position}
                        setPosition={setPosition}
                        onAddressSelect={(details: any) => {
                          setCity(details.city || "");
                          setAddress(details.address || "");
                          setLocality(details.locality || "");
                          setPincode(details.pincode || "");
                        }}
                      />
                    </div>
                    {position && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 px-3 rounded-md font-mono">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>Lat: {position.lat.toFixed(5)}</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span>Lng: {position.lng.toFixed(5)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Camera className="w-5 h-5 text-destructive" />
                      Photo Evidence
                    </CardTitle>
                    <CardDescription>Upload a clear photo of the issue (required)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <label
                      htmlFor="issue-image-upload"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleIssueDrop}
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                        isDragging
                          ? "border-destructive bg-destructive/10 scale-[1.02]"
                          : "border-border bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                      </div>
                      <input
                        id="issue-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0];
                            setImage(file);
                            setPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    {preview && (
                      <div className="mt-4 relative rounded-xl overflow-hidden border border-border shadow-sm">
                        <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                        <button
                          type="button"
                          onClick={() => { setImage(null); setPreview(null); }}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  form="issue-form"
                  className="w-full py-6 text-base font-semibold shadow-md bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Issue...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Submit Issue Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}