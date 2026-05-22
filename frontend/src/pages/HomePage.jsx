import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Clock3, Gavel, History, ShieldCheck, Store, UserRound } from "lucide-react";

const customerSteps = [
  { title: "Create a customer account", description: "Sign up, browse active auctions, and open any listing to inspect the item and bid history." },
  { title: "Place your bid", description: "Enter a valid amount above the current price and keep track of the countdown as the auction progresses." },
  { title: "Track wins and history", description: "Your dashboard keeps your bid history, won auctions, and participation stats in one place." },
];

const vendorSteps = [
  { title: "Register as a vendor", description: "Create a seller profile and prepare item details, image, minimum price, and auction schedule." },
  { title: "Submit for review", description: "Every new listing goes through admin review before buyers can bid on it." },
  { title: "Manage the auction", description: "Edit eligible listings, request controlled changes when needed, and lock a winning bid when allowed." },
];

const features = [
  { icon: BadgeCheck, title: "Reviewed listings", description: "Admins approve vendor listings before they become visible to bidders." },
  { icon: Gavel, title: "Live bidding", description: "Customers can place bids on active auctions and immediately see updated bid history." },
  { icon: Clock3, title: "Popcorn bidding", description: "Late bids can extend an auction once, helping reduce last-second sniping." },
  { icon: History, title: "Bid records", description: "Customers can review their bid history and vendors can monitor auction outcomes." },
  { icon: Store, title: "Vendor controls", description: "Vendors can manage listings, cancellations, lock actions, and change requests." },
  { icon: ShieldCheck, title: "Admin oversight", description: "Admins can inspect listings, approve auctions, and decide vendor change requests." },
];

export default function HomePage() {
  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-20">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
              Online auction platform
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              A clearer way to list, review, bid, and close auctions.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              AuctionHub brings customers, vendors, and admins into one organized auction flow. Buyers discover live listings, vendors submit and manage items, and admins keep the marketplace reviewed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Sign up
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100">
                Login
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-sm text-slate-300">Auction flow</p>
              <div className="mt-4 space-y-3">
                {["Vendor submits listing", "Admin reviews details", "Customers place bids", "Winner is recorded"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-md bg-white px-3 py-3 text-slate-950">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">{index + 1}</span>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold text-slate-950">Choose your path</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">The app changes around your role, so every user sees the actions that matter to them.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ProcessCard icon={UserRound} title="For customers" steps={customerSteps} actionLabel="Register as customer" actionTo="/register" />
          <ProcessCard icon={Store} title="For vendors" steps={vendorSteps} actionLabel="Register as vendor" actionTo="/register" />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-semibold text-slate-950">What the system supports</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">A practical feature set for running reviewed auctions from listing to outcome.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <feature.icon className="h-6 w-6 text-slate-700" />
                <h3 className="mt-4 font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">AuctionHub</p>
            <p className="mt-1 text-sm text-slate-400">A reviewed auction workflow for buyers, vendors, and admins.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to="/login" className="hover:text-white">Login</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProcessCard({ icon: Icon, title, steps, actionLabel, actionTo }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <div key={step.title} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">{index + 1}</span>
            <div>
              <p className="text-sm font-semibold text-slate-950">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <Link to={actionTo} className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
