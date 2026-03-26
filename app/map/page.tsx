"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const ExploreMap = dynamic(() => import("@/components/ExploreMap"), { ssr: false });

export default function MapPage() {
  return (
    <div className="h-screen w-full relative">
      <div className="absolute top-4 left-4 z-1001">
        <Link href="/feed">
          <Button variant="default" className="shadow-md backdrop-blur-md">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>
      <ExploreMap />
    </div>
  );
}