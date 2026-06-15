export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          © {new Date().getFullYear()} Document Management System. All rights
          reserved.
        </div>

        <div className="flex items-center gap-4 text-sm">
          <a href="/about" className="text-gray-600 hover:text-blue-600">
            About
          </a>

          <a href="/contact" className="text-gray-600 hover:text-blue-600">
            Contact
          </a>

          <a href="/privacy" className="text-gray-600 hover:text-blue-600">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
