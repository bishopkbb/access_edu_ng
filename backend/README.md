# Scholarship Backend Service

A Node.js backend service for automated scholarship collection and web scraping. This service provides APIs for fetching scholarships from external sources, including web scraping, RSS feeds, and external APIs.

## Features

- **Web Scraping**: Automatically scrape scholarship data from various websites
- **RSS Feed Parsing**: Parse RSS feeds for scholarship updates
- **External API Integration**: Connect to external scholarship APIs
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Security**: Helmet.js for security headers and CORS protection
- **Scheduled Automation**: Cron jobs for automatic data collection
- **Nigerian Focus**: Specialized filtering for Nigerian-relevant scholarships

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:5174
NODE_ENV=development
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status and timestamp

### External Scholarship Fetching
- **POST** `/api/scholarships/fetch-external`
- Body: `{ "sourceType": "all" | "scrape" | "rss" }`
- Fetches scholarships from all configured sources

### Web Scraping
- **POST** `/api/scholarships/scrape`
- Body: `{ "url": "string", "selectors": "object" }`
- Scrapes a specific website for scholarship data

### RSS Feed Parsing
- **POST** `/api/scholarships/rss`
- Body: `{ "feedUrl": "string" }`
- Parses an RSS feed for scholarship updates

### External API Calls
- **POST** `/api/scholarships/external-api`
- Body: `{ "apiUrl": "string", "headers": "object", "params": "object" }`
- Calls external scholarship APIs

### Automation Management
- **GET** `/api/scholarships/automation-logs`
- Returns recent automation logs

- **GET** `/api/scholarships/automation-stats`
- Returns automation statistics

- **GET** `/api/scholarships/automation-config`
- Returns current automation configuration

- **PUT** `/api/scholarships/automation-config`
- Updates automation configuration

- **POST** `/api/scholarships/test-source`
- Tests a specific source configuration

- **POST** `/api/scholarships/trigger-source`
- Manually triggers automation for a specific source

## Configuration

### Scholarship Sources

The service is pre-configured with several scholarship sources:

#### Web Scraping Sources
- Scholarships.com
- Fastweb
- Nigerian Scholarships

#### RSS Sources
- Scholarships.com RSS
- Fastweb RSS

### Customizing Sources

You can modify the `SCHOLARSHIP_SOURCES` and `RSS_SOURCES` arrays in `server.js` to add or remove sources.

### Selectors Configuration

For web scraping, you can configure CSS selectors for each source:

```javascript
{
  name: "Source Name",
  url: "https://example.com/scholarships",
  type: "scrape",
  selectors: {
    container: ".scholarship-item",
    title: ".scholarship-title",
    amount: ".scholarship-amount",
    deadline: ".scholarship-deadline",
    description: ".scholarship-description"
  }
}
```

## Security Features

- **Rate Limiting**: 100 requests per minute per IP
- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Request body validation
- **Error Handling**: Comprehensive error handling

## Scheduled Automation

The service includes a cron job that runs every 6 hours to automatically collect scholarship data:

```javascript
cron.schedule('0 */6 * * *', async () => {
  // Automated data collection
});
```

You can modify the schedule by changing the cron expression.

## Error Handling

The service includes comprehensive error handling:

- Network timeouts (10 seconds)
- Rate limiting responses
- Input validation errors
- Scraping failures
- API call failures

## Logging

The service logs important events:

- Scraping attempts and results
- RSS parsing results
- API call results
- Error messages
- Automation runs

## Testing

Run tests with:
```bash
npm test
```

## Deployment

### Environment Variables for Production

```env
PORT=3001
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t scholarship-backend .
docker run -p 3001:3001 scholarship-backend
```

## Integration with Frontend

The frontend can communicate with this backend service using the `scholarshipBackendService.js` file. The service provides a clean API interface for:

- Fetching external scholarships
- Managing automation
- Monitoring system status
- Testing sources

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `FRONTEND_URL` is correctly set in `.env`
2. **Rate Limiting**: Check if you're making too many requests
3. **Scraping Failures**: Some websites may block automated requests
4. **RSS Parsing Errors**: Invalid RSS feed URLs or formats

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.

