import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';
import { sanityClient, groq } from '@/lib/sanityClient';

// This function is similar to the getData function in page.tsx
// but adapted for API route usage
async function getData() {
  try {
    // Get the hostname from the request headers
    const headersList = await headers();
    const hostname = headersList.get('x-hostname') || 'localhost';
    
    // Query Supabase to get the product identifier for this domain
    const { data: domainMapping, error: supabaseError } = await supabase
      .from('domain_mappings')
      .select('product_identifier_sanity')
      .eq('domain_name', hostname)
      .single();
    
    if (supabaseError) {
      console.error('Supabase query error:', supabaseError);
      return {
        title: "Project Felix",
        description: "A multi-domain Next.js application",
        isDefault: true
      };
    }
    
    // If no mapping found, return default data
    if (!domainMapping) {
      return {
        title: "Project Felix",
        description: "A multi-domain Next.js application",
        isDefault: true
      };
    }
    
    // Query Sanity to get the product data
    const productIdentifier = domainMapping.product_identifier_sanity;
    const query = groq`*[_type == "product" && productIdentifier.current == $productIdentifier][0]{
      productName,
      heroImageURL,
      description,
      initialChargeAmount,
      recurringChargeAmount,
      recurringIntervalDays
    }`;
    
    const product = await sanityClient.fetch(query, { productIdentifier });
    
    // If no product found, return default data
    if (!product) {
      return {
        title: "Project Felix",
        description: "A multi-domain Next.js application",
        isDefault: true
      };
    }
    
    // Return the product data
    return {
      title: product.productName,
      description: product.description,
      heroImageURL: product.heroImageURL,
      initialChargeAmount: product.initialChargeAmount,
      recurringChargeAmount: product.recurringChargeAmount,
      recurringIntervalDays: product.recurringIntervalDays,
      isDefault: false
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      title: "Project Felix",
      description: "A multi-domain Next.js application",
      isDefault: true
    };
  }
}

export async function GET() {
  const data = await getData();
  return NextResponse.json(data);
}