import Navbar from "./Navbar";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
