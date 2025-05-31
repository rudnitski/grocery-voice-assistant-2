import { Stagehand } from '@browserbasehq/stagehand';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

// Define the path to the YAML config file
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const configFile = path.join(__dirname, 'ui-home.yaml');
const screenshotsDir = path.join(__dirname, 'screenshots');
const screenshotPath = path.join(screenshotsDir, 'home-page-cloud.png');

async function main() {
    // 1. Load and parse the YAML configuration
    let config;
    try {
        const fileContents = fs.readFileSync(configFile, 'utf8');
        config = yaml.load(fileContents);
    } catch (e) {
        console.error(`Failed to read or parse YAML config file at ${configFile}:`, e);
        process.exit(1);
    }

    if (!config || !config.startUrl) {
        console.error('YAML config must contain a startUrl.');
        process.exit(1);
    }

    const { startUrl, name: testName = 'UI Home Test' } = config;

    console.log(`Starting test: ${testName}`);
    console.log(`Target URL: ${startUrl}`);

    // 2. Initialize Stagehand
    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID) {
        console.error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID environment variables must be set.');
        process.exit(1);
    }

    const stagehand = new Stagehand({
        env: 'BROWSERBASE', // Use Browserbase cloud
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        // modelName and modelClientOptions are not needed for basic navigation and screenshots
    });

    try {
        await stagehand.init();
        const page = stagehand.page;

        // 3. Navigate to the startUrl
        console.log(`Navigating to ${startUrl}...`);
        await page.goto(startUrl, { waitUntil: 'networkidle' }); // Combines goto and wait
        console.log('Navigation complete, network is idle.');

        // 4. Take a screenshot (as per original YAML)
        // The YAML implies a screenshot step, let's implement it.
        // The 'steps' array in YAML is not directly used here as we are coding the logic.
        console.log(`Taking full page screenshot, saving to ${screenshotPath}...`);
        // Enhanced screenshot logic for cloud: get buffer and save manually
        console.log(`Attempting to take screenshot and save to: ${screenshotPath}`);
        try {
            const imageBuffer = await page.screenshot({ fullPage: true }); // No path, should return buffer

            if (imageBuffer instanceof Buffer && imageBuffer.length > 0) {
                // Ensure screenshots directory exists
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                    console.log(`Created directory: ${screenshotsDir}`);
                }
                fs.writeFileSync(screenshotPath, imageBuffer);
                console.log(`SUCCESS: Screenshot saved to ${screenshotPath}`);
                // Verify by checking existence, though writeFileSync should throw on error
                if (!fs.existsSync(screenshotPath)) {
                    console.warn(`WARN: fs.writeFileSync reported success, but file not found immediately at ${screenshotPath}`);
                }
            } else {
                console.error(`ERROR: page.screenshot() did not return a valid Buffer. Type: ${typeof imageBuffer}, Length: ${imageBuffer ? imageBuffer.length : 'N/A'}`);
            }
        } catch (screenshotError) {
            console.error(`ERROR during page.screenshot() or file writing:`, screenshotError);
        }

    } catch (error) {
        console.error('An error occurred during the Stagehand test execution:', error);
    } finally {
        console.log('Closing Stagehand session...');
        await stagehand.close();
        console.log('Session closed.');
    }
}

main().catch(error => {
    console.error("Unhandled error in main execution:", error);
    process.exit(1);
});
