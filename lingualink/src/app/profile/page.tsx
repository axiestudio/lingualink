import { UserProfile, UserButton, SignOutButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <Link href="/settings" className="text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to Settings
          </Link>
          <div className="flex items-center space-x-4">
            <SignOutButton redirectUrl="/">
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Logout
              </button>
            </SignOutButton>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex items-center justify-center py-12">
        <div className="w-full max-w-4xl">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none border border-gray-200"
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}
