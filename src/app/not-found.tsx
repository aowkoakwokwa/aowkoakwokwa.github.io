export default function NotFound() {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-[#fafafa] text-center">
      <img src="/images/logo.png" alt="Company Logo" className="w-32 mb-6" />
      <h1 className="text-4xl font-bold text-[#333]">Oops! Page Not Found</h1>
      <p className="text-[#666] mt-2">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <a
        href="/dashboard"
        className="mt-6 px-6 py-2 bg-[#000] text-white font-medium rounded-lg shadow-md hover:bg-[#333] transition duration-300"
      >
        Go Back to Home
      </a>
    </div>
  );
}
