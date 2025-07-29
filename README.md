# Jamtem World - Shopify Ecommerce Site

A modern ecommerce site built with Deno 2, vanilla JavaScript, HTML, and CSS that integrates with the Shopify Storefront API to display live products in a responsive grid layout.

## Features

- **Responsive Grid Layout**: Automatically adapts from 1 column (mobile) to 4+ columns (desktop)
- **Live Shopify Integration**: Fetches real-time product data from your Shopify store
- **Modern Design**: Clean, professional design with hover effects and smooth transitions
- **Performance Optimized**: Lazy loading images, efficient CSS Grid, and minimal JavaScript
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Error Handling**: Comprehensive error handling with retry functionality

## Tech Stack

- **Backend**: Deno 2 with standard library
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **API**: Shopify Storefront API (GraphQL)
- **Styling**: CSS Grid, Flexbox, CSS Variables

## Project Structure

```
jamtem_world_site/
├── .env                    # Shopify API credentials
├── server.ts              # Deno server with API proxy
├── deno.json              # Deno configuration
├── public/
│   ├── index.html         # Main product page
│   ├── css/
│   │   └── styles.css     # Responsive styles
│   └── js/
│       └── products.js    # Shopify API integration
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- [Deno 2](https://deno.land/) installed on your system
- A Shopify store with products
- Shopify custom app with Storefront API access

### 2. Get Shopify Credentials

1. Go to your Shopify admin → **Settings** → **Apps and sales channels**
2. Click **"Develop apps"** → **"Create custom app"**
3. Configure **Storefront API scopes** (minimal scopes needed for product display)
4. Click **"Install app"** and confirm installation
5. Navigate to **"API credentials"** and copy the **Storefront API access token**

### 3. Get Cloudinary Credentials (for Community Join Form)

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com)
2. Go to your Dashboard after signing up
3. Copy your **Cloud Name**, **API Key**, and **API Secret**

### 4. Environment Configuration

1. Copy the `.env` file and update with your credentials:

```env
# Shopify Configuration
SHOPIFY_STORE_DOMAIN=your-shop-name.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-access-token-here
SHOPIFY_API_VERSION=2024-07

# Airtable Configuration (for community join form)
AIRTABLE_API_KEY=your-airtable-api-key
AIRTABLE_BASE_ID=your-airtable-base-id
AIRTABLE_TABLE_ID=your-airtable-table-id

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### 5. Run the Application

```bash
# Start the development server
deno task dev

# Or run directly
deno run --allow-net --allow-read --allow-env server.ts
```

The site will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Main product page
- `GET /api/products` - Shopify products API proxy (handles CORS)

## Product Data Displayed

Each product card shows:
- Product image (with fallback for missing images)
- Product title
- Description (truncated to 150 characters)
- Price range (single price or min-max range)
- Availability status (In Stock/Out of Stock)
- Product tags (first 3 tags)
- Vendor information
- Hover effects and click interactions

## Responsive Breakpoints

- **Mobile**: `< 480px` - Single column layout
- **Tablet**: `480px - 768px` - 2-3 columns
- **Desktop**: `> 768px` - 3-4+ columns (auto-fit based on screen size)
- **Large screens**: `> 1400px` - Optimized spacing and larger cards

## Browser Support

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers with CSS Grid support

## Development

### File Structure

- **server.ts**: Deno server that serves static files and proxies Shopify API requests
- **public/index.html**: Main HTML structure with semantic markup
- **public/css/styles.css**: Responsive CSS with CSS Grid, variables, and modern features
- **public/js/products.js**: JavaScript class for API integration and DOM manipulation

### Key Features

- **CSS Grid**: Uses `auto-fit` and `minmax()` for responsive columns
- **Error Handling**: Comprehensive error states with retry functionality
- **Loading States**: Spinner animation while fetching data
- **Image Optimization**: Lazy loading and error handling for product images
- **Accessibility**: Proper ARIA labels, focus states, and keyboard navigation

## Troubleshooting

### Common Issues

1. **"Missing Shopify credentials" error**
   - Check your `.env` file has the correct values
   - Ensure your Shopify custom app is installed and active

2. **CORS errors**
   - The server includes a built-in API proxy to handle CORS
   - Make sure you're accessing the site through the Deno server, not opening HTML directly

3. **No products showing**
   - Verify your Shopify store has published products
   - Check the browser console for API errors
   - Ensure your Storefront API token has the correct permissions

4. **Images not loading**
   - Shopify images should load automatically
   - Check if your store has product images uploaded

### Debug Mode

Open browser developer tools to see:
- Network requests to `/api/products`
- Console logs for API responses
- Any JavaScript errors

## Docker Deployment

### Using Docker Hub Image

The application is available as a pre-built Docker image on Docker Hub:

```bash
# Pull and run the latest image
docker run -d \
  --name jamtem-world-site \
  -p 8000:8000 \
  --env-file .env \
  jamtem/jamtem-world-site:latest
```

### Using Docker Compose (Recommended)

```bash
# Start the application with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Building Your Own Image

```bash
# Build the Docker image locally
docker build -t jamtem/jamtem-world-site:latest .

# Run the locally built image
docker run -d \
  --name jamtem-world-site \
  -p 8000:8000 \
  --env-file .env \
  jamtem/jamtem-world-site:latest
```

### Docker Image Details

- **Base Image**: `denoland/deno:latest`
- **Exposed Port**: `8000`
- **Working Directory**: `/app`
- **User**: `denouser` (non-root for security)
- **Health Check**: Monitors `/api/config` endpoint
- **Restart Policy**: `unless-stopped`

### Environment Variables for Docker

All environment variables from your `.env` file are automatically loaded when using `--env-file .env` or docker-compose.

## Production Deployment

### Docker Hub Repository

The image is published to: `jamtem/jamtem-world-site:latest`

### Deployment Options

1. **Local Development**: Use `docker-compose up -d`
2. **Cloud Platforms**: Deploy to AWS ECS, Google Cloud Run, Azure Container Instances
3. **Kubernetes**: Use the provided image in your K8s deployments
4. **VPS/Dedicated Servers**: Use Docker or docker-compose

### Scaling Considerations

- The application is stateless and can be horizontally scaled
- Use a load balancer for multiple container instances
- Consider using Redis for session storage if needed
- Database connections are handled per request (no persistent connections)

## Future Enhancements

- Product filtering and sorting
- Search functionality
- Product detail pages
- Shopping cart integration
- Customer authentication
- Pagination for large catalogs
- Kubernetes deployment manifests
- CI/CD pipeline integration

## License

This project is open source and available under the [MIT License](LICENSE).
