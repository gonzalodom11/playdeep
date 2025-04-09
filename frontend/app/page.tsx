import { Hero } from "@/components";
import Footer from "@/components/footer/Footer";
import Navbar from "@/components/header/Navbar";
import Features from '@/components/home/Features';

// import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col navbar-dark">
      <Navbar />   
    <main className="flex-grow mt-16">
      <Hero />
      <Features />
    </main>
      <Footer />
    </div>  
  );
}
