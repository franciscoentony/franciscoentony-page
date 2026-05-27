import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Header from '../components/Header'

export default function Layout() {
  return (
    <div className="min-h-screen  text-white font-sans">
      <Header/>
      <main className="">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
