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
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const stringToSign = paramsToSign + apiSecret;
  
  // Create signature for secure upload
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
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

// Utility function to upload video to Cloudinary
async function uploadVideoToCloudinary(videoFile: File): Promise<string> {
  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials. Please check your .env file.");
  }

  // Create timestamp for signature
  const timestamp = Math.round(Date.now() / 1000);
  
  // Parameters to include in signature (alphabetical order, excluding file and api_key)
  const folder = "jamtem_community/elmnt_videos";
  const resourceType = "video";
  
  // Create parameters object for signature (excluding file, api_key, and resource_type)
  // Note: resource_type is sent in form data but NOT included in signature for video uploads
  const params = {
    folder: folder,
    timestamp: timestamp
  };
  
  // Sort parameters alphabetically and create query string
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key as keyof typeof params]}`)
    .join('&');
  
  // Append API secret to create string to sign
  const stringToSign = sortedParams + apiSecret;
  
  // Create signature for secure upload
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Create form data for Cloudinary upload
  const formData = new FormData();
  formData.append("file", videoFile);
  formData.append("folder", folder);
  formData.append("resource_type", resourceType);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  // Upload to Cloudinary video endpoint
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
  
  const response = await fetch(cloudinaryUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Cloudinary video upload error:", errorData);
    throw new Error(`Cloudinary video upload failed: ${response.status} - ${errorData}`);
  }

  const result = await response.json();
  
  if (!result.secure_url) {
    console.error("Cloudinary video response missing secure_url:", result);
    throw new Error("Cloudinary video upload succeeded but no URL returned");
  }
  
  return result.secure_url; // Return the HTTPS URL
}

// Route definitions for clean URLs
const routes: Record<string, string> = {
  '/': 'desktop.html',
  '/index': 'desktop.html',
  '/join': 'join.html',
  '/products': 'products.html',
  '/collage': 'collage.html',
  '/desktop': 'desktop.html',
  '/collage-desktop': 'collage-desktop.html',
  '/join-desktop': 'join-desktop.html'
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

// Helper function to serve member sharing page
async function serveMemberPage(memberId: string): Promise<Response> {
  try {
    // Fetch member data from Airtable
    const airtableApiKey = Deno.env.get("AIRTABLE_API_KEY");
    const airtableBaseId = Deno.env.get("AIRTABLE_BASE_ID");
    const airtableTableId = Deno.env.get("AIRTABLE_TABLE_ID");

    if (!airtableApiKey || !airtableBaseId || !airtableTableId) {
      throw new Error("Missing Airtable credentials");
    }

    // Fetch specific member by ID
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}/${memberId}`;

    const airtableResponse = await fetch(airtableUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${airtableApiKey}`,
      },
    });

    if (!airtableResponse.ok) {
      if (airtableResponse.status === 404) {
        return new Response('Member not found', { status: 404 });
      }
      throw new Error(`Airtable API error: ${airtableResponse.status}`);
    }

    const result = await airtableResponse.json();

    // Transform member data
    const member = {
      id: result.id,
      first_name: result.fields["First Name"] || "",
      last_name: result.fields["Last Name"] || "",
      craft: result.fields.Craft || "",
      skillEmblems: result.fields.Skill_Emblems || [],
      location: result.fields.Location || "",
      instagram: result.fields.Instagram || "",
      bio: result.fields.Bio || "",
      imageUrl: result.fields.Image && result.fields.Image[0] ? result.fields.Image[0].url : null,
      backgroundImageUrl: result.fields["Background Image"] && result.fields["Background Image"][0] ? result.fields["Background Image"][0].url : null,
      elmntVideoUrl: result.fields.ELMNT && result.fields.ELMNT[0] ? result.fields.ELMNT[0].url : null
    };

    if (!member.imageUrl) {
      return new Response('Member profile not available', { status: 404 });
    }

    // Generate HTML for member sharing page
    const html = generateMemberPageHTML(member);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error serving member page:', error);
    return new Response('Error loading member profile', { status: 500 });
  }
}

// Generate HTML for member sharing page
function generateMemberPageHTML(member: any): string {
  const fullName = `${member.first_name} ${member.last_name}`.trim();
  const craftText = Array.isArray(member.craft) ? member.craft.join(', ') : member.craft;
  const shareUrl = `https://jamtemworld.com/member/${member.id}`;
  const shareText = `Check out ${member.first_name}'s creative profile on JAMTEM! ${shareUrl} #JAMTEM`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fullName} - JAMTEM Community</title>
    <meta name="description" content="Discover ${fullName}, a ${craftText} in the JAMTEM creative community.">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="profile">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:title" content="${fullName} - JAMTEM Community">
    <meta property="og:description" content="Discover ${fullName}, a ${craftText} in the JAMTEM creative community.">
    <meta property="og:image" content="${member.imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${shareUrl}">
    <meta property="twitter:title" content="${fullName} - JAMTEM Community">
    <meta property="twitter:description" content="Discover ${fullName}, a ${craftText} in the JAMTEM creative community.">
    <meta property="twitter:image" content="${member.imageUrl}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/desktop.css">
    <link rel="stylesheet" href="/css/join-components.css">
    <style>
        .share-buttons {
            position: fixed;
            top: 5px;
            left: 5px;
            display: flex;
            flex-direction: rows;
            gap: 10px;
            z-index: 3000;
        }
        .share-button {
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.3s;
            width: 30px;
            height: 30px;
        }
        .share-button:hover {
            background: rgba(0, 0, 0, 0.9);
        }
        .share-button.instagram { background: #E4405F; }
        .share-button.twitter { background: #1DA1F2; }
        .share-button.facebook { background: #1877F2; }
        .share-button.copy { background: #0078d4; }

        /* Desktop Modal Styles */
        .desktop-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)),
                        url('https://storage.googleapis.com/jamtem_website_media/cloud_bg_2.jpg');
            background-size: 200%;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            overflow: hidden;
            z-index: 1;
        }
    </style>
</head>
<body>
    <!-- Desktop Background -->
    <div class="desktop-modal">
        <!-- 3D Sphere Background -->
        <div id="sphere-container" class="sphere-container">
            <canvas id="sphere-canvas" class="sphere-canvas"></canvas>
        </div>

        <!-- Member Modal (exact copy from desktop.html) -->
        <div id="member-modal" class="modal-overlay" style="display: flex;">
                    <button class="modal-close" id="modal-close">&times;</button>

        <div class="modal-container">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="card_name_shape">
                        <img src="/media/images/jamtem_card_shape.png" alt="" class="name_corner">                    <h2 id="modal-member-name" class="modal-member-name"></h2>
                        <h2 id="modal-member-name" class="modal-member-name"></h2>
                    </div>
                    <div class="header_emblems" id="modal-emblems">
                        <!-- Emblems will be populated by JavaScript -->
                    </div>
                </div>
                <div class="modal-image-section">
                    <div class="modal-image-container">
                        <img id="modal-member-image" class="modal-member-image" src="" alt="">

                        <img src="/media/images/member_pic_border.png" alt="" class="member_pic_border"></div>
                </div>
                <div class="modal-info-section">
                    <div class="modal-member-details">
                        <div class="location_instagram">
                            <div class="modal-location" id="modal-location-section" style="display: none;">
                                <img src="/media/images/location_icon_black.png" alt="" class="icon">
                                <span id="modal-member-location"></span>
                            </div>
                            <div class="modal-instagram" id="modal-instagram-section" style="display: none;">
                                <img src="/media/images/instagram_black_icon.png" alt="" class="icon">
                                <span id="modal-member-instagram"></span>
                            </div>
                        </div>
                        <div class="modal-bio">
                            <strong>About:</strong>
                            <p id="modal-member-bio"></p>
                        </div>
                        <p id="modal-member-craft" class="modal-member-craft"></p>

                    </div>
                </div>
            </div>
        </div>
    </div>

        <!-- Social Share Buttons -->
        <div class="share-buttons">
            <button class="share-button copy" onclick="copyToClipboard('${shareUrl}')">📋</button>
            <button class="share-button twitter" onclick="shareToTwitter('${encodeURIComponent(shareText)}')">X</button>
            <button class="share-button facebook" onclick="shareToFacebook('${shareUrl}', '${encodeURIComponent(fullName + ' - JAMTEM Community')}')">FB</button>
            <button class="share-button instagram" onclick="shareToInstagram()">IG</button>
        </div>
    </div>

    <script>
        // Skill emblems data for shareable pages
        const SKILL_EMBLEMS = [
            { id: 'activism', title: 'Activism', image: '/media/emblems/emblem_activism.png' },
            { id: 'art', title: 'Art', image: '/media/emblems/emblem_art.png' },
            { id: 'culinary_arts', title: 'Culinary Arts', image: '/media/emblems/emblem_culinary_arts.png' },
            { id: 'fashion', title: 'Fashion', image: '/media/emblems/emblem_fashion.png' },
            { id: 'film', title: 'Film', image: '/media/emblems/emblem_film.png' },
            { id: 'graphic_design', title: 'Graphic Design', image: '/media/emblems/emblem_graphic_design.png' },
            { id: 'music', title: 'Music', image: '/media/emblems/emblem_music.png' },
            { id: 'performance_arts', title: 'Performance Arts', image: '/media/emblems/emblem_performance_arts.png' },
            { id: 'photography', title: 'Photography', image: '/media/emblems/emblem_photography.png' },
            { id: 'sports', title: 'Sports', image: '/media/emblems/emblem_sports.png' },
            { id: 'writing', title: 'Writing', image: '/media/emblems/emblem_writing.png' }
        ];

        // Populate member modal with data
        document.addEventListener('DOMContentLoaded', function() {
            const memberData = ${JSON.stringify(member).replace(/</g, '\\u003c')};

            // Set modal content
            const modalImage = document.getElementById('modal-member-image');
            const modalName = document.getElementById('modal-member-name');
            const modalCraft = document.getElementById('modal-member-craft');
            const modalBio = document.getElementById('modal-member-bio');
            const modalLocation = document.getElementById('modal-member-location');
            const modalLocationSection = document.getElementById('modal-location-section');
            const modalInstagram = document.getElementById('modal-member-instagram');
            const modalInstagramSection = document.getElementById('modal-instagram-section');
            const modalContainer = document.querySelector('.modal-container');

            // Set background image for modal container with dark overlay
            if (memberData.backgroundImageUrl && modalContainer) {
                modalContainer.style.backgroundImage = \`linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(\${memberData.backgroundImageUrl})\`;
                modalContainer.style.backgroundSize = 'cover';
                modalContainer.style.backgroundPosition = 'center';
                modalContainer.style.backgroundRepeat = 'no-repeat';
            } else if (memberData.imageUrl && modalContainer) {
                // Use profile image as background if no background image is provided
                modalContainer.style.backgroundImage = \`linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(\${memberData.imageUrl})\`;
                modalContainer.style.backgroundSize = 'cover';
                modalContainer.style.backgroundPosition = 'center';
                modalContainer.style.backgroundRepeat = 'no-repeat';
            } else if (modalContainer) {
                // Clear background image if no images are available
                modalContainer.style.backgroundImage = '';
                modalContainer.style.backgroundSize = '';
                modalContainer.style.backgroundPosition = '';
                modalContainer.style.backgroundRepeat = '';
            }

            // Set image
            if (modalImage && memberData.imageUrl) {
                modalImage.src = memberData.imageUrl;
                modalImage.style.display = 'block';
            }

            // Set name
            if (modalName) {
                modalName.textContent = memberData.first_name || 'Unknown';
            }

            // Set craft
            if (modalCraft) {
                let craftText = 'Creator';
                if (memberData.craft) {
                    if (Array.isArray(memberData.craft)) {
                        craftText = memberData.craft.join(', ');
                    } else {
                        craftText = memberData.craft.toString();
                    }
                }
                modalCraft.textContent = craftText;
            }

            // Set bio
            if (modalBio) {
                modalBio.textContent = memberData.bio || 'No bio available';
            }

            // Set location
            if (memberData.location && memberData.location.trim() && modalLocation && modalLocationSection) {
                modalLocation.textContent = memberData.location;
                modalLocationSection.style.display = 'flex';
            } else if (modalLocationSection) {
                modalLocationSection.style.display = 'none';
            }

            // Set Instagram
            if (memberData.instagram && memberData.instagram.trim() && modalInstagram && modalInstagramSection) {
                modalInstagram.textContent = memberData.instagram;
                modalInstagramSection.style.display = 'flex';
            } else if (modalInstagramSection) {
                modalInstagramSection.style.display = 'none';
            }

            // Handle Skill Emblems
            const modalEmblems = document.getElementById('modal-emblems');
            if (modalEmblems) {
                modalEmblems.innerHTML = '';

                // Only show emblems if the member actually has skill emblems selected
                if (memberData.skillEmblems && Array.isArray(memberData.skillEmblems) && memberData.skillEmblems.length > 0) {
                    memberData.skillEmblems.forEach(emblemTitle => {
                        // Find the corresponding emblem data
                        const emblemData = SKILL_EMBLEMS.find(e => e.title === emblemTitle);
                        if (emblemData) {
                            const img = document.createElement('img');
                            img.src = emblemData.image;
                            img.alt = emblemData.title;
                            img.className = 'emblem';
                            img.title = emblemData.title; // Tooltip on hover

                            modalEmblems.appendChild(img);
                        }
                    });
                }
            }
        });

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Link copied to clipboard!');
            });
        }

        function shareToTwitter(text) {
            window.open('https://twitter.com/intent/tweet?text=' + text, '_blank');
        }

        function shareToFacebook(url, title) {
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '&quote=' + title, '_blank');
        }

        function shareToInstagram() {
            // Instagram doesn't support direct web sharing, so copy to clipboard
            copyToClipboard('${shareUrl}');
            alert('Link copied! You can now paste it in Instagram.');
        }
    </script>
</body>
</html>`;
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

  // Handle dynamic member sharing route
  if (pathname.startsWith('/member/')) {
    const memberId = pathname.split('/member/')[1];
    if (memberId) {
      return await serveMemberPage(memberId);
    }
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

    // Handle collage data retrieval from Airtable
    if (pathname === "/api/collage") {
      if (req.method !== "GET") {
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

        // Fetch all records from Airtable
        const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}`;
        
        const airtableResponse = await fetch(airtableUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${airtableApiKey}`,
          },
        });

        if (!airtableResponse.ok) {
          const errorData = await airtableResponse.json();
          console.error("Airtable API error:", errorData);
          throw new Error(`Airtable API error: ${airtableResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const result = await airtableResponse.json();
        
        // Transform the data to a cleaner format for the frontend
        const members = result.records.map((record: any) => ({
          id: record.id,
          first_name: record.fields["First Name"] || "",
          last_name: record.fields["Last Name"] || "",
          craft: record.fields.Craft || "",
          skillEmblems: record.fields.Skill_Emblems || [],
          location: record.fields.Location || "",
          instagram: record.fields.Instagram || "",
          bio: record.fields.Bio || "",
          imageUrl: record.fields.Image && record.fields.Image[0] ? record.fields.Image[0].url : null,
          backgroundImageUrl: record.fields["Background Image"] && record.fields["Background Image"][0] ? record.fields["Background Image"][0].url : null,
          elmntVideoUrl: record.fields.ELMNT && record.fields.ELMNT[0] ? record.fields.ELMNT[0].url : null
        })).filter((member: any) => member.imageUrl); // Only include members with images

        return new Response(
          JSON.stringify({ 
            success: true, 
            members: members,
            count: members.length
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );

      } catch (error) {
        console.error("Error fetching collage data:", error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch community members. Please try again.",
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
        const firstName = formData.get("first_name")?.toString().trim();
        const lastName = formData.get("last_name")?.toString().trim();
        const email = formData.get("email")?.toString().trim();
        const craftData = formData.get("craft")?.toString().trim();
        const location = formData.get("location")?.toString().trim();
        const bio = formData.get("bio")?.toString().trim();
        const website = formData.get("website")?.toString().trim();
        const instagram = formData.get("instagram")?.toString().trim();
        const skillEmblemsData = formData.get("skill_emblems")?.toString().trim();
        const imageFile = formData.get("image") as File;
        const backgroundImageFile = formData.get("background-image") as File;
        const elmntVideoFile = formData.get("elmnt-video") as File;

        // Process craft field - convert comma-separated string to array for Airtable multi-select
        const craftArray = craftData ? craftData.split(',').map(item => item.trim()).filter(item => item) : [];

        // Process skill emblems field - convert comma-separated string to array for Airtable multi-select
        const skillEmblemsArray = skillEmblemsData ? skillEmblemsData.split(',').map(item => item.trim()).filter(item => item) : [];

        // Validate required fields
        if (!firstName || !email || !craftData || craftArray.length === 0 || !bio || !skillEmblemsData || skillEmblemsArray.length === 0) {
          return new Response(
            JSON.stringify({
              error: "Missing required fields: first name, email, craft (at least one), skill emblems (at least one), and bio are required."
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

        // Validate file type for main image
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

        // Validate file size for main image (10MB limit)
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

        // Validate background image file if provided
        if (backgroundImageFile && backgroundImageFile.size > 0) {
          if (!backgroundImageFile.type.startsWith('image/')) {
            return new Response(
              JSON.stringify({ 
                error: "Background image must be an image file." 
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

          if (backgroundImageFile.size > maxSize) {
            return new Response(
              JSON.stringify({ 
                error: "Background image must be smaller than 10MB." 
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
        }

        // Validate ELMNT video file if provided
        if (elmntVideoFile && elmntVideoFile.size > 0) {
          if (!elmntVideoFile.type.startsWith('video/')) {
            return new Response(
              JSON.stringify({ 
                error: "ELMNT file must be a video file." 
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

          // Video files can be larger - 100MB limit
          const videoMaxSize = 100 * 1024 * 1024; // 100MB
          if (elmntVideoFile.size > videoMaxSize) {
            return new Response(
              JSON.stringify({ 
                error: "ELMNT video must be smaller than 100MB." 
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
        }

        // Upload main image to Cloudinary first
        console.log("Uploading image to Cloudinary...");
        const cloudinaryUrl = await uploadToCloudinary(imageFile);
        console.log("Image uploaded successfully:", cloudinaryUrl);

        // Upload background image to Cloudinary if provided
        let backgroundCloudinaryUrl = null;
        if (backgroundImageFile && backgroundImageFile.size > 0) {
          console.log("Uploading background image to Cloudinary...");
          backgroundCloudinaryUrl = await uploadToCloudinary(backgroundImageFile);
          console.log("Background image uploaded successfully:", backgroundCloudinaryUrl);
        }

        // Upload ELMNT video to Cloudinary if provided
        let elmntVideoUrl = null;
        if (elmntVideoFile && elmntVideoFile.size > 0) {
          console.log("Uploading ELMNT video to Cloudinary...");
          elmntVideoUrl = await uploadVideoToCloudinary(elmntVideoFile);
          console.log("ELMNT video uploaded successfully:", elmntVideoUrl);
        }
        
        // Prepare Airtable record data with Cloudinary URLs
        const recordData: {
          fields: Record<string, any>
        } = {
          fields: {
            "First Name": firstName,
            "Last Name": lastName || "",
            "Email": email,
            "Craft": craftArray, // Send as array for Airtable multi-select field
            "Skill_Emblems": skillEmblemsArray, // Send as array for Airtable multi-select field
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

        // Add background image if provided
        if (backgroundCloudinaryUrl) {
          recordData.fields["Background Image"] = [
            {
              "url": backgroundCloudinaryUrl
            }
          ];
        }

        // Add ELMNT video if provided
        if (elmntVideoUrl) {
          recordData.fields["ELMNT"] = [
            {
              "url": elmntVideoUrl
            }
          ];
        }

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
