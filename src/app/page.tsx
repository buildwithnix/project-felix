'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import CheckoutFlowManager from '@/components/CheckoutFlowManager';

// Define the type for page data
interface PageData {
  title: string;
  description: string;
  heroImageURL?: string;
  initialChargeAmount?: number;
  recurringChargeAmount?: number;
  recurringIntervalDays?: number;
  isDefault: boolean;
}

export default function Home() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pageData, setPageData] = useState<PageData>({
    title: 'Project Felix',
    description: 'A multi-domain Next.js application',
    isDefault: true,
  });

  // Fetch data on the client side
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetch('/api/page-data').then(res => res.json());
        setPageData(data);
      } catch (error) {
        console.error('Error fetching page data:', error);
      }
    }
    fetchData();
  }, []);
  return (
    <CheckoutProvider>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          {/* Display the dynamically fetched product data */}
          <h1 className="text-3xl font-bold">{pageData.title}</h1>
          <p className="text-lg mb-4">{pageData.description}</p>

          {/* Display the product hero image if available */}
          {pageData.heroImageURL ? (
            <Image
              src={pageData.heroImageURL}
              alt={`${pageData.title} hero image`}
              width={400}
              height={300}
              priority
              className="rounded-lg shadow-md"
              unoptimized
            />
          ) : (
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={180}
              height={38}
              priority
              unoptimized
            />
          )}

          {/* Display pricing information if available */}
          {!pageData.isDefault && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Pricing</h2>
              <p>Initial charge: ${pageData.initialChargeAmount}</p>
              <p>
                Recurring charge: ${pageData.recurringChargeAmount} every{' '}
                {pageData.recurringIntervalDays} days
              </p>

              {/* Add checkout button */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="mt-4 w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          )}

          {/* Add checkout button for default view */}
          {pageData.isDefault && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="mt-4 py-2 px-6 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Try Checkout ($4.99)
            </button>
          )}
          <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
            <li className="mb-2 tracking-[-.01em]">
              Get started by editing{' '}
              <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
                src/app/page.tsx
              </code>
              .
            </li>
            <li className="tracking-[-.01em]">Save and see your changes instantly.</li>
          </ol>

          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <a
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={20}
                height={20}
                unoptimized
              />
              Deploy now
            </a>
            <a
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read our docs
            </a>
          </div>
        </main>
        <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden="true"
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
              unoptimized
            />
            Learn
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden="true"
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
              unoptimized
            />
            Examples
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden="true"
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
              unoptimized
            />
            Go to nextjs.org →
          </a>
        </footer>

        {/* Checkout Flow */}
        <CheckoutFlowManager
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          initialAmount={499} // $4.99 in cents
          productName="Shipping Fee"
        />
      </div>
    </CheckoutProvider>
  );
}
