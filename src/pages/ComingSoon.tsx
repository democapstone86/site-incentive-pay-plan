import { Link } from "react-router-dom";

const ComingSoon = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F9FB] text-center px-6">
      <img
        src="assets/capstone-logo-white.png"
        alt="Capstone Logisitics"
        className="h-12 mb-6"
      />
      <h1 className="text-3xl font-semibold text-[#1072BE] mb-4">
        🚧 Coming Soon
      </h1>
      <p className="text-slate-600 max-w-md mb-8">
        This feature is under development and will be available in a future
        update. Stay tuned!
      </p>
      <Link
        to="/"
        className="rounded-md bg-[#1072BE] px-4 py-2 text-white text-sm font-medium hover:bg-[#0E66AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring=[#1072BE]/50"
      >
        Return Home
      </Link>
    </div>
  );
};

export default ComingSoon;
