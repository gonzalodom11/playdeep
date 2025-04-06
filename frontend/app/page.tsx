import { Hero } from "@/components";
import Features from '@/components/home/Features';

// import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col dark">
    <main className="flex-grow mt-16">
      <Hero />
      <Features />
    </main>
    </div>  
  );
}
