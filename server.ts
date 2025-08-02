import { serveDir } from "@std/http/file-server";
import { load } from "@std/dotenv";

// Load environment variables
await load({ export: true });

// Utility function to upload image to Cloudinary
async function uploadToCloudinary(imageFile: File): Promise<string> {
  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials. Please check your .env file.");
  }

  // Create timestamp for signature
  const timestamp = Math.round(Date.now() / 1000);
  
  // Parameters to include in signature (alphabetical order, excluding file and api_key)
  const folder = "jamtem_community";
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  
  // Create signature for secure upload
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Create form data for Cloudinary upload
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("folder", folder);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  // Upload to Cloudinary
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  
  const response = await fetch(cloudinaryUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Cloudinary upload error:", errorData);
    throw new Error(`Cloudinary upload failed: ${response.status} - ${errorData}`);
  }

  const result = await response.json();
  
  if (!result.secure_url) {
    console.error("Cloudinary response missing secure_url:", result);
    throw new Error("Cloudinary upload succeeded but no URL returned");
  }
  
  return result.secure_url; // Return the HTTPS URL
}

// Route definitions for clean URLs
const routes: Record<string, string> = {
  '/': 'index.html',
  '/index': 'index.html',
  '/join': 'join.html',
  '/products': 'products.html'
};

// Helper function to serve HTML files with proper headers
async function serveHtmlFile(filePath: string): Promise<Response> {
  try {
    const fullPath = `public/${filePath}`;
    const file = await Deno.readFile(fullPath);
    return new Response(file, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error(`Error serving ${filePath}:`, error);
    return new Response('Page not found', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

const PORT = 8000;

console.log(`🚀 Starting Deno server on http://localhost:${PORT}`);
console.log(`📁 Serving static files from ./public directory`);
console.log(`🔗 Server-side routing enabled for: ${Object.keys(routes).join(', ')}`);

Deno.serve({ port: PORT }, async (req: Request) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Handle redirects for legacy .html URLs
  if (pathname === '/index.html') {
    return Response.redirect(new URL('/', url.origin), 301);
  }
  if (pathname === '/join.html') {
    return Response.redirect(new URL('/join', url.origin), 301);
  }
  if (pathname === '/products.html') {
    return Response.redirect(new URL('/products', url.origin), 301);
  }

  // Handle server-side routes
  if (routes[pathname]) {
    return await serveHtmlFile(routes[pathname]);
  }

  // Handle API routes for Shopify integration
  if (pathname.startsWith("/api/")) {
    // CORS headers for API requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Get shop configuration
    if (pathname === "/api/config") {
      const shopDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
      
      return new Response(
        JSON.stringify({ 
          shopDomain: shopDomain || null
        }),
        { 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Handle join form submission to Airtable
    if (pathname === "/api/join") {
      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { 
            status: 405, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders 
            } 
          }
        );
      }

      try {
        const airtableApiKey = Deno.env.get("AIRTABLE_API_KEY");
        const airtableBaseId = Deno.env.get("AIRTABLE_BASE_ID");
        const airtableTableId = Deno.env.get("AIRTABLE_TABLE_ID");

        if (!airtableApiKey || !airtableBaseId || !airtableTableId) {
          return new Response(
            JSON.stringify({ 
              error: "Missing Airtable credentials. Please check your .env file." 
            }),
            { 
              status: 500, 
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders 
              } 
            }
          );
        }

        // Parse multipart form data
        const formData = await req.formData();
        
        // Extract form fields
        const name = formData.get("name")?.toString().trim();
        const email = formData.get("email")?.toString().trim();
        const craft = formData.get("craft")?.toString().trim();
        const location = formData.get("location")?.toString().trim();
        const bio = formData.get("bio")?.toString().trim();
        const website = formData.get("website")?.toString().trim();
        const instagram = formData.get("instagram")?.toString().trim();
        const imageFile = formData.get("image") as File;

        // Validate required fields
        if (!name || !email || !craft || !bio) {
          return new Response(
            JSON.stringify({ 
              error: "Missing required fields: name, email, craft, and bio are required." 
            }),
            { 
              status: 400, 
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders 
              } 
            }
          );
        }

        // Validate image file
        if (!imageFile || imageFile.size === 0) {
          return new Response(
            JSON.stringify({ 
              error: "Image file is required." 
            }),
            { 
              status: 400, 
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders 
              } 
            }
          );
        }

        // Validate file type
        if (!imageFile.type.startsWith('image/')) {
          return new Response(
            JSON.stringify({ 
              error: "Only image files are allowed." 
            }),
            { 
              status: 400, 
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders 
              } 
            }
          );
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (imageFile.size > maxSize) {
          return new Response(
            JSON.stringify({ 
              error: "Image file must be smaller than 10MB." 
            }),
            { 
              status: 400, 
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders 
              } 
            }
          );
        }

        // Upload image to Cloudinary first
        console.log("Uploading image to Cloudinary...");
        const cloudinaryUrl = await uploadToCloudinary(imageFile);
        console.log("Image uploaded successfully:", cloudinaryUrl);
        
        // Prepare Airtable record data with Cloudinary URL
        const recordData = {
          fields: {
            "Name": name,
            "Email": email,
            "Craft": craft,
            "Location": location || "",
            "Bio": bio,
            "Website": website || "",
            "Instagram": instagram ? `@${instagram}` : "",
            "Image": [
              {
                "url": cloudinaryUrl
              }
            ]
          }
        };

        // Submit to Airtable
        const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}`;
        
        const airtableResponse = await fetch(airtableUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${airtableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recordData),
        });

        if (!airtableResponse.ok) {
          const errorData = await airtableResponse.json();
          console.error("Airtable API error:", errorData);
          throw new Error(`Airtable API error: ${airtableResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const result = await airtableResponse.json();
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Successfully joined JAMTEM community!",
            recordId: result.id 
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );

      } catch (error) {
        console.error("Error submitting to Airtable:", error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to submit application. Please try again.",
            details: error instanceof Error ? error.message : String(error)
          }),
          { 
            status: 500, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders 
            } 
          }
        );
      }
    }

    // Proxy Shopify API requests to avoid CORS issues
    if (pathname === "/api/products") {
      try {
        const shopDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
        const accessToken = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
        const apiVersion = Deno.env.get("SHOPIFY_API_VERSION");

        if (!shopDomain || !accessToken || !apiVersion) {
          return new Response(
            JSON.stringify({ 
              error: "Missing Shopify credentials. Please check your .env file." 
            }),
            { 
              status: 500, 
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders 
              } 
            }
          );
        }

        const shopifyUrl = `https://${shopDomain}/api/${apiVersion}/graphql.json`;
        
        // GraphQL query to fetch products
        const query = `
          query getProducts($first: Int!) {
            products(first: $first) {
              edges {
                node {
                  id
                  title
                  handle
                  description
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  images(first: 5) {
                    edges {
                      node {
                        url
                        altText
                        width
                        height
                      }
                    }
                  }
                  variants(first: 10) {
                    edges {
                      node {
                        id
                        title
                        availableForSale
                        priceV2 {
                          amount
                          currencyCode
                        }
                        selectedOptions {
                          name
                          value
                        }
                      }
                    }
                  }
                  availableForSale
                  tags
                  productType
                  vendor
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `;

        const shopifyResponse = await fetch(shopifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query,
            variables: { first: 50 }
          }),
        });

        if (!shopifyResponse.ok) {
          throw new Error(`Shopify API error: ${shopifyResponse.status}`);
        }

        const data = await shopifyResponse.json();
        
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });

      } catch (error) {
        console.error("Error fetching products:", error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch products from Shopify",
            details: error instanceof Error ? error.message : String(error)
          }),
          { 
            status: 500, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders 
            } 
          }
        );
      }
    }
  }

  // Serve static files from public directory
  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: false,
    enableCors: true,
  });
});
